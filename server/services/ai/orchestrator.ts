import { db } from '../../db/connection.js';
import { recordAuditEvent } from '../../middleware/audit.js';
import { UserSessionPayload } from '../../auth/jwt.js';
import { providerFactory } from './providers/providerFactory.js';
import { disasterRiskAgent, DisasterRiskInput } from './agents/disasterRiskAgent.js';
import { incidentIntelligenceAgent } from './agents/incidentIntelligenceAgent.js';
import { resourceAllocationAgent, ResourceAllocationInput } from './agents/resourceAllocationAgent.js';
import { responseCoordinatorAgent, CoordinatorRunInput } from './agents/responseCoordinatorAgent.js';
import { disasterSimulationAgent } from './agents/disasterSimulationAgent.js';
import { 
  AgentId, 
  AgentExecutionStatus, 
  AgentDescriptor, 
  SimulationScenarioInput 
} from './types.js';

export interface ExecutionRecord {
  id: string;
  execution_id: string;
  agent_name: string;
  status: AgentExecutionStatus;
  input_summary: string | null;
  output_summary: string | null;
  full_output: string | null;
  confidence: number;
  provider: string;
  execution_duration: number;
  error_message: string | null;
  created_at: string;
}

export interface RecommendationRecord {
  id: string;
  execution_id: string;
  recommendation_type: string;
  target_entity_type: string;
  target_entity_id: string;
  recommendation_title: string;
  recommendation_data: string;
  reasoning: string;
  confidence: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export class AgentOrchestrator {
  private agentRegistry: Map<AgentId, { descriptor: AgentDescriptor; execute: (input: any) => Promise<any> }> = new Map();

  constructor() {
    this.registerAgents();
  }

  private registerAgents() {
    this.agentRegistry.set('disaster_risk', {
      descriptor: {
        id: 'disaster_risk',
        name: disasterRiskAgent.name,
        role: disasterRiskAgent.role,
        description: 'Analyzes real-time meteorology, river gauge telemetry, geofences, and incidents to compute regional multi-hazard disaster exposure scores.',
        version: '1.0.0',
        status: 'online',
        lastExecutionAt: null,
        lastExecutionStatus: null,
        permittedTools: ['OpenMeteoWeather', 'HydrologyTelemetricEngine', 'GeofenceSpatialEvaluator', 'IncidentRegistry']
      },
      execute: (input: DisasterRiskInput) => disasterRiskAgent.analyze(input)
    });

    this.agentRegistry.set('incident_prioritization', {
      descriptor: {
        id: 'incident_prioritization',
        name: incidentIntelligenceAgent.name,
        role: incidentIntelligenceAgent.role,
        description: 'Triages active emergency incidents dynamically based on severity, population exposure, casualties, unassigned duration, and geofenced hazard proximity.',
        version: '1.0.0',
        status: 'online',
        lastExecutionAt: null,
        lastExecutionStatus: null,
        permittedTools: ['IncidentRegistry', 'GeofenceSpatialEvaluator', 'IncidentTimeline']
      },
      execute: () => incidentIntelligenceAgent.prioritize()
    });

    this.agentRegistry.set('resource_allocation', {
      descriptor: {
        id: 'resource_allocation',
        name: resourceAllocationAgent.name,
        role: resourceAllocationAgent.role,
        description: 'Computes optimal tactical matching between available response teams, emergency inventory stock, and municipal shelter capacities without autonomous allocation.',
        version: '1.0.0',
        status: 'online',
        lastExecutionAt: null,
        lastExecutionStatus: null,
        permittedTools: ['TeamsRegistry', 'ResourceInventory', 'ShelterCapacityLedger', 'HaversineSpatialEngine']
      },
      execute: (input: ResourceAllocationInput) => resourceAllocationAgent.recommend(input)
    });

    this.agentRegistry.set('response_coordinator', {
      descriptor: {
        id: 'response_coordinator',
        name: responseCoordinatorAgent.name,
        role: responseCoordinatorAgent.role,
        description: 'Interprets operational operator questions, coordinates parallel multi-agent dispatches, detects recommendation conflicts, and synthesizes 3-phase action plans.',
        version: '1.0.0',
        status: 'online',
        lastExecutionAt: null,
        lastExecutionStatus: null,
        permittedTools: ['MultiAgentDispatcher', 'ConflictDetector', 'ActionPlanSynthesizer']
      },
      execute: (input: CoordinatorRunInput) => responseCoordinatorAgent.coordinate(input)
    });

    this.agentRegistry.set('disaster_simulation', {
      descriptor: {
        id: 'disaster_simulation',
        name: disasterSimulationAgent.name,
        role: disasterSimulationAgent.role,
        description: 'Simulates synthetic disaster scenarios (cloudbursts, dyke breaches, mass casualties) in an isolated sandbox to evaluate comparative countermeasure strategies.',
        version: '1.0.0',
        status: 'online',
        lastExecutionAt: null,
        lastExecutionStatus: null,
        permittedTools: ['SyntheticScenarioSandbox', 'CountermeasureEvaluator', 'BottleneckSimulator']
      },
      execute: (input: Partial<SimulationScenarioInput>) => disasterSimulationAgent.simulate(input)
    });
  }

  public getAgents(): AgentDescriptor[] {
    return Array.from(this.agentRegistry.values()).map(entry => entry.descriptor);
  }

  public getAgent(id: AgentId): AgentDescriptor | undefined {
    return this.agentRegistry.get(id)?.descriptor;
  }

  /**
   * Executes a registered agent with strict lifecycle tracking, timeouts, and persistence.
   */
  public async executeAgent<T = any>(
    agentId: AgentId, 
    input: any = {}, 
    user?: UserSessionPayload
  ): Promise<{ executionId: string; status: AgentExecutionStatus; durationMs: number; data: T }> {
    const entry = this.agentRegistry.get(agentId);
    if (!entry) {
      throw new Error(`Agent with ID '${agentId}' is not registered in RakshaGrid Orchestrator.`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const start = Date.now();
    const nowIso = new Date().toISOString();

    entry.descriptor.lastExecutionAt = nowIso;
    entry.descriptor.lastExecutionStatus = 'RUNNING';

    // 15-second execution timeout guard
    const timeoutMs = 15000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Agent '${agentId}' execution exceeded timeout of ${timeoutMs}ms.`)), timeoutMs)
    );

    let outputData: any = null;
    let finalStatus: AgentExecutionStatus = 'COMPLETED';
    let errorMessage: string | null = null;
    let confidence = 90;

    try {
      outputData = await Promise.race([entry.execute(input), timeoutPromise]);

      if (outputData?.isDegraded) {
        finalStatus = 'DEGRADED';
      }
      if (typeof outputData?.confidenceScore === 'number') {
        confidence = outputData.confidenceScore;
      } else if (typeof outputData?.overallConfidenceScore === 'number') {
        confidence = outputData.overallConfidenceScore;
      }

      entry.descriptor.lastExecutionStatus = finalStatus;

      // Extract and record pending human approval recommendations if returned
      await this.persistRecommendations(executionId, agentId, outputData);

      // Record simulation runs if simulation agent
      if (agentId === 'disaster_simulation') {
        await this.persistSimulation(executionId, input, outputData, user);
      }
    } catch (err: any) {
      finalStatus = 'FAILED';
      errorMessage = err.message || 'Unknown agent execution failure';
      entry.descriptor.lastExecutionStatus = 'FAILED';
      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const activeProvider = providerFactory.getActiveProvider().name;

      // Record in ai_agent_executions ledger
      try {
        const id = `AEX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        await db.run(
          `INSERT INTO ai_agent_executions 
           (id, execution_id, agent_name, status, input_summary, output_summary, full_output, confidence, provider, execution_duration, error_message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            executionId,
            entry.descriptor.name,
            finalStatus,
            JSON.stringify(input).slice(0, 500),
            outputData ? JSON.stringify(outputData).slice(0, 500) : null,
            outputData ? JSON.stringify(outputData) : null,
            confidence,
            activeProvider,
            durationMs,
            errorMessage,
            nowIso
          ]
        );
      } catch (dbErr) {
        console.error('Failed to persist AI agent execution ledger record:', dbErr);
      }
    }

    return {
      executionId,
      status: finalStatus,
      durationMs: Date.now() - start,
      data: outputData
    };
  }

  private async persistRecommendations(executionId: string, _agentId: AgentId, data: any): Promise<void> {
    if (!data) return;
    const nowIso = new Date().toISOString();

    // 1. Team Allocation Recommendations
    if (data.teamRecommendations && Array.isArray(data.teamRecommendations)) {
      for (const rec of data.teamRecommendations) {
        const id = `REC-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
        await db.run(
          `INSERT INTO ai_recommendations 
           (id, execution_id, recommendation_type, target_entity_type, target_entity_id, recommendation_title, recommendation_data, reasoning, confidence, approval_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [
            id,
            executionId,
            'team_assignment',
            'incident',
            rec.targetIncidentId,
            `Deploy ${rec.suggestedTeamName} to ${rec.targetIncidentTitle}`,
            JSON.stringify(rec),
            rec.reason,
            rec.confidenceScore || 90,
            nowIso
          ]
        );
      }
    }

    // 2. Supply Allocation Recommendations
    if (data.supplyRecommendations && Array.isArray(data.supplyRecommendations)) {
      for (const rec of data.supplyRecommendations) {
        const id = `REC-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
        await db.run(
          `INSERT INTO ai_recommendations 
           (id, execution_id, recommendation_type, target_entity_type, target_entity_id, recommendation_title, recommendation_data, reasoning, confidence, approval_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [
            id,
            executionId,
            'resource_allocation',
            'resource',
            rec.resourceId,
            `Allocate ${rec.recommendedQuantity} ${rec.unit} of ${rec.resourceName} to ${rec.targetIncidentTitle}`,
            JSON.stringify(rec),
            rec.reason,
            rec.confidenceScore || 88,
            nowIso
          ]
        );
      }
    }

    // 3. Incident Priority Escalation Recommendations
    if (data.prioritizedIncidents && Array.isArray(data.prioritizedIncidents)) {
      for (const inc of data.prioritizedIncidents) {
        if (inc.escalationNeeded) {
          const id = `REC-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
          await db.run(
            `INSERT INTO ai_recommendations 
             (id, execution_id, recommendation_type, target_entity_type, target_entity_id, recommendation_title, recommendation_data, reasoning, confidence, approval_status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [
              id,
              executionId,
              'incident_escalation',
              'incident',
              inc.incidentId,
              `Escalate ${inc.title} to Priority ${inc.recommendedPriority}`,
              JSON.stringify(inc),
              inc.reason,
              inc.confidenceScore || 92,
              nowIso
            ]
          );
        }
      }
    }
  }

  private async persistSimulation(_executionId: string, input: any, output: any, user?: UserSessionPayload): Promise<void> {
    const id = `SIM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();
    const createdBy = user ? `${user.displayName} (${user.role})` : 'Incident Commander (Authorized)';

    await db.run(
      `INSERT INTO ai_simulation_records 
       (id, scenario_name, scenario_input, simulation_result, status, created_by, created_at)
       VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
      [
        id,
        output.scenarioName || input.scenarioName || 'Disaster Simulation Run',
        JSON.stringify(input),
        JSON.stringify(output),
        createdBy,
        nowIso
      ]
    );
  }

  /**
   * Retrieves paginated execution history.
   */
  public async getExecutionHistory(options: { page?: number; limit?: number; agentName?: string; status?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (options.agentName) {
      conditions.push('agent_name LIKE ?');
      params.push(`%${options.agentName}%`);
    }

    if (options.status) {
      conditions.push('status = ?');
      params.push(options.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRow = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM ai_agent_executions ${whereClause}`,
      params
    );
    const total = totalRow?.count || 0;

    const executions = await db.query<ExecutionRecord>(
      `SELECT id, execution_id, agent_name, status, input_summary, output_summary, full_output, confidence, provider, execution_duration, error_message, created_at 
       FROM ai_agent_executions 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      executions
    };
  }

  public async getExecutionById(executionId: string): Promise<ExecutionRecord | null> {
    const record = await db.get<ExecutionRecord>(
      `SELECT * FROM ai_agent_executions WHERE execution_id = ? OR id = ?`,
      [executionId, executionId]
    );
    return record || null;
  }

  /**
   * Retrieves recommendations filtered by approval status.
   */
  public async getRecommendations(options: { status?: 'pending' | 'approved' | 'rejected'; limit?: number }) {
    const limit = options.limit || 25;
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.status) {
      conditions.push('approval_status = ?');
      params.push(options.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const recommendations = await db.query<RecommendationRecord>(
      `SELECT * FROM ai_recommendations ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      [...params, limit]
    );

    return recommendations;
  }

  /**
   * Strictly human-in-the-loop: approves recommendation and executes real domain mutation.
   */
  public async approveRecommendation(recommendationId: string, user: UserSessionPayload): Promise<{ success: boolean; message: string }> {
    const rec = await db.get<RecommendationRecord>(
      `SELECT * FROM ai_recommendations WHERE id = ?`,
      [recommendationId]
    );

    if (!rec) {
      throw new Error(`Recommendation '${recommendationId}' does not exist.`);
    }

    if (rec.approval_status !== 'pending') {
      throw new Error(`Recommendation '${recommendationId}' is already ${rec.approval_status}.`);
    }

    const recData = JSON.parse(rec.recommendation_data);
    const nowIso = new Date().toISOString();

    // Execute real domain action inside atomic transaction
    await db.transaction(async () => {
      if (rec.recommendation_type === 'team_assignment') {
        const incidentId = rec.target_entity_id;
        const teamId = recData.suggestedTeamId;

        // Verify team is available
        const team = await db.get<any>(`SELECT * FROM teams WHERE id = ?`, [teamId]);
        if (!team) throw new Error(`Suggested team '${teamId}' not found.`);

        // Assign team to incident
        await db.run(
          `UPDATE incidents SET assigned_team_id = ?, updated_at = ? WHERE id = ?`,
          [teamId, nowIso, incidentId]
        );

        // Update team status to Deployed
        await db.run(
          `UPDATE teams SET status = 'Deployed', current_assignment = ?, updated_at = ? WHERE id = ?`,
          [`Dispatched to incident ${incidentId}`, nowIso, teamId]
        );

        // Add timeline entry
        const timelineId = `TL-${Date.now().toString().slice(-6)}`;
        await db.run(
          `INSERT INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
           VALUES (?, ?, ?, ?, ?, 'deployment')`,
          [
            timelineId,
            incidentId,
            nowIso,
            user.displayName,
            `AI Recommendation Approved: Deployed ${team.name} to incident.`
          ]
        );
      } else if (rec.recommendation_type === 'resource_allocation') {
        const resourceId = rec.target_entity_id;
        const qtyToAllocate = recData.recommendedQuantity || 1;

        const resItem = await db.get<any>(`SELECT * FROM resources WHERE id = ?`, [resourceId]);
        if (!resItem) throw new Error(`Resource '${resourceId}' not found.`);

        if (resItem.quantity_available < qtyToAllocate) {
          throw new Error(`Insufficient stock for '${resItem.name}'. Available: ${resItem.quantity_available}, Requested: ${qtyToAllocate}`);
        }

        const newAvail = resItem.quantity_available - qtyToAllocate;
        const newAlloc = resItem.quantity_allocated + qtyToAllocate;

        await db.run(
          `UPDATE resources SET quantity_available = ?, quantity_allocated = ?, updated_at = ? WHERE id = ?`,
          [newAvail, newAlloc, nowIso, resourceId]
        );

        // Record inventory movement
        const movId = `MOV-${Date.now().toString().slice(-6)}`;
        await db.run(
          `INSERT INTO inventory_movements (id, resource_id, movement_type, quantity, previous_available, new_available, actor_id, note, timestamp)
           VALUES (?, ?, 'allocation', ?, ?, ?, ?, ?, ?)`,
          [
            movId,
            resourceId,
            qtyToAllocate,
            resItem.quantity_available,
            newAvail,
            user.userId || user.id,
            `AI Recommendation Approved: Allocated ${qtyToAllocate} ${resItem.unit} to ${recData.targetIncidentTitle || 'Incident'}`,
            nowIso
          ]
        );
      } else if (rec.recommendation_type === 'incident_escalation') {
        const incidentId = rec.target_entity_id;
        const newPriority = recData.recommendedPriority;

        await db.run(
          `UPDATE incidents SET priority = ?, updated_at = ? WHERE id = ?`,
          [newPriority, nowIso, incidentId]
        );

        const timelineId = `TL-${Date.now().toString().slice(-6)}`;
        await db.run(
          `INSERT INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
           VALUES (?, ?, ?, ?, ?, 'escalation')`,
          [
            timelineId,
            incidentId,
            nowIso,
            user.displayName,
            `AI Recommendation Approved: Escalated priority to ${newPriority}. Reason: ${rec.reasoning}`
          ]
        );
      }

      // Mark recommendation as approved
      await db.run(
        `UPDATE ai_recommendations SET approval_status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?`,
        [user.displayName, nowIso, recommendationId]
      );
    });

    // Record audit event
    await recordAuditEvent({
      actor: user,
      action: 'APPROVE_AI_RECOMMENDATION',
      entityType: rec.recommendation_type,
      entityId: rec.target_entity_id,
      description: `Authorized and executed AI recommendation: '${rec.recommendation_title}'.`
    });

    return {
      success: true,
      message: `Recommendation '${rec.recommendation_title}' approved and executed successfully.`
    };
  }

  /**
   * Rejects an AI recommendation with explanation.
   */
  public async rejectRecommendation(
    recommendationId: string, 
    user: UserSessionPayload, 
    reason: string = 'Declined by Incident Commander.'
  ): Promise<{ success: boolean; message: string }> {
    const rec = await db.get<RecommendationRecord>(
      `SELECT * FROM ai_recommendations WHERE id = ?`,
      [recommendationId]
    );

    if (!rec) {
      throw new Error(`Recommendation '${recommendationId}' does not exist.`);
    }

    if (rec.approval_status !== 'pending') {
      throw new Error(`Recommendation '${recommendationId}' is already ${rec.approval_status}.`);
    }

    const nowIso = new Date().toISOString();

    await db.run(
      `UPDATE ai_recommendations SET approval_status = 'rejected', approved_by = ?, approved_at = ?, rejection_reason = ? WHERE id = ?`,
      [user.displayName, nowIso, reason, recommendationId]
    );

    await recordAuditEvent({
      actor: user,
      action: 'REJECT_AI_RECOMMENDATION',
      entityType: rec.recommendation_type,
      entityId: rec.target_entity_id,
      description: `Rejected AI recommendation: '${rec.recommendation_title}'. Reason: ${reason}`
    });

    return {
      success: true,
      message: `Recommendation '${rec.recommendation_title}' has been rejected.`
    };
  }

  /**
   * Retrieves simulation history.
   */
  public async getSimulations(options: { page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;

    const totalRow = await db.get<{ count: number }>(`SELECT COUNT(*) as count FROM ai_simulation_records`);
    const total = totalRow?.count || 0;

    const simulations = await db.query<any>(
      `SELECT * FROM ai_simulation_records ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      simulations
    };
  }

  public async getSimulationById(id: string) {
    const sim = await db.get<any>(`SELECT * FROM ai_simulation_records WHERE id = ?`, [id]);
    return sim || null;
  }
}

export const orchestrator = new AgentOrchestrator();
