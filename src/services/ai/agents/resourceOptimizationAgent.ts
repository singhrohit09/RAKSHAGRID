/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Resource } from '../../../types';
import { AgentRun } from '../../../types/ai';
import { GeminiDisasterService, GEMINI_MODEL } from '../geminiClient';

export class ResourceOptimizationAgent {
  public static readonly agentType = 'resource_opt';
  public static readonly agentName = 'Resource Optimization Agent';

  public static async execute(
    resources: Resource[],
    incidents: Incident[]
  ): Promise<AgentRun> {
    const startTime = Date.now();
    const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
    const totalAffected = activeIncidents.reduce((sum, i) => sum + (i.affectedPopulation || 0), 0);

    // Identify acute deficits
    const deficits: Array<{ name: string; available: number; needed: number; unit: string }> = [];

    resources.forEach((r) => {
      // Estimated need based on affected population
      let multiplier = 0.05;
      if (r.category === 'medical') multiplier = 0.08;
      else if (r.category === 'power_water' || r.category === 'provisions') multiplier = 1.2;
      else if (r.category === 'rescue') multiplier = 0.02;

      const estimatedNeeded = Math.max(10, Math.round(totalAffected * multiplier));
      if (r.availableQuantity < estimatedNeeded) {
        deficits.push({
          name: r.name,
          available: r.availableQuantity,
          needed: estimatedNeeded,
          unit: r.unit,
        });
      }
    });

    const lowStockResources = resources.filter((r) => r.availableQuantity < (r.totalQuantity * 0.25));

    const findings: string[] = [
      `Auditing logistics stock across ${resources.length} critical emergency supply lines.`,
      `Identified ${deficits.length} inventory categories running in acute operational deficit relative to affected population.`,
      `Depleted inventory items (<25% baseline reserves): ${lowStockResources.map(r => r.name).join(', ') || 'None critical'}.`,
    ];

    const threatIndicators: AgentRun['threatIndicators'] = [
      {
        title: 'Critical Supply Deficit Items',
        level: deficits.length > 2 ? 'critical' : deficits.length > 0 ? 'severe' : 'normal',
        metric: `${deficits.length} Categories Deficient`,
      },
      {
        title: 'Low Stock Depletion Items',
        level: lowStockResources.length > 2 ? 'severe' : lowStockResources.length > 0 ? 'elevated' : 'normal',
        metric: `${lowStockResources.length} Items < 25%`,
      },
      {
        title: 'Regional Supply Line Buffer',
        level: deficits.length > 0 ? 'elevated' : 'normal',
        metric: `${Math.round(((resources.length - deficits.length) / (resources.length || 1)) * 100)}% Stocked`,
      },
    ];

    const recommendedActions: string[] = [
      'Authorize emergency requisition for inflatable rescue boats and potable water sachets from state reserve warehouses.',
      'Establish a forward logistics transshipment point at high-elevation dry staging areas.',
      'Implement strict ration dispensing protocol at all designated distribution nodes.',
    ];

    let isAiPowered = false;
    let modelIdentifier = 'Deterministic Multi-Depot Supply Optimization Engine v4.0';

    if (GeminiDisasterService.isApiKeyConfigured()) {
      try {
        const prompt = `You are the Resource Optimization Agent for RakshaGrid Logistics.
Resources: ${JSON.stringify(resources.map(r => ({ name: r.name, available: r.availableQuantity, total: r.totalQuantity, unit: r.unit })))}.
Active Incidents: ${activeIncidents.length}, Total Affected: ${totalAffected}.
Provide 2 concise tactical recommendations to prevent resource starvation in the next 12 hours.`;
        
        const aiSummary = await GeminiDisasterService.generate(prompt, { maxOutputTokens: 200 });
        if (aiSummary) {
          findings.unshift(`[Gemini Supply Chain AI]: ${aiSummary.trim()}`);
          isAiPowered = true;
          modelIdentifier = `${GEMINI_MODEL} (Logistics Specialized)`;
        }
      } catch (err) {
        console.warn('ResourceOptimizationAgent AI call fallback to heuristics:', err);
      }
    }

    return {
      id: `RUN-RES-${Date.now()}`,
      agentType: 'resource_opt',
      agentName: this.agentName,
      status: 'completed',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      inputMetrics: {
        resourceCount: resources.length,
        deficitCount: deficits.length,
        lowStockCount: lowStockResources.length,
        deficits,
      },
      findings,
      threatIndicators,
      recommendedActions,
      confidence: 0.91,
      isAiPowered,
      modelIdentifier,
    };
  }
}
