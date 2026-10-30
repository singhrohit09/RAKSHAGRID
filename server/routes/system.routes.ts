import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { openMeteoWeather } from '../services/external/openMeteoProvider.js';
import { hydrologyAndHazard } from '../services/external/hydrologyProvider.js';
import { notificationDeduplicator } from '../services/notifications/deduplicator.js';

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

export default router;
