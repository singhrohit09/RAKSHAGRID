import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { interpretWmoCode } from '../services/external/wmoCodes.js';
import { ExternalDataCache } from '../services/external/cache.js';
import { OpenMeteoWeatherProvider } from '../services/external/openMeteoProvider.js';

describe('RakshaGrid External Provider & Telemetry Integration', () => {
  describe('WMO Meteorological Code Interpretation', () => {
    it('correctly categorizes standard weather conditions', () => {
      expect(interpretWmoCode(0)).toEqual({
        description: 'Clear sky',
        condition: 'clear',
        severity: 'normal'
      });

      expect(interpretWmoCode(65)).toEqual({
        description: 'Heavy rain',
        condition: 'heavy_rain',
        severity: 'warning'
      });

      expect(interpretWmoCode(95)).toEqual({
        description: 'Thunderstorm (Slight or moderate)',
        condition: 'thunderstorm',
        severity: 'warning'
      });

      expect(interpretWmoCode(99)).toEqual({
        description: 'Severe thunderstorm with hail',
        condition: 'thunderstorm',
        severity: 'critical'
      });
    });

    it('escalates to critical severity when high wind speed or violent rain is detected', () => {
      const severeWind = interpretWmoCode(3, 105, 10);
      expect(severeWind.condition).toBe('cyclonic_storm');
      expect(severeWind.severity).toBe('critical');

      const torrentialRain = interpretWmoCode(61, 20, 75);
      expect(torrentialRain.condition).toBe('cyclonic_storm');
      expect(torrentialRain.severity).toBe('critical');
    });
  });

  describe('In-Memory Telemetry Cache & Stale-While-Revalidate', () => {
    let cache: ExternalDataCache<{ temp: number }>;

    beforeEach(() => {
      // 50ms TTL, 150ms stale grace
      cache = new ExternalDataCache<{ temp: number }>(50, 150);
    });

    it('stores and retrieves fresh cached items', () => {
      cache.set('key1', { temp: 25.5 });
      const entry = cache.get('key1');
      expect(entry).not.toBeNull();
      expect(entry?.data.temp).toBe(25.5);
      expect(entry?.isStale).toBe(false);
    });

    it('returns stale data when expired within grace window', async () => {
      cache.set('key2', { temp: 31.0 });
      // Wait for expiration
      await new Promise(r => setTimeout(r, 60));

      const entry = cache.get('key2');
      expect(entry).not.toBeNull();
      expect(entry?.data.temp).toBe(31.0);
      expect(entry?.isStale).toBe(true);
    });

    it('reports cache hit and miss statistics', () => {
      cache.set('keyA', { temp: 20 });
      cache.get('keyA'); // hit
      cache.get('keyB'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('Open-Meteo Provider Normalization & Fallbacks', () => {
    it('produces deterministic simulated fallback for disconnected environments', () => {
      const provider = new OpenMeteoWeatherProvider({ timeoutMs: 100 });
      const fallback = provider.getSimulatedFallback(28.61, 77.20);

      expect(fallback.latitude).toBe(28.61);
      expect(fallback.longitude).toBe(77.20);
      expect(fallback.isLive).toBe(false);
      expect(fallback.source).toContain('Simulated');
      expect(fallback.temperatureC).toBeGreaterThan(0);
    });

    it('tracks provider health and operational state', () => {
      const provider = new OpenMeteoWeatherProvider();
      const health = provider.getHealth();

      expect(health.serviceType).toBe('weather');
      expect(['operational', 'degraded', 'cached', 'offline']).toContain(health.status);
      expect(typeof health.requestsCount).toBe('number');
    });
  });

  describe('REST Endpoints: /api/external/*', () => {
    it('GET /api/external/weather - returns normalized weather telemetry for valid coordinates', async () => {
      const res = await request(app)
        .get('/api/external/weather')
        .query({ lat: 28.6139, lng: 77.2090 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.latitude).toBeCloseTo(28.61, 1);
      expect(res.body.data.longitude).toBeCloseTo(77.21, 1);
      expect(typeof res.body.data.temperatureC).toBe('number');
      expect(typeof res.body.data.relativeHumidity).toBe('number');
      expect(typeof res.body.data.windSpeedKmh).toBe('number');
      expect(res.body.data.source).toBeDefined();
      expect(typeof res.body.data.isLive).toBe('boolean');
    });

    it('GET /api/external/weather - rejects invalid coordinates with HTTP 400', async () => {
      const res = await request(app)
        .get('/api/external/weather')
        .query({ lat: 195.0, lng: 77.2090 }); // Invalid lat > 90

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid coordinates');
    });

    it('GET /api/external/river-gauges - returns hydrological telemetry and flood stages', async () => {
      const res = await request(app)
        .get('/api/external/river-gauges');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const firstGauge = res.body.data[0];
      expect(firstGauge.stationId).toBeDefined();
      expect(firstGauge.riverName).toBeDefined();
      expect(firstGauge.floodStage).toBeDefined();
      expect(typeof firstGauge.waterLevelMeters).toBe('number');
    });

    it('GET /api/external/hazards - returns active external meteorological warnings', async () => {
      const res = await request(app)
        .get('/api/external/hazards');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const firstWarning = res.body.data[0];
      expect(firstWarning.id).toBeDefined();
      expect(firstWarning.headline).toBeDefined();
      expect(firstWarning.severity).toBeDefined();
      expect(firstWarning.issuingAgency).toBeDefined();
    });

    it('GET /api/external/status - reports provider connectivity and cache metrics', async () => {
      const res = await request(app)
        .get('/api/external/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.providers).toBeDefined();
      expect(Array.isArray(res.body.providers)).toBe(true);
      expect(res.body.overallStatus).toBeDefined();
    });
  });
});
