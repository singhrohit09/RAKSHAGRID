/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Shelter, Team, Resource, AuditEvent } from '../../types';
import { AssistantMessage } from '../../types/ai';
import { GeminiDisasterService, sanitizePromptInput } from './geminiClient';
import { calculateDistanceKm } from '../geospatial/spatialAnalysis.service';

export interface AssistantContext {
  incidents: Incident[];
  shelters: Shelter[];
  teams: Team[];
  resources: Resource[];
  auditLogs: AuditEvent[];
  userRole: string;
  userName: string;
}

export class AIAssistantService {
  /**
   * Responds to operator natural language inquiries with evidence-grounded citations
   */
  public static async askAssistant(
    userQuery: string,
    history: AssistantMessage[],
    context: AssistantContext
  ): Promise<AssistantMessage> {
    const sanitized = sanitizePromptInput(userQuery);

    // Guard against prompt injection
    if (
      /ignore\s+previous|system\s+prompt|override\s+rules|reveal\s+secret|exfiltrate|delete\s+all/i.test(
        userQuery
      )
    ) {
      return {
        id: `MSG-${Date.now()}`,
        role: 'assistant',
        content:
          'SECURITY ALERT: System instruction override or security command rejected. RakshaGrid AI Assistant operates under strict emergency operations boundaries and role-based access controls.',
        timestamp: new Date().toISOString(),
        citations: [],
        toolCalls: [
          {
            toolName: 'security_firewall',
            query: sanitized,
            resultSummary: 'Disallowed command pattern detected and filtered.',
          },
        ],
        isAiGenerated: true,
      };
    }

    const citations: NonNullable<AssistantMessage['citations']> = [];
    const toolCalls: NonNullable<AssistantMessage['toolCalls']> = [];

    // Predefined tool evaluation
    const lower = sanitized.toLowerCase();

    // 1. Shelter inquiry
    if (lower.includes('shelter') || lower.includes('capacity') || lower.includes('evacuee')) {
      const saturated = context.shelters.filter((s) => s.currentOccupancy >= s.capacity * 0.8);
      const totalBeds = context.shelters.reduce((acc, s) => acc + s.capacity, 0);
      const usedBeds = context.shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);

      toolCalls.push({
        toolName: 'query_shelters',
        query: 'capacity_and_saturation',
        resultSummary: `${context.shelters.length} shelters queried, ${saturated.length} saturated, ${(totalBeds - usedBeds).toLocaleString()} vacant beds remaining.`,
      });

      citations.push({
        title: 'Shelter Network Registry',
        source: 'EOC Real-Time Evacuation Log',
        value: `${usedBeds}/${totalBeds} occupied (${Math.round((usedBeds/totalBeds)*100)}%)`,
      });
    }

    // 2. Incident inquiry
    if (lower.includes('incident') || lower.includes('critical') || lower.includes('flood') || lower.includes('danger')) {
      const criticalIncidents = context.incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved');
      toolCalls.push({
        toolName: 'query_incidents',
        query: 'severity:critical status:active',
        resultSummary: `Found ${criticalIncidents.length} uncontained critical incidents.`,
      });

      criticalIncidents.forEach((inc) => {
        citations.push({
          title: inc.title,
          source: `Incident #${inc.id} (${inc.location})`,
          value: `${inc.severity.toUpperCase()} - ${inc.affectedPopulation} affected`,
        });
      });
    }

    // 3. Team dispatch inquiry
    if (lower.includes('team') || lower.includes('dispatch') || lower.includes('available')) {
      const avail = context.teams.filter((t) => t.status === 'available');
      toolCalls.push({
        toolName: 'query_teams',
        query: 'status:available',
        resultSummary: `${avail.length} of ${context.teams.length} teams available for deployment.`,
      });

      citations.push({
        title: 'Response Force Tracking',
        source: 'Deployment Database',
        value: `${avail.length} available units`,
      });
    }

