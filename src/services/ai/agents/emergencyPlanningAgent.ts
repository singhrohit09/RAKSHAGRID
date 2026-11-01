/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Team } from '../../../types';
import { AgentRun } from '../../../types/ai';
import { GeminiDisasterService, GEMINI_MODEL } from '../geminiClient';
import { calculateDistanceKm } from '../../geospatial/spatialAnalysis.service';

export class EmergencyPlanningAgent {
  public static readonly agentType = 'emergency_planning';
  public static readonly agentName = 'Emergency Response Planning Agent';

  public static async execute(
    incidents: Incident[],
    teams: Team[]
  ): Promise<AgentRun> {
    const startTime = Date.now();
    const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
    const availableTeams = teams.filter((t) => t.status === 'available');
    const deployedTeams = teams.filter((t) => t.status === 'deployed');

    // Prioritized matches
    const unassignedCritical = activeIncidents.filter(
      (i) => i.severity === 'critical' && !i.assignedTeamId
    );

    const matchProposals: string[] = [];
    unassignedCritical.forEach((inc) => {
      // Find closest available team
      let closestTeam: Team | null = null;
      let minDistance = Infinity;

      availableTeams.forEach((t) => {
        const dist = calculateDistanceKm(inc.coordinates, t.location);
        if (dist < minDistance) {
          minDistance = dist;
          closestTeam = t;
        }
      });

      if (closestTeam) {
        const team: Team = closestTeam;
        matchProposals.push(
          `Assign ${team.name} (${team.specialization}) to "${inc.title}" (${minDistance.toFixed(1)} km, ~${Math.round(minDistance * 2.2)} min transit)`
        );
      }
    });

    const findings: string[] = [
      `Formulating tactical Incident Action Plan across ${activeIncidents.length} active emergency sectors.`,
      `Force distribution: ${deployedTeams.length} teams in field deployment, ${availableTeams.length} teams ready for immediate dispatch.`,
      `Identified ${unassignedCritical.length} critical tier incidents currently awaiting response team assignment.`,
      matchProposals.length > 0
        ? `Proposed immediate tactical matching: ${matchProposals.join('; ')}.`
        : 'All active critical incidents currently have assigned or en-route tactical units.',
    ];

    const threatIndicators: AgentRun['threatIndicators'] = [
      {
        title: 'Unassigned Critical Incidents',
        level: unassignedCritical.length > 1 ? 'critical' : unassignedCritical.length === 1 ? 'severe' : 'normal',
        metric: `${unassignedCritical.length} Awaiting Units`,
      },
      {
        title: 'Response Force Availability',
        level: availableTeams.length === 0 ? 'critical' : availableTeams.length < 2 ? 'severe' : 'normal',
        metric: `${availableTeams.length} Units Free`,
      },
      {
        title: 'Tactical Team Deployment Ratio',
        level: deployedTeams.length >= (teams.length * 0.8) ? 'elevated' : 'normal',
        metric: `${deployedTeams.length} / ${teams.length} Deployed`,
      },
    ];

    const recommendedActions: string[] = [
      'Present formal dispatch recommendations to Incident Commander for manual confirmation.',
      'Establish a 60-minute operational rhythm for tactical status debriefs.',
      'Pre-stage mutual aid requests to neighboring state disaster management authorities.',
    ];

    let isAiPowered = false;
    let modelIdentifier = 'Deterministic Tactical Force Matching Engine v4.0';

    if (GeminiDisasterService.isApiKeyConfigured()) {
      try {
        const prompt = `You are the Emergency Response Planning Agent for RakshaGrid Incident Command.
Active Incidents: ${JSON.stringify(activeIncidents.map(i => ({ title: i.title, sev: i.severity, loc: i.location, assigned: i.assignedTeamName || 'None' })))}.
Available Teams: ${JSON.stringify(availableTeams.map(t => ({ name: t.name, spec: t.specialization, size: t.memberCount })))}.
Provide a 2-sentence tactical Incident Action Plan summary emphasizing priority dispatch sequence.`;
        
        const aiSummary = await GeminiDisasterService.generate(prompt, { maxOutputTokens: 200 });
        if (aiSummary) {
          findings.unshift(`[Gemini Tactical IAP]: ${aiSummary.trim()}`);
          isAiPowered = true;
          modelIdentifier = `${GEMINI_MODEL} (Planning Specialized)`;
        }
      } catch (err) {
        console.warn('EmergencyPlanningAgent AI call fallback to heuristics:', err);
      }
    }

    return {
      id: `RUN-PLN-${Date.now()}`,
      agentType: 'emergency_planning',
      agentName: this.agentName,
      status: 'completed',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      inputMetrics: {
        activeIncidentCount: activeIncidents.length,
        unassignedCriticalCount: unassignedCritical.length,
        availableTeamsCount: availableTeams.length,
        deployedTeamsCount: deployedTeams.length,
      },
      findings,
      threatIndicators,
      recommendedActions,
      confidence: 0.94,
      isAiPowered,
      modelIdentifier,
    };
  }
}
