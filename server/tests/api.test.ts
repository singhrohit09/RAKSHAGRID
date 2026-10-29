import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { seedDatabase } from '../scripts/seed.js';

describe('RakshaGrid Operational Backend API', () => {
  const testAdminPassword = 'TestAdminPassword#2026!';
  const testResponderPassword = 'TestResponderPassword#2026!';
  let adminToken = '';
  let responderToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = testAdminPassword;
    process.env.DEV_BOOTSTRAP_PASSWORD = testResponderPassword;
    await seedDatabase(true);
  });

  describe('System Health & Status', () => {
    it('returns healthy status and database connection state', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('RakshaGrid Operational Backend API');
      expect(res.body.database).toBe('connected');
    });

    it('returns 404 for undefined endpoints', async () => {
      const res = await request(app).get('/api/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Authentication & Session Management', () => {
    it('authenticates admin with valid credentials and sets session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@rakshagrid.gov.in',
          password: testAdminPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@rakshagrid.gov.in');
      expect(res.body.user.role).toBe('admin');
      expect(res.body.token).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();

      adminToken = res.body.token;
    });

    it('authenticates responder with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'responder@rakshagrid.gov.in',
          password: testResponderPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('responder');
      responderToken = res.body.token;
    });

    it('rejects authentication with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@rakshagrid.gov.in',
          password: 'WrongPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or credentials.');
    });

    it('returns current session profile with granted permissions via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user.role).toBe('admin');
      expect(res.body.permissions).toContain('create_incidents');
      expect(res.body.permissions).toContain('approve_alerts');
      expect(res.body.permissions).toContain('change_settings');
    });

    it('registers a new responder user and returns session', async () => {
      const testEmail = `operator_${Date.now()}@rakshagrid.gov.in`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'SecurePassword@2026',
          displayName: 'Test Operator',
          role: 'responder',
          department: 'Field Rescue Team',
          callsign: 'RESCUE-TEST'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('blocks unauthenticated requests to protected incident registry', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('allows responder to view incidents', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${responderToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('forbids responder from approving emergency alerts (requires approve_alerts permission)', async () => {
      // Pick any alert ID
      const res = await request(app)
        .post('/api/alerts/ALT-2026-001/approve')
        .set('Authorization', `Bearer ${responderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('allows admin to approve demo alerts and records audit approval', async () => {
      const res = await request(app)
        .post('/api/alerts/ALT-2026-001/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Approved for Demo');
      expect(res.body.approvedBy).toContain('ADMIN');
    });
  });

  describe('Business Rules & Server-Side Validation', () => {
    describe('Resource Inventory & Allocation Logic', () => {
      it('rejects resource allocation when requested amount exceeds available stock', async () => {
        // RES-WAT-001 has 4200 available
        const res = await request(app)
          .post('/api/resources/RES-WAT-001/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            quantity: 99999, // Way more than available stock
            incidentId: 'INC-2026-0101',
            note: 'Excessive allocation test'
          });

        expect(res.status).toBe(400);
        expect(res.body.error.toLowerCase()).toContain('stock');
      });

      it('successfully allocates resource within available limits and decrements stock', async () => {
        const res = await request(app)
          .post('/api/resources/RES-WAT-001/allocate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            quantity: 50,
            incidentId: 'INC-2026-0101',
            note: 'Dispatched to zone alpha'
          });

        expect(res.status).toBe(200);
        expect(res.body.resource).toBeDefined();
        expect(res.body.resource.quantityAvailable).toBeLessThanOrEqual(4150);
      });
    });

    describe('Shelter Occupancy & Capacity Safety', () => {
      it('rejects shelter occupancy exceeding maximum capacity without override', async () => {
        // SHL-NORTH-01 has capacity 1200
        const res = await request(app)
          .post('/api/shelters/SHL-NORTH-01/occupancy')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            currentOccupancy: 2500, // Exceeds capacity 1200
            forceOverride: false
          });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('EXCEEDS_CAPACITY');
        expect(res.body.error).toContain('exceeds safe shelter capacity');
      });

      it('permits shelter overflow only when explicit operational override is provided', async () => {
        const res = await request(app)
          .post('/api/shelters/SHL-NORTH-01/occupancy')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            currentOccupancy: 1350,
            forceOverride: true
          });

        expect(res.status).toBe(200);
        expect(res.body.shelter.currentOccupancy).toBe(1350);
        expect(res.body.shelter.status).toBe('Full');
      });
    });

    describe('Incident Coordinates Validation', () => {
      it('rejects incident creation with out-of-range coordinates', async () => {
        const res = await request(app)
          .post('/api/incidents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Invalid Coordinate Incident',
            category: 'flood',
            severity: 'critical',
            locationName: 'Test Area',
            latitude: 195.0, // Invalid latitude (> 90)
            longitude: 80.0,
            description: 'Testing coordinate boundary validation',
            affectedCount: 100
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('valid coordinate');
      });
    });
  });

  describe('Application-Level Operational Audit Trail', () => {
    it('records and returns audit logs for operational mutations', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify audit event structure
      const sampleEvent = res.body.data[0];
      expect(sampleEvent.id).toBeDefined();
      expect(sampleEvent.timestamp).toBeDefined();
      expect(sampleEvent.actor_name).toBeDefined();
      expect(sampleEvent.action).toBeDefined();
      expect(sampleEvent.entity_type).toBeDefined();
    });

    it('exports audit trail as CSV', async () => {
      const res = await request(app)
        .get('/api/audit/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('id,timestamp,actor_id,actor_name');
    });
  });
});
