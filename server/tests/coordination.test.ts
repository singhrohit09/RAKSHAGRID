import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { seedDatabase } from '../scripts/seed.js';
import { db } from '../db/connection.js';

describe('RakshaGrid Emergency Coordination, Concurrency & System Health', () => {
  const testAdminPassword = 'CoordAdminPassword#2026!';
  const testResponderPassword = 'CoordResponderPassword#2026!';
  let adminToken = '';
  let responderToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = testAdminPassword;
    process.env.DEV_BOOTSTRAP_PASSWORD = testResponderPassword;
    await seedDatabase(true);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@rakshagrid.gov.in', password: testAdminPassword });
    adminToken = adminLogin.body.token;

    const respLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'responder@rakshagrid.gov.in', password: testResponderPassword });
    responderToken = respLogin.body.token;
  });

  describe('1. Incident Escalation & Response Team Deployment', () => {
    it('POST /api/incidents/:id/escalate - escalates incident severity and logs reason', async () => {
      // Create a test incident
      const createRes = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Canal Bank Subsidence',
          category: 'Infrastructure',
          severity: 'Moderate',
          priority: 'P3',
          locationName: 'East Canal Sector 4',
          latitude: 28.61,
          longitude: 77.25
        });

      const incidentId = createRes.body.id;

      // Reject escalation without reason
      const failRes = await request(app)
        .post(`/api/incidents/${incidentId}/escalate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newSeverity: 'Critical' });
      expect(failRes.status).toBe(400);

      // Reject unauthorized escalation by responder
      const unauthRes = await request(app)
        .post(`/api/incidents/${incidentId}/escalate`)
        .set('Authorization', `Bearer ${responderToken}`)
        .send({
          newSeverity: 'Critical',
          newPriority: 'P1',
          reason: 'Unauthorized field responder attempt.'
        });
      expect(unauthRes.status).toBe(403);

      // Successfully escalate with reason
      const escRes = await request(app)
        .post(`/api/incidents/${incidentId}/escalate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newSeverity: 'Critical',
          newPriority: 'P1',
          reason: 'Rapid structural crack expansion threatening 500 nearby residents.'
        });

      expect(escRes.status).toBe(200);
      expect(escRes.body.severity).toBe('Critical');
      expect(escRes.body.priority).toBe('P1');

      // Verify timeline record
      const incRes = await request(app)
        .get(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const escalationNote = incRes.body.timeline.find((t: any) => t.type === 'escalation');
      expect(escalationNote).toBeDefined();
      expect(escalationNote.note).toContain('Rapid structural crack expansion');
    });

    it('updates team deployment status when assigned to an incident', async () => {
      // Pick existing team
      const teamsRes = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`);
      const team = teamsRes.body[0];

      // Assign to incident
      const incRes = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Substation Transformer Fire',
          category: 'Fire',
          severity: 'High',
          locationName: 'North Power Substation',
          latitude: 28.65,
          longitude: 77.20,
          assignedTeamId: team.id
        });

      expect(incRes.status).toBe(201);

      // Verify team status in database is now 'Deployed'
      const updatedTeam = await db.get<any>('SELECT status, current_assignment FROM teams WHERE id = ?', [team.id]);
      expect(updatedTeam.status).toBe('Deployed');
      expect(updatedTeam.current_assignment).toContain('Substation Transformer Fire');
    });
  });

  describe('2. Shelter Capacity Guard & Authorized Overflow Override', () => {
    it('blocks shelter capacity oversubscription unless authorized override is provided with reason', async () => {
      // Pick first shelter
      const shelters = await request(app)
        .get('/api/shelters')
        .set('Authorization', `Bearer ${adminToken}`);
      const shelter = shelters.body[0];
      const overCapacity = shelter.capacity + 50;

      // Attempt update without override: should be rejected
      const rejectRes = await request(app)
        .put(`/api/shelters/${shelter.id}/occupancy`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ occupancy: overCapacity });

      expect(rejectRes.status).toBe(400);
      expect(rejectRes.body.code).toBe('EXCEEDS_CAPACITY');

      // Attempt update WITH override and reason: should succeed
      const overrideRes = await request(app)
        .put(`/api/shelters/${shelter.id}/occupancy`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          occupancy: overCapacity,
          allowOverflow: true,
          overrideReason: 'Surge evacuee intake from low-lying Yamuna riverfront.'
        });

      expect(overrideRes.status).toBe(200);
      expect(overrideRes.body.isOverflow).toBe(true);
      expect(overrideRes.body.status).toBe('Full');
    });
  });

  describe('3. Concurrency-Safe Inventory Allocation', () => {
    it('prevents over-allocation and negative inventory under race conditions', async () => {
      // Create a test resource with exactly 10 units available
      const resId = `RES-CONCUR-${Date.now()}`;
      await db.run(
        `INSERT INTO resources (id, name, category, quantity_available, quantity_allocated, unit, storage_location, min_threshold, status, updated_at)
         VALUES (?, 'Emergency Trauma Blankets', 'medical', 10, 0, 'pieces', 'Sector 1 Depot', 5, 'Low Stock', ?)`,
        [resId, new Date().toISOString()]
      );

      // Fire 2 concurrent allocation requests for 8 units each (Total 16 requested, but only 10 exist)
      const req1 = request(app)
        .post(`/api/resources/${resId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 8, note: 'Dispatch Battalion Alpha' });

      const req2 = request(app)
        .post(`/api/resources/${resId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 8, note: 'Dispatch Battalion Bravo' });

      const [res1, res2] = await Promise.all([req1, req2]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one request must succeed (200) and one must be rejected (400)
      expect(statuses).toEqual([200, 400]);

      // Verify the final remaining stock in the database is exactly 2, never negative!
      const finalResource = await db.get<any>('SELECT quantity_available, quantity_allocated FROM resources WHERE id = ?', [resId]);
      expect(Number(finalResource.quantity_available)).toBe(2);
      expect(Number(finalResource.quantity_allocated)).toBe(8);
    });
  });

  describe('4. Deep System Health & Integration Status', () => {
    it('GET /api/system/health - reports DB latency, external providers, and data freshness', async () => {
      const res = await request(app).get('/api/system/health');

      expect([200, 503]).toContain(res.status);
      expect(res.body.status).toBeDefined();
      expect(res.body.database).toBeDefined();
      expect(res.body.database.status).toBe('connected');
      expect(res.body.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.body.integrations).toBeDefined();
      expect(res.body.integrations.weather).toBeDefined();
      expect(res.body.integrations.hydrology).toBeDefined();
      expect(res.body.dataFreshness).toBeDefined();
    });
  });
});
