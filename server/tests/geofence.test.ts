import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { seedDatabase } from '../scripts/seed.js';
import { 
  isValidCoordinate, 
  validateGeofenceGeometry, 
  haversineDistanceMeters, 
  isPointInPolygon, 
  isPointInCircle,
  isContainedInGeofence,
  evaluateSpatialContainment,
  GeofenceZone
} from '../services/gis/geofenceEngine.js';

describe('RakshaGrid GIS Geofencing & Spatial Intelligence', () => {
  const testAdminPassword = 'GeofenceAdminPass#2026!';
  let adminToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = testAdminPassword;
    await seedDatabase(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@rakshagrid.gov.in',
        password: testAdminPassword
      });
    adminToken = loginRes.body.token;
  });

  describe('1. Spatial Coordinate & Geometry Validation', () => {
    it('validates geographic coordinates accurately', () => {
      expect(isValidCoordinate(28.6139, 77.2090)).toBe(true);
      expect(isValidCoordinate(90.0, 180.0)).toBe(true);
      expect(isValidCoordinate(-90.0, -180.0)).toBe(true);

      expect(isValidCoordinate(95.0, 77.2090)).toBe(false);
      expect(isValidCoordinate(28.6139, -185.0)).toBe(false);
      expect(isValidCoordinate(NaN, 77.2090)).toBe(false);
    });

    it('validates polygon geometry and rejects degenerate shapes', () => {
      const validTriangle: [number, number][] = [[28.60, 77.20], [28.62, 77.22], [28.60, 77.24]];
      expect(validateGeofenceGeometry('polygon', validTriangle).valid).toBe(true);

      // Only 2 points
      const invalidLine: [number, number][] = [[28.60, 77.20], [28.62, 77.22]];
      expect(validateGeofenceGeometry('polygon', invalidLine).valid).toBe(false);

      // Invalid coordinate inside polygon
      const brokenPoly: [number, number][] = [[28.60, 77.20], [120.0, 77.22], [28.60, 77.24]];
      expect(validateGeofenceGeometry('polygon', brokenPoly).valid).toBe(false);
    });

    it('validates circle geometry requiring valid center and positive radius', () => {
      expect(validateGeofenceGeometry('circle', [[28.61, 77.20]], 1500).valid).toBe(true);
      expect(validateGeofenceGeometry('circle', [[28.61, 77.20]], -50).valid).toBe(false);
      expect(validateGeofenceGeometry('circle', [[28.61, 77.20]], 0).valid).toBe(false);
      expect(validateGeofenceGeometry('circle', []).valid).toBe(false);
    });
  });

  describe('2. Geodesic Distance & Ray-Casting Point-in-Polygon Algorithm', () => {
    it('calculates Haversine distance with high accuracy', () => {
      // Distance between Connaught Place (28.6315, 77.2167) and India Gate (28.6129, 77.2295) ~2.4km
      const distance = haversineDistanceMeters(28.6315, 77.2167, 28.6129, 77.2295);
      expect(distance).toBeGreaterThan(2000);
      expect(distance).toBeLessThan(2600);
    });

    it('accurately identifies points inside and outside a circular buffer', () => {
      const centerLat = 28.6139;
      const centerLng = 77.2090;
      const radiusMeters = 1000; // 1km

      // Very close point (~200m away)
      expect(isPointInCircle(28.6150, 77.2090, centerLat, centerLng, radiusMeters)).toBe(true);

      // Distant point (~5km away)
      expect(isPointInCircle(28.6500, 77.2090, centerLat, centerLng, radiusMeters)).toBe(false);
    });

    it('correctly determines inclusion for complex polygons using ray-casting', () => {
      // Defined square polygon around New Delhi core: [28.60, 77.20] to [28.65, 77.25]
      const boundingSquare: [number, number][] = [
        [28.60, 77.20],
        [28.65, 77.20],
        [28.65, 77.25],
        [28.60, 77.25]
      ];

      // Point inside
      expect(isPointInPolygon(28.625, 77.225, boundingSquare)).toBe(true);

      // Point outside horizontally
      expect(isPointInPolygon(28.625, 77.300, boundingSquare)).toBe(false);

      // Point outside vertically
      expect(isPointInPolygon(28.700, 77.225, boundingSquare)).toBe(false);
    });
  });

  describe('3. Multi-Entity Spatial Containment Evaluator', () => {
    it('detects operational entities enclosed within risk zones', () => {
      const mockZone: GeofenceZone = {
        id: 'ZONE-TEST-01',
        name: 'Flash Flood Risk Zone',
        category: 'Flood Risk',
        severity: 'High',
        status: 'Active',
        shapeType: 'polygon',
        coordinates: [
          [28.60, 77.20],
          [28.70, 77.20],
          [28.70, 77.30],
          [28.60, 77.30]
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockIncidents = [
        { id: 'INC-IN-01', latitude: 28.65, longitude: 77.25, type: 'incident' as const },
        { id: 'INC-OUT-02', latitude: 28.80, longitude: 77.25, type: 'incident' as const }
      ];

      const mockTeams = [
        { id: 'TEAM-IN-01', latitude: 28.62, longitude: 77.22, type: 'team' as const }
      ];

      const mockShelters = [
        { id: 'SHELTER-IN-01', latitude: 28.68, longitude: 77.28, type: 'shelter' as const }
      ];

      const report = evaluateSpatialContainment([mockZone], mockIncidents, mockTeams, mockShelters);

      expect(report.activeZones).toBe(1);
      const evalItem = report.evaluations[0];
      expect(evalItem.containedIncidents).toContain('INC-IN-01');
      expect(evalItem.containedIncidents).not.toContain('INC-OUT-02');
      expect(evalItem.containedTeams).toContain('TEAM-IN-01');
      expect(evalItem.containedShelters).toContain('SHELTER-IN-01');
      expect(report.incidentZoneMap['INC-IN-01']).toContain('Flash Flood Risk Zone');

      // Direct isContainedInGeofence verification
      expect(isContainedInGeofence(28.65, 77.25, mockZone)).toBe(true);
      expect(isContainedInGeofence(28.80, 77.25, mockZone)).toBe(false);
    });
  });

  describe('4. Geofence REST API Endpoints', () => {
    it('GET /api/geofences - retrieves seeded hazard zones', async () => {
      const res = await request(app).get('/api/geofences');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const yamunaZone = res.body.find((z: any) => z.id === 'ZONE-YAMUNA-FLOOD');
      expect(yamunaZone).toBeDefined();
      expect(yamunaZone.category).toBe('Flood Risk');
      expect(yamunaZone.shapeType).toBe('polygon');
      expect(Array.isArray(yamunaZone.coordinates)).toBe(true);
    });

    it('GET /api/geofences/eval - executes live containment analysis against database records', async () => {
      const res = await request(app).get('/api/geofences/eval');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report).toBeDefined();
      expect(res.body.report.activeZones).toBeGreaterThan(0);
      expect(Array.isArray(res.body.report.evaluations)).toBe(true);
    });

    it('POST /api/geofences - creates a new geofenced risk zone when authenticated', async () => {
      const newZonePayload = {
        name: 'Okhla Evacuation Perimeter',
        category: 'Evacuation Zone',
        severity: 'Critical',
        shapeType: 'circle',
        coordinates: [[28.5355, 77.2730]],
        radiusMeters: 2000,
        description: 'Temporary containment barrier around low-lying canal outlet'
      };

      const res = await request(app)
        .post('/api/geofences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newZonePayload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.zone.name).toBe('Okhla Evacuation Perimeter');
    });

    it('POST /api/geofences - rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/geofences')
        .send({
          name: 'Unauthorized Zone',
          category: 'Test',
          coordinates: [[28.5, 77.2], [28.6, 77.2], [28.6, 77.3]]
        });

      expect(res.status).toBe(401);
    });

    it('POST /api/geofences - rejects invalid geometry with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/geofences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Broken Zone',
          category: 'Test',
          shapeType: 'polygon',
          coordinates: [[28.5, 77.2]] // only 1 vertex
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 3 vertex coordinates');
    });
  });
});
