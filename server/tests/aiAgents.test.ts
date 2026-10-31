import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { db } from '../db/connection.js';
import { seedDatabase } from '../scripts/seed.js';
import { disasterRiskAgent } from '../services/ai/agents/disasterRiskAgent.js';
import { incidentIntelligenceAgent } from '../services/ai/agents/incidentIntelligenceAgent.js';
import { resourceAllocationAgent } from '../services/ai/agents/resourceAllocationAgent.js';
import { responseCoordinatorAgent } from '../services/ai/agents/responseCoordinatorAgent.js';
import { disasterSimulationAgent } from '../services/ai/agents/disasterSimulationAgent.js';
import { orchestrator } from '../services/ai/orchestrator.js';

describe('RakshaGrid Phase 4: Multi-Agent AI & Disaster Intelligence Test Suite', () => {
  const adminPassword = 'AdminSecureSecret#2026!';
  const responderPassword = 'ResponderSecureSecret#2026!';
  
  let adminToken = '';
  let commanderToken = '';
  let responderToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = adminPassword;
    process.env.DEV_BOOTSTRAP_PASSWORD = responderPassword;
    await seedDatabase(true);

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@rakshagrid.gov.in', password: adminPassword });
    adminToken = adminRes.body.token;

    // Login Commander
    const cmdrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'commander@rakshagrid.gov.in', password: responderPassword });
    commanderToken = cmdrRes.body.token;

    // Login Responder
    const respRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'responder@rakshagrid.gov.in', password: responderPassword });
    responderToken = respRes.body.token;
  });

  describe('1. Individual Agent Intelligence & Fallback Guarantees', () => {
    it('Agent 1 (Disaster Risk): generates valid risk score, area assessments, and data provenance', async () => {
      const output = await disasterRiskAgent.analyze({ latitude: 28.6139, longitude: 77.2090, radiusKm: 30 });

      expect(output).toBeDefined();
      expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(output.overallRiskLevel);
      expect(output.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(output.overallRiskScore).toBeLessThanOrEqual(100);
      expect(output.confidenceScore).toBeGreaterThanOrEqual(40);
      expect(output.confidenceScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(output.affectedAreas)).toBe(true);
      expect(output.affectedAreas.length).toBeGreaterThan(0);
      expect(Array.isArray(output.primaryContributingFactors)).toBe(true);
      expect(Array.isArray(output.recommendedPrecautions)).toBe(true);
      expect(Array.isArray(output.dataSources)).toBe(true);
      expect(output.dataSources.some(ds => ds.source.includes('Open-Meteo') || ds.source.includes('Meteorological'))).toBe(true);
    });

    it('Agent 2 (Incident Prioritization): triages active incidents with urgency scores and evidence', async () => {
      const output = await incidentIntelligenceAgent.prioritize();

      expect(output).toBeDefined();
      expect(Array.isArray(output.prioritizedIncidents)).toBe(true);
      expect(output.confidenceScore).toBeGreaterThanOrEqual(50);
      
      if (output.prioritizedIncidents.length > 0) {
        const top = output.prioritizedIncidents[0];
        expect(['P1', 'P2', 'P3', 'P4']).toContain(top.recommendedPriority);
        expect(top.urgencyScore).toBeGreaterThanOrEqual(0);
        expect(top.urgencyScore).toBeLessThanOrEqual(100);
        expect(typeof top.reason).toBe('string');
        expect(Array.isArray(top.supportingEvidence)).toBe(true);
        expect(typeof top.suggestedNextAction).toBe('string');
      }
    });

    it('Agent 3 (Resource Allocation): matches resources without auto-allocating or using unavailable teams', async () => {
      // Mark team TEAM-02 as 'Deployed' to verify it is NEVER recommended as available
      await db.run(`UPDATE teams SET status = 'Deployed' WHERE id = 'TEAM-02'`);

      const output = await resourceAllocationAgent.recommend();

      expect(output).toBeDefined();
      expect(Array.isArray(output.teamRecommendations)).toBe(true);
      expect(Array.isArray(output.supplyRecommendations)).toBe(true);
      expect(Array.isArray(output.shelterRecommendations)).toBe(true);
      expect(Array.isArray(output.shortages)).toBe(true);

      // Verify no recommended team has status other than 'Available'
      for (const rec of output.teamRecommendations) {
        expect(rec.suggestedTeamId).not.toBe('TEAM-02');
        expect(rec.approvalStatus).toBe('pending');
      }

      // Restore team status
      await db.run(`UPDATE teams SET status = 'Available' WHERE id = 'TEAM-02'`);
    });

    it('Agent 4 (Response Coordinator): dispatches multi-agent workflow and synthesizes 3-phase action plan', async () => {
      const output = await responseCoordinatorAgent.coordinate({
        query: 'Analyze flood hazard and recommend logistics allocations'
      });

      expect(output).toBeDefined();
      expect(output.executionId).toBeDefined();
      expect(Array.isArray(output.agentsInvoked)).toBe(true);
      expect(output.agentsInvoked.length).toBeGreaterThanOrEqual(1);
      expect(typeof output.consolidatedSummary).toBe('string');
      expect(Array.isArray(output.synthesizedActionPlan)).toBe(true);
      expect(output.synthesizedActionPlan.length).toBeGreaterThan(0);

      const immediateStep = output.synthesizedActionPlan.find(s => s.phase === 'immediate');
      expect(immediateStep).toBeDefined();
      expect(immediateStep?.priority).toBeDefined();
    });

    it('Agent 5 (Disaster Simulation): runs isolated sandbox without mutating live database records', async () => {
      // Record baseline production record counts
      const preIncidents = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM incidents');
      const preResources = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM resources');
      const preShelters = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM shelters');
      const preDeliveries = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM notification_deliveries');

      const simOutput = await disasterSimulationAgent.simulate({
        scenarioName: 'Unit Test Cloudburst Stress Test',
        rainfallIntensityMmPerHour: 90,
        riverGaugeRiseMeters: 3.1,
        simultaneousIncidentsCount: 5
      });

      expect(simOutput).toBeDefined();
      expect(simOutput.isSimulatedSandbox).toBe(true);
      expect(simOutput.warningNotice).toContain('SANDBOX SIMULATION ENVIRONMENT');
      expect(simOutput.simulatedIncidents.length).toBe(5);
      expect(simOutput.strategyComparisons.length).toBeGreaterThanOrEqual(2);
      expect(simOutput.suggestedOptimalStrategy).toBeDefined();

      // Verify that NO live database records were added, updated, or removed
      const postIncidents = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM incidents');
      const postResources = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM resources');
      const postShelters = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM shelters');
      const postDeliveries = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM notification_deliveries');

      expect(postIncidents?.count).toBe(preIncidents?.count);
      expect(postResources?.count).toBe(preResources?.count);
      expect(postShelters?.count).toBe(preShelters?.count);
      expect(postDeliveries?.count).toBe(preDeliveries?.count);
    });
  });

  describe('2. Orchestrator Service & Execution History', () => {
    it('registers all 5 agents and provides descriptors', () => {
      const agents = orchestrator.getAgents();
      expect(agents.length).toBe(5);

      const agentIds = agents.map(a => a.id);
      expect(agentIds).toContain('disaster_risk');
      expect(agentIds).toContain('incident_prioritization');
      expect(agentIds).toContain('resource_allocation');
      expect(agentIds).toContain('response_coordinator');
      expect(agentIds).toContain('disaster_simulation');
    });

    it('records executions in the database and retrieves paginated history', async () => {
      const execResult = await orchestrator.executeAgent('disaster_risk', { latitude: 28.6139, longitude: 77.2090 });
      expect(execResult.executionId).toBeDefined();
      expect(execResult.status).toBe('COMPLETED');
      expect(execResult.durationMs).toBeGreaterThanOrEqual(0);

      const history = await orchestrator.getExecutionHistory({ page: 1, limit: 5 });
      expect(history.executions.length).toBeGreaterThan(0);
      expect(history.total).toBeGreaterThan(0);

      const record = await orchestrator.getExecutionById(execResult.executionId);
      expect(record).toBeDefined();
      expect(record?.execution_id).toBe(execResult.executionId);
    });
  });

  describe('3. Human-in-the-Loop Approval & Governance Workflow', () => {
    it('generates pending recommendations and executes real atomic domain mutation upon approval', async () => {
      // 1. Run resource allocation to populate recommendations
      await orchestrator.executeAgent('resource_allocation', {});

      const pendingRecs = await orchestrator.getRecommendations({ status: 'pending', limit: 10 });
      expect(pendingRecs.length).toBeGreaterThan(0);

      // Find a team_assignment or resource_allocation recommendation
      const teamRec = pendingRecs.find(r => r.recommendation_type === 'team_assignment');
      if (teamRec) {
        const adminUser = {
          userId: 'USR-001',
          id: 'USR-001',
          email: 'admin@rakshagrid.gov.in',
          displayName: 'State Incident Commander',
          role: 'admin' as const
        };

        const approveRes = await orchestrator.approveRecommendation(teamRec.id, adminUser);
        expect(approveRes.success).toBe(true);

        // Verify recommendation record updated
        const updatedRec = await db.get<any>(`SELECT * FROM ai_recommendations WHERE id = ?`, [teamRec.id]);
        expect(updatedRec.approval_status).toBe('approved');
        expect(updatedRec.approved_by).toBe('State Incident Commander');
        expect(updatedRec.approved_at).toBeDefined();

        // Verify incident received team assignment
        const inc = await db.get<any>(`SELECT * FROM incidents WHERE id = ?`, [teamRec.target_entity_id]);
        expect(inc.assigned_team_id).toBeDefined();

        // Verify audit log event recorded
        const audit = await db.get<any>(
          `SELECT * FROM audit_events WHERE action = 'APPROVE_AI_RECOMMENDATION' AND entity_id = ?`,
          [teamRec.target_entity_id]
        );
        expect(audit).toBeDefined();

        // Verify approving twice throws error
        await expect(orchestrator.approveRecommendation(teamRec.id, adminUser)).rejects.toThrow('already approved');
      }
    });

    it('rejects an AI recommendation with explanation reason', async () => {
      // Create a test recommendation
      const testRecId = `REC-TEST-${Date.now()}`;
      await db.run(
        `INSERT INTO ai_recommendations (id, execution_id, recommendation_type, target_entity_type, target_entity_id, recommendation_title, recommendation_data, reasoning, confidence, approval_status, created_at)
         VALUES (?, 'exec_test', 'incident_escalation', 'incident', 'INC-001', 'Test Escalation', '{}', 'Test reasoning', 85, 'pending', ?)`,
        [testRecId, new Date().toISOString()]
      );

      const adminUser = {
        userId: 'USR-001',
        id: 'USR-001',
        email: 'admin@rakshagrid.gov.in',
        displayName: 'State Incident Commander',
        role: 'admin' as const
      };

      const rejectRes = await orchestrator.rejectRecommendation(testRecId, adminUser, 'Tactical priority overridden by field commander.');
      expect(rejectRes.success).toBe(true);

      const updated = await db.get<any>(`SELECT * FROM ai_recommendations WHERE id = ?`, [testRecId]);
      expect(updated.approval_status).toBe('rejected');
      expect(updated.rejection_reason).toContain('overridden');
    });
  });

  describe('4. REST API Endpoints & RBAC Security', () => {
    it('GET /api/ai/health - returns AI provider health status and registered agent count', async () => {
      const res = await request(app).get('/api/ai/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBeDefined();
      expect(res.body.registeredAgentsCount).toBe(5);
    });

    it('POST /api/ai/risk/analyze - rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/ai/risk/analyze').send({});
      expect(res.status).toBe(401);
    });

    it('POST /api/ai/risk/analyze - executes successfully with admin token', async () => {
      const res = await request(app)
        .post('/api/ai/risk/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ latitude: 28.6139, longitude: 77.2090 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallRiskLevel).toBeDefined();
    });

    it('POST /api/ai/coordinator/run - validates query input and rejects empty queries', async () => {
      const res = await request(app)
        .post('/api/ai/coordinator/run')
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({ query: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Operational question or command query is required');
    });

    it('POST /api/ai/coordinator/run - executes multi-agent coordination with valid query', async () => {
      const res = await request(app)
        .post('/api/ai/coordinator/run')
        .set('Authorization', `Bearer ${commanderToken}`)
        .send({ query: 'Assess flood risk in Zone O and recommend teams' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.agentsInvoked.length).toBeGreaterThan(0);
      expect(res.body.data.synthesizedActionPlan.length).toBeGreaterThan(0);
    });

    it('POST /api/ai/simulation/run - enforces parameter boundary validation', async () => {
      const res = await request(app)
        .post('/api/ai/simulation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rainfallIntensityMmPerHour: -50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Rainfall intensity must be between 0 and 500');
    });

    it('POST /api/ai/recommendations/:id/approve - strictly rejects responder role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/ai/recommendations/some_id/approve')
        .set('Authorization', `Bearer ${responderToken}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('GET /api/ai/executions - returns paginated execution records with secrets strictly excluded', async () => {
      const res = await request(app)
        .get('/api/ai/executions?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.executions)).toBe(true);

      const jsonStr = JSON.stringify(res.body);
      expect(jsonStr).not.toContain(adminPassword);
      expect(jsonStr).not.toContain('AI_API_KEY');
    });
  });
});

