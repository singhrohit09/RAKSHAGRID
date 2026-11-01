/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Shelter, Team } from '../../../types';
import { AgentRun } from '../../../types/ai';
import { GeminiDisasterService, GEMINI_MODEL } from '../geminiClient';

export class DisasterIntelligenceAgent {
  public static readonly agentType = 'disaster_intel';
  public static readonly agentName = 'Disaster Intelligence Agent';

  public static async execute(
    incidents: Incident[],
    shelters: Shelter[],
    teams: Team[]
  ): Promise<AgentRun> {
    const startTime = Date.now();
    const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
    const criticalCount = activeIncidents.filter((i) => i.severity === 'critical').length;
    const highCount = activeIncidents.filter((i) => i.severity === 'high').length;
    const totalAffected = activeIncidents.reduce((sum, i) => sum + (i.affectedPopulation || 0), 0);

    const findings: string[] = [
      `Surveillance active over ${activeIncidents.length} uncontained disaster locations.`,
      `Critical tier incidents: ${criticalCount}; High tier incidents: ${highCount}.`,
      `Cumulative estimated civilian exposure: ${totalAffected.toLocaleString()} individuals across reporting sectors.`,
    ];

    const threatIndicators: AgentRun['threatIndicators'] = [
      {
        title: 'Critical Severity Ratio',
        level: criticalCount > 1 ? 'critical' : criticalCount === 1 ? 'severe' : 'elevated',
        metric: `${criticalCount} / ${activeIncidents.length} Critical`,
      },
      {
        title: 'Civilian Exposure Velocity',
        level: totalAffected > 10000 ? 'critical' : totalAffected > 3000 ? 'elevated' : 'normal',
        metric: `${totalAffected.toLocaleString()} Population`,
      },
      {
        title: 'Incident Containment Rate',
        level: activeIncidents.filter((i) => i.status === 'contained').length === 0 ? 'severe' : 'normal',
        metric: `${Math.round((activeIncidents.filter((i) => i.status === 'contained').length / (activeIncidents.length || 1)) * 100)}% Contained`,
      },
    ];

    const recommendedActions: string[] = [
      'Prioritize immediate triage and team dispatch to unassigned critical incident zones.',
      'Enforce real-time casualty tracking protocol with regional district hospitals.',
      'Initiate drone reconnaissance over inaccessible rural sectors.',
    ];

    let isAiPowered = false;
    let modelIdentifier = 'Deterministic Disaster Telemetry Engine v4.0';

    if (GeminiDisasterService.isApiKeyConfigured()) {
      try {
        const prompt = `You are the Disaster Intelligence Agent for RakshaGrid EOC.
Analyze these current incidents:
${JSON.stringify(activeIncidents.map(i => ({ id: i.id, title: i.title, type: i.disasterType, severity: i.severity, affected: i.affectedPopulation, location: i.location })))}
Provide a brief 2-sentence tactical synthesis of the escalation trajectory and 1 primary operational recommendation.`;
        
        const aiSummary = await GeminiDisasterService.generate(prompt, { maxOutputTokens: 200 });
        if (aiSummary) {
          findings.unshift(`[Gemini Intelligence]: ${aiSummary.trim()}`);
          isAiPowered = true;
          modelIdentifier = `${GEMINI_MODEL} (Hybrid Augmented)`;
        }
      } catch (err) {
        console.warn('DisasterIntelligenceAgent AI call fallback to heuristics:', err);
      }
    }

    return {
      id: `RUN-DIS-${Date.now()}`,
      agentType: 'disaster_intel',
      agentName: this.agentName,
      status: 'completed',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      inputMetrics: {
        activeCount: activeIncidents.length,
        criticalCount,
        totalAffected,
      },
      findings,
      threatIndicators,
      recommendedActions,
      confidence: 0.92,
      isAiPowered,
      modelIdentifier,
    };
  }
}
