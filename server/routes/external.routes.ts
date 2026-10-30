import { Router, Request, Response } from 'express';
import { openMeteoWeather } from '../services/external/openMeteoProvider.js';
import { hydrologyAndHazard } from '../services/external/hydrologyProvider.js';

const router = Router();

/**
 * GET /api/external/weather
 * Retrieves live normalized weather telemetry for specified coordinates.
 * Query params: lat (default: 28.6139), lng (default: 77.2090)
 */
router.get('/weather', async (req: Request, res: Response) => {
  try {
    const latStr = req.query.lat as string;
    const lngStr = req.query.lng as string;

    const lat = latStr ? parseFloat(latStr) : 28.6139;
    const lng = lngStr ? parseFloat(lngStr) : 77.2090;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
      });
      return;
    }

    const report = await openMeteoWeather.getWeather(lat, lng);
    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('External weather provider failure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve external weather telemetry',
      details: error.message
    });
  }
});

/**
 * GET /api/external/river-gauges
 * Retrieves river gauge telemetry and flood stages.
 */
router.get('/river-gauges', async (_req: Request, res: Response) => {
  try {
    const gauges = await hydrologyAndHazard.getRiverGauges();
    res.json({
      success: true,
      data: gauges
    });
  } catch (error: any) {
    console.error('River gauge retrieval failure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hydrological river gauge data'
    });
  }
});

/**
 * GET /api/external/hazards
 * Retrieves active external hazard warnings from meteorological agencies.
 */
router.get('/hazards', async (_req: Request, res: Response) => {
  try {
    const warnings = await hydrologyAndHazard.getExternalHazardWarnings();
    res.json({
      success: true,
      data: warnings
    });
  } catch (error: any) {
    console.error('Hazard warnings retrieval failure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve external hazard warnings'
    });
  }
});

/**
 * GET /api/external/status
 * Reports the operational status, latency, and cache statistics of external providers.
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const weatherHealth = openMeteoWeather.getHealth();
    const hydroHealth = hydrologyAndHazard.getHealth();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: [weatherHealth, hydroHealth],
      overallStatus: weatherHealth.status === 'operational' && hydroHealth.status === 'operational' ? 'healthy' : 'degraded'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate external provider status'
    });
  }
});

export default router;
