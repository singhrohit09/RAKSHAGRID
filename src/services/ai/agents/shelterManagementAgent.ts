/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shelter } from '../../../types';
import { AgentRun } from '../../../types/ai';
import { GeminiDisasterService, GEMINI_MODEL } from '../geminiClient';
import { calculateDistanceKm } from '../../geospatial/spatialAnalysis.service';

export class ShelterManagementAgent {
  public static readonly agentType = 'shelter_mgmt';
  public static readonly agentName = 'Shelter Management Agent';

  public static async execute(shelters: Shelter[]): Promise<AgentRun> {
    const startTime = Date.now();
    const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
    const totalOccupancy = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);
    const overallOccupancyPct = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    const criticalShelters = shelters.filter(
      (s) => (s.currentOccupancy / s.capacity) >= 0.85
    );
    const overCapacityShelters = shelters.filter(
      (s) => s.currentOccupancy >= s.capacity
    );
    const underUtilizedShelters = shelters.filter(
      (s) => (s.currentOccupancy / s.capacity) < 0.50
    );

    const findings: string[] = [
      `Monitoring ${shelters.length} designated emergency relief centres (Total Capacity: ${totalCapacity.toLocaleString()} persons).`,
      `Overall network occupancy: ${overallOccupancyPct.toFixed(1)}% (${totalOccupancy.toLocaleString()} evacuees sheltered).`,
      `Shelters operating at or above 85% critical saturation: ${criticalShelters.length} (${criticalShelters.map(s => `${s.name} [${Math.round((s.currentOccupancy/s.capacity)*100)}%]`).join(', ') || 'None'}).`,
      `Shelters with >50% surge absorption capacity: ${underUtilizedShelters.length} facilities ready for diverted inflow.`,
    ];

    const threatIndicators: AgentRun['threatIndicators'] = [
      {
        title: 'Over-Capacity Shelters',
        level: overCapacityShelters.length > 0 ? 'critical' : criticalShelters.length > 0 ? 'severe' : 'normal',
        metric: `${overCapacityShelters.length} Saturated`,
      },
      {
        title: 'Network Occupancy Pressure',
        level: overallOccupancyPct > 80 ? 'critical' : overallOccupancyPct > 65 ? 'elevated' : 'normal',
        metric: `${overallOccupancyPct.toFixed(1)}% Occupancy`,
      },
      {
        title: 'Available Evacuee Beds',
        level: (totalCapacity - totalOccupancy) < 500 ? 'severe' : 'normal',
        metric: `${(totalCapacity - totalOccupancy).toLocaleString()} Vacant Beds`,
      },
    ];

    const recommendedActions: string[] = [
      'Activate municipal overflow sites (sports complexes and community centers) in non-inundated municipal wards.',
      'Divert inbound evacuation convoys from saturated shelters to under-utilized facilities.',
      'Deploy supplemental sanitation facilities and water filtration bladders to high-density shelters.',
    ];

    let isAiPowered = false;
    let modelIdentifier = 'Deterministic Shelter Capacity & Flow Routing Engine v4.0';

    if (GeminiDisasterService.isApiKeyConfigured()) {
      try {
        const prompt = `You are the Shelter Management Agent for RakshaGrid EOC.
Shelter Data: ${JSON.stringify(shelters.map(s => ({ name: s.name, occ: s.currentOccupancy, cap: s.capacity, pct: Math.round((s.currentOccupancy/s.capacity)*100) })))}.
Provide a 2-sentence tactical recommendation for evacuee re-routing and relief supply prioritization.`;
        
        const aiSummary = await GeminiDisasterService.generate(prompt, { maxOutputTokens: 200 });
        if (aiSummary) {
          findings.unshift(`[Gemini Shelter Intelligence]: ${aiSummary.trim()}`);
          isAiPowered = true;
          modelIdentifier = `${GEMINI_MODEL} (Shelter Specialized)`;
        }
      } catch (err) {
        console.warn('ShelterManagementAgent AI call fallback to heuristics:', err);
      }
    }

    return {
      id: `RUN-SHL-${Date.now()}`,
      agentType: 'shelter_mgmt',
      agentName: this.agentName,
      status: 'completed',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      inputMetrics: {
        shelterCount: shelters.length,
        totalCapacity,
        totalOccupancy,
        criticalCount: criticalShelters.length,
        overCapacityCount: overCapacityShelters.length,
      },
      findings,
      threatIndicators,
      recommendedActions,
      confidence: 0.93,
      isAiPowered,
      modelIdentifier,
    };
  }
}