    // If Gemini API is configured, use it with ground truth injection
    if (GeminiDisasterService.isApiKeyConfigured()) {
      try {
        const prompt = `You are the RakshaGrid AI Operations Assistant (Copilot) supporting an Incident Commander (${context.userName}, Role: ${context.userRole}).
Ground Truth Operational Data:
- Active Incidents (${context.incidents.length}): ${JSON.stringify(context.incidents.slice(0, 5).map(i => ({ title: i.title, sev: i.severity, loc: i.location, assigned: i.assignedTeamName })))}
- Shelters (${context.shelters.length}): ${JSON.stringify(context.shelters.slice(0, 4).map(s => ({ name: s.name, occ: s.currentOccupancy, cap: s.capacity })))}
- Available Teams (${context.teams.filter(t => t.status === 'available').length}): ${JSON.stringify(context.teams.filter(t => t.status === 'available').map(t => ({ name: t.name, spec: t.specialization })))}
- Recent EOC Actions: ${JSON.stringify(context.auditLogs.slice(0, 3).map(a => a.action + ' by ' + a.actor.name))}

User Query: "${sanitized}"

Instructions:
1. Answer factually based only on the ground truth above.
2. Be concise, tactical, and direct.
3. If asked to dispatch or perform life-critical actions, clearly state that AI recommendations require human commander authorization.`;

        const reply = await GeminiDisasterService.generate(prompt, { maxOutputTokens: 350 });

        return {
          id: `MSG-${Date.now()}`,
          role: 'assistant',
          content: reply.trim(),
          timestamp: new Date().toISOString(),
          citations,
          toolCalls,
          isAiGenerated: true,
        };
      } catch (err) {
        console.warn('Gemini Assistant fallback to deterministic copilot:', err);
      }
    }

    // Deterministic tactical response engine
    let content = '';

    if (lower.includes('shelter')) {
      const saturated = context.shelters.filter((s) => s.currentOccupancy >= s.capacity * 0.8);
      const freeBeds = context.shelters.reduce((acc, s) => acc + (s.capacity - s.currentOccupancy), 0);
      content = `Currently, ${context.shelters.length} relief shelters are operational with a total remaining reserve of ${freeBeds.toLocaleString()} beds. ${
        saturated.length > 0
          ? `Attention required: ${saturated.map(s => `${s.name} (${Math.round((s.currentOccupancy/s.capacity)*100)}%)`).join(', ')} are nearing or above critical capacity.`
          : 'All shelters are currently operating within safe load margins (<80%).'
      } Inflow diversions are recommended for saturated centers.`;
    } else if (lower.includes('incident') || lower.includes('threat') || lower.includes('critical')) {
      const crit = context.incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved');
      content = `There are currently ${crit.length} critical tier incidents in the command registry: ${
        crit.map(c => `"${c.title}" at ${c.location} (${c.assignedTeamName ? `assigned to ${c.assignedTeamName}` : 'UNASSIGNED'})`).join('; ')
      }. Recommendation: prioritize immediate dispatch to unassigned sectors and verify field casualty counts.`;
    } else if (lower.includes('team') || lower.includes('resource') || lower.includes('dispatch')) {
      const avail = context.teams.filter((t) => t.status === 'available');
      content = `${avail.length} of ${context.teams.length} tactical response teams are currently standby and available for immediate deployment: ${avail.map(t => `${t.name} (${t.specialization})`).join(', ')}. Dispatches must be formally confirmed in the Resource Allocation panel.`;
    } else {
      content = `RakshaGrid Tactical Intelligence Copilot is active. Current operational state: ${context.incidents.filter(i => i.status !== 'resolved').length} active incidents, ${context.shelters.length} monitored shelters, and ${context.teams.filter(t => t.status === 'available').length} available tactical teams. You can ask for critical incident briefings, shelter saturation checks, or team dispatch evaluations.`;
    }

    return {
      id: `MSG-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      citations,
      toolCalls,
      isAiGenerated: false,
    };
  }
}
