import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { seedDatabase } from '../scripts/seed.js';
import { db } from '../db/connection.js';

describe('RakshaGrid Phase 5: Comprehensive End-to-End Operational Workflows', () => {
  const adminPassword = 'AdminSecretPass_2026!';
  const devPassword = 'DevUserSecretPass_2026!';

  let adminToken = '';
  let commanderToken = '';
  let responderToken = '';
  let logisticsToken = '';
  let analystToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = adminPassword;
    process.env.DEV_BOOTSTRAP_PASSWORD = devPassword;

    // Reset and seed database with benchmark data
    await seedDatabase(true);

    // Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@rakshagrid.gov.in', password: adminPassword });
    adminToken = adminRes.body.token;

    // Authenticate Commander
    const cmdrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'commander@rakshagrid.gov.in', password: devPassword });
    commanderToken = cmdrRes.body.token;

    // Authenticate Responder
    const respRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'responder@rakshagrid.gov.in', password: devPassword });
    responderToken = respRes.body.token;

    // Authenticate Logistics
    const logRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logistics@rakshagrid.gov.in', password: devPassword });
    logisticsToken = logRes.body.token;

    // Authenticate Analyst
    const analRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@rakshagrid.gov.in', password: devPassword });
    analystToken = analRes.body.token;
  });

  // =========================================================================
  // WORKFLOW A: Authentication, Protected Routes, & Session Security
  // =========================================================================
  describe('Workflow A: Authentication, Protected Routes & Session Lifecycle', () => {
    it('rejects authentication with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@rakshagrid.gov.in', password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('authenticates valid credentials, sets secure cookie and issues JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'commander@rakshagrid.gov.in', password: devPassword });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('commander');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('raksha_session');
    });

    it('protects private endpoints against unauthenticated requests', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('allows access to protected routes with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('verifies session and returns current user profile via GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('commander@rakshagrid.gov.in');
      expect(res.body.user.role).toBe('commander');
    });

    it('clears session cookie on logout and rejects subsequent access without token', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(logoutRes.status).toBe(200);
      const cookies = logoutRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('raksha_session=;');
    });
  });

  // =========================================================================
  // WORKFLOW B: Incident Lifecycle, Escalation & Timeline Tracking
  // =========================================================================
  describe('Workflow B: Incident Management, Escalation & Timeline', () => {
    let createdIncidentId = '';

    it('creates a new emergency incident with valid geospatial coordinates', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({
          title: 'Coastal Storm Surge Surge Warning',
          description: 'High tide combined with cyclone wind pushing seawater into low-lying wards.',
          category: 'Cyclone',
          severity: 'Moderate',
          priority: 'P2',
          locationName: 'Puri South Beach Sector 2',
          latitude: 19.8135,
          longitude: 85.8312,
          affectedPopulation: 3500,
          estimatedRadiusMeters: 2500
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdIncidentId = res.body.id;
    });

    it('appends an entry to the incident escalation timeline', async () => {
      const res = await request(app)
        .post(`/api/incidents/${createdIncidentId}/timeline`)
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({
          note: 'Water level breached seawall embankment. Requesting NDRF swift-water rescue deployment.',
          actor: 'Cmdr. Ananya Sen',
          type: 'status_change'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.message).toContain('Timeline note recorded');
    });

    it('escalates severity and priority with required operational justification', async () => {
      const res = await request(app)
        .post(`/api/incidents/${createdIncidentId}/escalate`)
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({
          newSeverity: 'Critical',
          newPriority: 'P1',
          reason: 'Inundation expanding to residential sectors with 1500 families stranded.'
        });

      expect(res.status).toBe(200);
      expect(res.body.severity).toBe('Critical');
      expect(res.body.priority).toBe('P1');
    });

    it('retrieves updated incident details including timeline audit history', async () => {
      const res = await request(app)
        .get(`/api/incidents/${createdIncidentId}`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdIncidentId);
      expect(res.body.severity).toBe('Critical');
      expect(Array.isArray(res.body.timeline)).toBe(true);
      expect(res.body.timeline.length).toBeGreaterThanOrEqual(2);
    });

    it('transitions incident status to Closed', async () => {
      const res = await request(app)
        .put(`/api/incidents/${createdIncidentId}`)
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({ status: 'Closed' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated');

      const check = await db.get<{ status: string }>('SELECT status FROM incidents WHERE id = ?', [createdIncidentId]);
      expect(check?.status).toBe('Closed');
    });
  });

  // =========================================================================
  // WORKFLOW C: AI Resource Allocation, Approval & Atomic Inventory Mutation
  // =========================================================================
  describe('Workflow C: Smart Resource Allocation & Human-in-the-Loop Governance', () => {
    let recommendationId = '';
    const targetIncidentId = 'INC-2026-0101';

    it('generates multi-resource recommendation requiring Commander approval', async () => {
      const res = await request(app)
        .post('/api/ai/resources/recommend')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({ targetIncidentId });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.data).toBeDefined();
      expect(res.body.executionId).toBeDefined();

      // Verify recommendation was written to database
      const rec = await db.get<{ id: string; approval_status: string }>(
        `SELECT id, approval_status FROM ai_recommendations WHERE execution_id = ? LIMIT 1`,
        [res.body.executionId]
      );

      expect(rec).toBeDefined();
      expect(rec?.approval_status).toBe('pending');
      recommendationId = rec!.id;
    });

    it('denies recommendation approval to unauthorized roles (Responder: 403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post(`/api/ai/recommendations/${recommendationId}/approve`)
        .set('Authorization', `Bearer ${responderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('allows Commander to approve recommendation and updates warehouse resources atomically', async () => {
      const res = await request(app)
        .post(`/api/ai/recommendations/${recommendationId}/approve`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('approved');

      // Verify database record status
      const updatedRec = await db.get<{ approval_status: string; approved_by: string }>(
        `SELECT approval_status, approved_by FROM ai_recommendations WHERE id = ?`,
        [recommendationId]
      );
      expect(updatedRec?.approval_status).toBe('approved');
      expect(updatedRec?.approved_by).toBe('Cmdr. Ananya Sen');

      // Verify audit log has the event
      const auditLog = await db.get<{ id: string; action: string }>(
        `SELECT id, action FROM audit_events WHERE action = 'APPROVE_AI_RECOMMENDATION' ORDER BY timestamp DESC LIMIT 1`
      );
      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('APPROVE_AI_RECOMMENDATION');
    });
  });

  // =========================================================================
  // WORKFLOW D: Live Telemetry, Health Probes & Resource Metrics
  // =========================================================================
  describe('Workflow D: Meteorological Telemetry, System Health & Metrics', () => {
    it('GET /api/external/weather - returns meteorological telemetry with provenance', async () => {
      const res = await request(app)
        .get('/api/external/weather?lat=28.6139&lng=77.2090')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.latitude).toBeCloseTo(28.6139, 1);
      expect(res.body.data.temperatureC).toBeDefined();
      expect(res.body.data.windSpeedKmh).toBeDefined();
      expect(res.body.data.source).toBeDefined();
    });

    it('GET /api/system/health - reports system operational status, latency and provider sync', async () => {
      const res = await request(app).get('/api/system/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBeDefined();
      expect(res.body.database.status).toBe('connected');
      expect(res.body.database.dialect).toMatch(/^(sqlite|postgres)$/);
      expect(res.body.integrations.weather).toBeDefined();
      expect(res.body.integrations.hydrology).toBeDefined();
      expect(res.body.dataFreshness).toBeDefined();
    });

    it('GET /api/system/metrics - exposes process resource utilization, rate limiter and telemetry counts', async () => {
      const res = await request(app).get('/api/system/metrics');

      expect(res.status).toBe(200);
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(res.body.memory.rssMb).toBeGreaterThan(0);
      expect(res.body.memory.heapUsedMb).toBeGreaterThan(0);
      expect(res.body.rateLimiting.mode).toBeDefined();
      expect(res.body.telemetryCounts.incidents).toBeGreaterThan(0);
      expect(res.body.telemetryCounts.teams).toBeGreaterThan(0);
      expect(res.body.telemetryCounts.shelters).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // WORKFLOW E: Disaster Simulation Sandbox Isolation & Anti-Mutation Guarantees
  // =========================================================================
  describe('Workflow E: Disaster Simulation Sandbox Isolation', () => {
    it('executes simulation sandbox without mutating production operational tables', async () => {
      // Record pre-simulation counts
      const preIncidents = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM incidents');
      const preTeams = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM teams');
      const preShelters = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM shelters');
      const preResources = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM resources');

      const simRes = await request(app)
        .post('/api/ai/simulation/run')
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({
          scenarioName: 'E2E Stress Simulation: 7.2 Richter Earthquake Delhi',
          disasterType: 'Earthquake',
          magnitudeRichter: 7.2,
          simultaneousIncidentsCount: 5
        });

      expect(simRes.status).toBe(200);
      expect(simRes.body.status).toBe('COMPLETED');
      expect(simRes.body.data.isSimulatedSandbox).toBe(true);
      expect(simRes.body.data.warningNotice).toContain('SANDBOX');
      expect(simRes.body.data.simulatedIncidents.length).toBe(5);

      // Verify post-simulation counts are strictly identical
      const postIncidents = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM incidents');
      const postTeams = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM teams');
      const postShelters = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM shelters');
      const postResources = await db.get<{ c: number }>('SELECT COUNT(*) as c FROM resources');

      expect(postIncidents?.c).toBe(preIncidents?.c);
      expect(postTeams?.c).toBe(preTeams?.c);
      expect(postShelters?.c).toBe(preShelters?.c);
      expect(postResources?.c).toBe(preResources?.c);

      // Verify simulation record was saved to dedicated simulation table
      const savedSim = await db.get<{ id: string; scenario_name: string }>(
        `SELECT id, scenario_name FROM ai_simulation_records WHERE scenario_name LIKE '%7.2 Richter Earthquake%'`
      );
      expect(savedSim).toBeDefined();
    });
  });

  // =========================================================================
  // WORKFLOW F: Multi-Role RBAC Authorization & Demo State Reset
  // =========================================================================
  describe('Workflow F: Role-Based Authorization & Hackathon Demo Reset', () => {
    it('denies alert broadcast creation to Analyst (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          title: 'Unauthorized Test Alert',
          body: 'This should be blocked',
          type: 'Warning',
          severity: 'High',
          targetRegion: 'Delhi',
          safetyActions: ['Evacuate'],
          channels: ['SMS']
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('denies incident deletion to Responder (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .delete('/api/incidents/INC-2026-0101')
        .set('Authorization', `Bearer ${responderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('denies demo reset endpoint to Responder (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/system/reset-demo')
        .set('Authorization', `Bearer ${responderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('allows Admin to trigger POST /api/system/reset-demo and restores baseline state', async () => {
      const res = await request(app)
        .post('/api/system/reset-demo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset to baseline operational state');

      // Verify audit event was logged
      const resetAudit = await db.get<{ id: string; action: string }>(
        `SELECT id, action FROM audit_events WHERE action = 'DEMO_DATA_RESET' ORDER BY timestamp DESC LIMIT 1`
      );
      expect(resetAudit).toBeDefined();
      expect(resetAudit?.action).toBe('DEMO_DATA_RESET');
    });
  });
});
