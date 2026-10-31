import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { openMeteoWeather } from '../services/external/openMeteoProvider.js';
import { hydrologyAndHazard } from '../services/external/hydrologyProvider.js';
import { notificationDeduplicator } from '../services/notifications/deduplicator.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { seedDatabase } from '../scripts/seed.js';
import { getRateLimiterStatus } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * GET /api/system/health
 * Comprehensive operational integration health endpoint.
 * Evaluates database ping latency, external provider statuses, data freshness,
 * geofence engine metrics, and notification queue status.
 */
router.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;
  let activeIncidentsCount = 0;
  let activeGeofencesCount = 0;

  try {
    const dbPingStart = Date.now();
    const result = await db.get<{ ok: number }>('SELECT 1 as ok');
    dbLatencyMs = Date.now() - dbPingStart;
    dbStatus = result && result.ok === 1 ? 'connected' : 'error';

    const incRow = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM incidents WHERE status != 'Closed'");
    activeIncidentsCount = incRow ? Number(incRow.count) : 0;

    const geoRow = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM geofences WHERE status = 'Active'");
    activeGeofencesCount = geoRow ? Number(geoRow.count) : 0;
  } catch (err: any) {
    dbStatus = 'error';
    console.error('System health check DB failure:', err.message);
  }

  // External providers status
  const weatherHealth = openMeteoWeather.getHealth();
  const hydroHealth = hydrologyAndHazard.getHealth();
  const dedupeStats = notificationDeduplicator.getStats();

  const isDegraded = dbStatus !== 'connected' || weatherHealth.status === 'offline' || hydroHealth.status === 'offline';
  const overallStatus = isDegraded ? 'degraded' : 'healthy';

  const isProduction = process.env.NODE_ENV === 'production';
  const operationalMode = isProduction ? 'LIVE_PRODUCTION' : 'DEVELOPMENT_FULLSTACK';

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    operationalMode,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      dialect: db.getEngine(),
      latencyMs: dbLatencyMs,
      activeIncidents: activeIncidentsCount,
      activeGeofences: activeGeofencesCount
    },
    integrations: {
      weather: weatherHealth,
      hydrology: hydroHealth,
      notifications: {
        activeProviders: ['in_app', 'webhook', 'sms_simulated'],
        deduplicationKeysActive: dedupeStats.trackedKeys
      }
    },
    dataFreshness: {
      weatherLastSync: weatherHealth.lastSuccess,
      weatherStale: weatherHealth.status === 'cached' || weatherHealth.status === 'offline',
      hydrologyLastSync: hydroHealth.lastSuccess,
      hydrologyStale: hydroHealth.status === 'cached' || hydroHealth.status === 'offline'
    }
  });
});

/**
 * GET /api/system/metrics
 * Returns server resource utilization, uptime, memory usage, rate limiter status, and table telemetry.
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  let tableCounts = {
    incidents: 0,
    teams: 0,
    shelters: 0,
    resources: 0,
    tasks: 0,
    alerts: 0,
    geofences: 0,
    aiExecutions: 0,
    aiRecommendations: 0
  };

  try {
    const [inc, tm, sh, resCount, tsk, alt, geo, aiexec, airec] = await Promise.all([
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM incidents'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM teams'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM shelters'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM resources'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM tasks'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM alerts'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM geofences'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM ai_agent_executions'),
      db.get<{ c: number }>('SELECT COUNT(*) as c FROM ai_recommendations')
    ]);

    tableCounts = {
      incidents: inc ? Number(inc.c) : 0,
      teams: tm ? Number(tm.c) : 0,
      shelters: sh ? Number(sh.c) : 0,
      resources: resCount ? Number(resCount.c) : 0,
      tasks: tsk ? Number(tsk.c) : 0,
      alerts: alt ? Number(alt.c) : 0,
      geofences: geo ? Number(geo.c) : 0,
      aiExecutions: aiexec ? Number(aiexec.c) : 0,
      aiRecommendations: airec ? Number(airec.c) : 0
    };
  } catch (err: any) {
    console.error('Error fetching system table counts:', err.message);
  }

  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'development'
    },
    memory: {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      externalMb: Math.round((mem.external / 1024 / 1024) * 100) / 100
    },
    database: {
      dialect: db.getEngine(),
      status: 'operational'
    },
    rateLimiting: getRateLimiterStatus(),
    telemetryCounts: tableCounts
  });
});

/**
 * POST /api/system/reset-demo
 * Resets the application state back to baseline demonstration records.
 * Requires administrator privileges ('reset_demo_data').
 */
router.post('/reset-demo', authenticate, requirePermission('reset_demo_data'), async (req: Request, res: Response) => {
  try {
    console.log(`🔄 Demo reset initiated by ${req.user?.displayName} (${req.user?.email}, role: ${req.user?.role})`);

    // Reseed baseline mock disaster intelligence records
    await seedDatabase(true);

    // Record audit event
    const auditId = `AUD-DEMO-RESET-${Date.now()}`;
    await db.run(
      `INSERT INTO audit_events (id, timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, description, metadata)
       VALUES (?, ?, ?, ?, ?, 'DEMO_DATA_RESET', 'SYSTEM', 'DATABASE', ?, ?)`,
      [
        auditId,
        new Date().toISOString(),
        req.user?.id || 'SYSTEM',
        req.user?.displayName || 'Administrator',
        req.user?.role || 'admin',
        'Demonstration data reset to initial benchmark state for live hackathon presentation.',
        JSON.stringify({ triggeredBy: req.user?.email, ip: req.ip })
      ]
    );

    res.json({
      success: true,
      message: 'RakshaGrid demonstration environment successfully reset to baseline operational state.',
      timestamp: new Date().toISOString(),
      resetBy: req.user?.email
    });
  } catch (error: any) {
    console.error('Demo data reset failure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset demonstration state: ' + error.message
    });
  }
});

export default router;
