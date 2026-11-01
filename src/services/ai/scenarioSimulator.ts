/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Shelter, Resource } from '../../types';
import { DisasterScenario, ScenarioParameters, ScenarioImpacts } from '../../types/ai';

export class DisasterScenarioSimulator {
  /**
   * Simulates a hypothetical what-if scenario without modifying any live records
   */
  public static simulate(
    name: string,
    description: string,
    params: ScenarioParameters,
    baselineIncidents: Incident[],
    baselineShelters: Shelter[],
    baselineResources: Resource[]
  ): DisasterScenario {
    // 1. Calculate affected population with rainfall & surge multipliers
    const baselinePopulation = baselineIncidents.reduce(
      (sum, inc) => sum + (inc.affectedPopulation || 0),
      0
    );

    const surgeFactor = 1 + (params.rainfallMultiplier - 1.0) * 0.8 + (params.riverSurgeMeters / 5.0) * 0.9;
    const infrastructurePenalty = (params.powerGridOutage ? 1.25 : 1.0) * (params.bridgeCollapses ? 1.35 : 1.0);
    const damMultiplier = 1 + (params.damReleaseCusecs / 150000) * 0.7;

    const projectedPopulation = Math.round(
      baselinePopulation * surgeFactor * infrastructurePenalty * damMultiplier
    );

    // 2. Threatened shelters calculation
    // Any shelter within flood zone or near capacity that would be inundated
    const threatenedShelters: ScenarioImpacts['threatenedShelters'] = [];

    baselineShelters.forEach((shelter) => {
      let riskScore = 0;
      if (params.riverSurgeMeters > 2.0 && shelter.name.toLowerCase().includes('barrage') || shelter.name.toLowerCase().includes('river') || shelter.name.toLowerCase().includes('ghat')) {
        riskScore += 60;
      }
      if (params.rainfallMultiplier > 1.8) {
        riskScore += 35;
      }
      if (params.bridgeCollapses) {
        riskScore += 25;
      }

      if (riskScore >= 50 || shelter.currentOccupancy >= (shelter.capacity * 0.8)) {
        threatenedShelters.push({
          id: shelter.id,
          name: shelter.name,
          currentOccupancy: shelter.currentOccupancy,
          capacity: shelter.capacity,
          projectedRisk:
            riskScore >= 80
              ? 'Severe Inundation & Isolation Risk'
              : 'Structural Capacity Overrun & Flash Runoff Risk',
        });
      }
    });

    // 3. Flooded Zones projection
    const floodedZones: string[] = ['Mahanadi Delta Lower Riparian Zone'];
    if (params.riverSurgeMeters > 1.5 || params.damReleaseCusecs > 60000) {
      floodedZones.push('Cuttack City North Embankment Lowlands');
      floodedZones.push('Bhubaneswar Daya River Floodplain');
    }
    if (params.rainfallMultiplier > 2.0) {
      floodedZones.push('Puri Coastal Highway Submergence Corridor');
      floodedZones.push('Jagatsinghpur Agricultural Drainage Lowlands');
    }
    if (params.riverSurgeMeters > 3.5 || params.damReleaseCusecs > 120000) {
      floodedZones.push('Kendrapara Tidal Estuary Saline Surge Sector');
    }

    // 4. Critical infrastructure impacts
    const criticalInfrastructure: string[] = [];
    if (params.powerGridOutage) {
      criticalInfrastructure.push('Bhubaneswar 400kV Grid Substation (Water Ingress / Blackout)');
      criticalInfrastructure.push('Hospital Backup Diesel Generators Saturated');
    }
    if (params.bridgeCollapses) {
      criticalInfrastructure.push('National Highway 16 Kathajodi Bridge Approach Cut Off');
      criticalInfrastructure.push('District Feeder Culvert KM-22 Breached');
    }
    if (params.riverSurgeMeters > 2.5) {
      criticalInfrastructure.push('Mundali Sluice Gate Overtopped');
    }

    // 5. Projected Resource Deficits
    const estimatedResourceDeficits = [
      {
        item: 'Motorized Swift-Water Boats',
        projectedDeficit: Math.max(12, Math.round(params.riverSurgeMeters * 8 + (params.bridgeCollapses ? 10 : 0))),
        unit: 'craft',
      },
      {
        item: 'High-Output Dewatering Pumps (500 GPM)',
        projectedDeficit: Math.max(15, Math.round(params.rainfallMultiplier * 10)),
        unit: 'pumps',
      },
      {
        item: 'Packaged Drinking Water Pouches',
        projectedDeficit: Math.round(projectedPopulation * 2.5),
        unit: 'pouches',
      },
      {
        item: 'Emergency Trauma & Snakebite Antivenom Kits',
        projectedDeficit: Math.round(projectedPopulation * 0.015),
        unit: 'kits',
      },
    ];

    // 6. Projected Casualty Risk
    let projectedCasualtyRisk: ScenarioImpacts['projectedCasualtyRisk'] = 'moderate';
    if (params.bridgeCollapses && params.riverSurgeMeters > 3.0) {
      projectedCasualtyRisk = 'critical';
    } else if (params.riverSurgeMeters > 2.0 || params.damReleaseCusecs > 80000) {
      projectedCasualtyRisk = 'high';
    }

    const narrative = `HYPOTHETICAL SIMULATION: Modeling a ${params.rainfallMultiplier.toFixed(1)}x rainfall surge combined with +${params.riverSurgeMeters.toFixed(1)}m river crest and ${params.damReleaseCusecs.toLocaleString()} cusecs dam discharge${
      params.powerGridOutage ? ', compounded by catastrophic power grid failure' : ''
    }${params.bridgeCollapses ? ' and key bridge severance' : ''}. Under these conditions, exposed population rises to ${projectedPopulation.toLocaleString()} citizens (+${Math.round(((projectedPopulation - baselinePopulation) / (baselinePopulation || 1)) * 100)}% over baseline). ${threatenedShelters.length} relief shelters would become untenable, requiring preemptive secondary staging.`;

    const impacts: ScenarioImpacts = {
      estimatedAffectedPopulation: projectedPopulation,
      threatenedSheltersCount: threatenedShelters.length,
      threatenedShelters,
      floodedZonesCount: floodedZones.length,
      floodedZones,
      criticalInfrastructureImpacted: criticalInfrastructure,
      estimatedResourceDeficits,
      projectedCasualtyRisk,
      simulationNarrative: narrative,
    };

    const baselineDiff = {
      populationIncreasePct: Math.round(
        ((projectedPopulation - baselinePopulation) / (baselinePopulation || 1)) * 100
      ),
      additionalThreatenedShelters: Math.max(0, threatenedShelters.length - 1),
      newDeficitCount: estimatedResourceDeficits.length,
    };

    return {
      id: `SIM-SCENARIO-${Date.now()}`,
      name: name || `Simulation: ${params.rainfallMultiplier.toFixed(1)}x Rain + ${params.riverSurgeMeters.toFixed(1)}m River Surge`,
      description: description || 'Simulated what-if catastrophe scenario evaluated for contingency preparedness.',
      createdAt: new Date().toISOString(),
      parameters: params,
      impacts,
      baselineDiff,
      isSimulation: true,
    };
  }
}
