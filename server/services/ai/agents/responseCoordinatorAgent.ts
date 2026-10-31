import { disasterRiskAgent } from './disasterRiskAgent.js';
import { incidentIntelligenceAgent } from './incidentIntelligenceAgent.js';
import { resourceAllocationAgent } from './resourceAllocationAgent.js';
import { providerFactory } from '../providers/providerFactory.js';
import { 
  ResponseCoordinatorOutput, 
  AgentExecutionTrace, 
  SynthesizedActionPlanStep, 
  DataProvenance 
} from '../types.js';

export interface CoordinatorRunInput {
  query: string;
  focusRegion?: string;
  latitude?: number;
  longitude?: number;
}

export class ResponseCoordinatorAgent {
  public readonly id = 'response_coordinator';
  public readonly name = 'AI Emergency Response Coordinator';
  public readonly role = 'Central Multi-Agent Command Dispatcher & Unified Response Synthesizer';

  public async coordinate(input: CoordinatorRunInput): Promise<ResponseCoordinatorOutput> {
    const executionId = `coord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const queryLower = (input.query || '').toLowerCase();

    // 1. Intent Detection
    const needsRisk = queryLower.includes('risk') || queryLower.includes('flood') || 
                      queryLower.includes('weather') || queryLower.includes('rain') || 
                      queryLower.includes('storm') || queryLower.includes('all') || 
                      queryLower.includes('status') || queryLower.length < 5;

    const needsIncidents = queryLower.includes('incident') || queryLower.includes('triage') || 
                           queryLower.includes('priorit') || queryLower.includes('escalat') || 
                           queryLower.includes('all') || queryLower.includes('status') || queryLower.length < 5;

    const needsResources = queryLower.includes('resource') || queryLower.includes('team') || 
                           queryLower.includes('allocat') || queryLower.includes('shelter') || 
                           queryLower.includes('supply') || queryLower.includes('all') || 
                           queryLower.includes('status') || queryLower.length < 5;

    const traces: AgentExecutionTrace[] = [];
    const combinedDataSources: DataProvenance[] = [];

    let riskResult: any = null;
    let incidentResult: any = null;
    let resourceResult: any = null;

    // 2. Parallel / Sequential Sub-Agent Invocations with Fault-Tolerance
    const invocations: Promise<void>[] = [];

    if (needsRisk) {
      invocations.push((async () => {
        const start = Date.now();
        try {
          riskResult = await disasterRiskAgent.analyze({
            latitude: input.latitude,
            longitude: input.longitude,
            focusRegionName: input.focusRegion
          });
          traces.push({
            agentId: 'disaster_risk',
            agentName: disasterRiskAgent.name,
            status: riskResult.isDegraded ? 'DEGRADED' : 'COMPLETED',
            durationMs: Date.now() - start,
            confidenceScore: riskResult.confidenceScore,
            summary: `Risk Level: ${riskResult.overallRiskLevel} (${riskResult.overallRiskScore}/100) across ${riskResult.affectedAreas.length} evaluated sectors.`
          });
          if (riskResult.dataSources) combinedDataSources.push(...riskResult.dataSources);
        } catch (err: any) {
          traces.push({
            agentId: 'disaster_risk',
            agentName: disasterRiskAgent.name,
            status: 'FAILED',
            durationMs: Date.now() - start,
            confidenceScore: 0,
            summary: 'Disaster Risk Agent failed to execute.',
            error: err.message
          });
        }
      })());
    }

    if (needsIncidents) {
      invocations.push((async () => {
        const start = Date.now();
        try {
          incidentResult = await incidentIntelligenceAgent.prioritize();
          traces.push({
            agentId: 'incident_prioritization',
            agentName: incidentIntelligenceAgent.name,
            status: 'COMPLETED',
            durationMs: Date.now() - start,
            confidenceScore: incidentResult.confidenceScore,
            summary: `Triaged ${incidentResult.prioritizedIncidents.length} active incidents (${incidentResult.criticalCount} Critical P1, ${incidentResult.escalationsCount} Escalations).`
          });
          if (incidentResult.dataSources) combinedDataSources.push(...incidentResult.dataSources);
        } catch (err: any) {
          traces.push({
            agentId: 'incident_prioritization',
            agentName: incidentIntelligenceAgent.name,
            status: 'FAILED',
            durationMs: Date.now() - start,
            confidenceScore: 0,
            summary: 'Incident Prioritization Agent failed to execute.',
            error: err.message
          });
        }
      })());
    }

    if (needsResources) {
      invocations.push((async () => {
        const start = Date.now();
        try {
          resourceResult = await resourceAllocationAgent.recommend();
          traces.push({
            agentId: 'resource_allocation',
            agentName: resourceAllocationAgent.name,
            status: 'COMPLETED',
            durationMs: Date.now() - start,
            confidenceScore: resourceResult.confidenceScore,
            summary: `Generated ${resourceResult.teamRecommendations.length} team allocations, ${resourceResult.supplyRecommendations.length} supply dispatches, and detected ${resourceResult.shortages.length} inventory shortages.`
          });
          if (resourceResult.dataSources) combinedDataSources.push(...resourceResult.dataSources);
        } catch (err: any) {
          traces.push({
            agentId: 'resource_allocation',
            agentName: resourceAllocationAgent.name,
            status: 'FAILED',
            durationMs: Date.now() - start,
            confidenceScore: 0,
            summary: 'Resource Allocation Agent failed to execute.',
            error: err.message
          });
        }
      })());
    }

    // Await all sub-agent dispatches
    await Promise.all(invocations);

    // 3. Fallback Deterministic Synthesis
    const fallbackGenerator = (): ResponseCoordinatorOutput => {
      return this.computeDeterministicSynthesis(
        executionId,
        input.query,
        traces,
        riskResult,
        incidentResult,
        resourceResult,
        combinedDataSources,
        nowIso
      );
    };

    // 4. External LLM Unified Synthesis (if available)
    const systemPrompt = `You are the AI Emergency Response Coordinator for RakshaGrid.
Synthesize findings from the specialized agents into a unified, executive disaster response operational plan.
Rules:
- Highlight urgent situations clearly (e.g. unassigned P1 incidents or high flood risk).
- Identify conflicting recommendations (e.g. resource contention).
- Formulate a 3-phase action plan: Immediate (0-2h), Short-Term (2-8h), Stabilization (8-24h).
- Mark high-impact actions as requiresHumanApproval: true.
- Return valid JSON matching ResponseCoordinatorOutput schema.`;

    const userPrompt = `User Query: "${input.query}"
Sub-Agent Trace Reports:
${JSON.stringify(traces)}
Sub-Agent Outputs:
- Disaster Risk: ${JSON.stringify(riskResult ? { level: riskResult.overallRiskLevel, score: riskResult.overallRiskScore, factors: riskResult.primaryContributingFactors } : 'Not invoked')}
- Incidents: ${JSON.stringify(incidentResult ? { total: incidentResult.prioritizedIncidents.length, critical: incidentResult.criticalCount, escalations: incidentResult.escalationsCount } : 'Not invoked')}
- Resources: ${JSON.stringify(resourceResult ? { teams: resourceResult.teamRecommendations.length, shortages: resourceResult.shortages.length } : 'Not invoked')}
Synthesize the operational response briefing.`;

    const provider = providerFactory.getActiveProvider();
    const result = await provider.generateStructuredCompletion<ResponseCoordinatorOutput>(
      userPrompt,
      systemPrompt,
      fallbackGenerator
    );

    const output = result.data;
    output.executionId = executionId;
    output.userQuery = input.query;
    output.agentsInvoked = traces;
    output.dataSources = combinedDataSources;
    output.timestamp = nowIso;

    return output;
  }

  private computeDeterministicSynthesis(
    executionId: string,
    query: string,
    traces: AgentExecutionTrace[],
    risk: any,
    incidents: any,
    resources: any,
    dataSources: DataProvenance[],
    nowIso: string
  ): ResponseCoordinatorOutput {
    const urgentSituations: string[] = [];
    const conflictingRecommendations: string[] = [];
    const actionPlan: SynthesizedActionPlanStep[] = [];

    // Synthesize Risk Findings
    if (risk) {
      if (risk.overallRiskLevel === 'CRITICAL' || risk.overallRiskLevel === 'HIGH') {
        urgentSituations.push(`Regional Disaster Risk elevated to ${risk.overallRiskLevel} (Score: ${risk.overallRiskScore}/100) due to ${risk.primaryContributingFactors.join(', ')}.`);
      }
    }

    // Synthesize Incident Findings
    if (incidents) {
      const p1List = (incidents.prioritizedIncidents || []).filter((i: any) => i.recommendedPriority === 'P1');
      if (p1List.length > 0) {
        urgentSituations.push(`${p1List.length} critical P1 incident(s) require immediate Incident Commander dispatch authorization.`);
      }

      const escalations = (incidents.prioritizedIncidents || []).filter((i: any) => i.escalationNeeded);
      if (escalations.length > 0) {
        urgentSituations.push(`${escalations.length} incident(s) flagged for priority escalation based on unattended duration and population density.`);
      }
    }

    // Synthesize Resource Findings & Conflicts
    if (resources) {
      if (resources.shortages && resources.shortages.length > 0) {
        urgentSituations.push(`${resources.shortages.length} critical inventory supply shortage(s) detected in emergency storage depots.`);
      }

      if (resources.resourceConflicts && resources.resourceConflicts.length > 0) {
        conflictingRecommendations.push(...resources.resourceConflicts);
      }
    }

    // Build Synthesized Action Plan
    let stepCount = 1;

    // Immediate Phase
    if (incidents && incidents.criticalCount > 0) {
      actionPlan.push({
        stepNumber: stepCount++,
        phase: 'immediate',
        action: 'Review and authorize pending deployment of quick-response teams to top-ranked P1 incidents.',
        assignedRole: 'Incident Commander',
        priority: 'P1',
        requiresHumanApproval: true,
        approvalEntity: { type: 'team', id: 'rec_team_dispatch' }
      });
    }

    if (risk && (risk.overallRiskLevel === 'CRITICAL' || risk.overallRiskLevel === 'HIGH')) {
      actionPlan.push({
        stepNumber: stepCount++,
        phase: 'immediate',
        action: 'Sound precautionary community advisory in Yamuna Riparian Zone O and dispatch riverbank monitoring patrol.',
        assignedRole: 'State Command Authority',
        priority: 'P1',
        requiresHumanApproval: true,
        approvalEntity: { type: 'alert', id: 'rec_alert_river' }
      });
    }

    // Short-Term Phase
    if (resources && resources.teamRecommendations?.length > 0) {
      actionPlan.push({
        stepNumber: stepCount++,
        phase: 'short_term',
        action: `Review tactical team assignments for ${resources.teamRecommendations.length} pending incident sites.`,
        assignedRole: 'Logistics Officer',
        priority: 'P2',
        requiresHumanApproval: true,
        approvalEntity: { type: 'team', id: 'rec_team_matching' }
      });
    }

    if (resources && resources.supplyRecommendations?.length > 0) {
      actionPlan.push({
        stepNumber: stepCount++,
        phase: 'short_term',
        action: 'Authorize allocation of relief kits, dewatering pumps, and rescue watercraft from central warehouse.',
        assignedRole: 'Logistics Officer',
        priority: 'P2',
        requiresHumanApproval: true,
        approvalEntity: { type: 'resource', id: 'rec_inventory_dispatch' }
      });
    }

    // Stabilization Phase
    actionPlan.push({
      stepNumber: stepCount++,
      phase: 'stabilization',
      action: 'Conduct secondary shelter bed audits and requisition mutual aid supplies from neighboring district depots.',
      assignedRole: 'Municipal Relief Coordinator',
      priority: 'P3',
      requiresHumanApproval: false
    });

    const consolidatedSummary = `Multi-agent emergency coordination complete. System evaluated ${traces.length} specialized intelligence domains. Regional risk stands at ${risk?.overallRiskLevel || 'MODERATE'} with ${incidents?.criticalCount || 0} critical emergency incidents requiring commander intervention. ${urgentSituations.length} urgent situations highlighted.`;

    return {
      executionId,
      userQuery: query,
      intent: 'Operational Coordination & Action Planning',
      agentsInvoked: traces,
      consolidatedSummary,
      urgentSituations,
      conflictingRecommendations,
      synthesizedActionPlan: actionPlan,
      overallConfidenceScore: 92,
      dataSources,
      timestamp: nowIso
    };
  }
}

export const responseCoordinatorAgent = new ResponseCoordinatorAgent();

