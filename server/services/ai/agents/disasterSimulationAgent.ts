import { db } from '../../../db/connection.js';
import { providerFactory } from '../providers/providerFactory.js';
import { 
  DisasterSimulationOutput, 
  SimulationScenarioInput, 
  SimulationStrategyComparison, 
  RiskLevel 
} from '../types.js';

export class DisasterSimulationAgent {
  public readonly id = 'disaster_simulation';
  public readonly name = 'Disaster Simulation Agent';
  public readonly role = 'Synthetic Disaster Scenario Sandbox & Countermeasure Evaluator';

  public async simulate(input: Partial<SimulationScenarioInput>): Promise<DisasterSimulationOutput> {
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const params: SimulationScenarioInput = {
      scenarioName: input.scenarioName || 'Monsoon Cloudburst & River Gauge Surge Simulation',
      rainfallIntensityMmPerHour: input.rainfallIntensityMmPerHour ?? 65,
      riverGaugeRiseMeters: input.riverGaugeRiseMeters ?? 2.4,
      simultaneousIncidentsCount: input.simultaneousIncidentsCount ?? 4,
      disabledTeamIds: input.disabledTeamIds ?? [],
      targetRegion: input.targetRegion || 'National Capital Region (Yamuna Catchment)',
      durationHours: input.durationHours ?? 12
    };

    // 1. Fetch real production baselines for comparison (READ ONLY!)
    const liveIncidents = await db.query<any>(`SELECT * FROM incidents WHERE status != 'Closed'`);
    const liveResources = await db.query<any>(`SELECT * FROM resources`);
    const liveShelters = await db.query<any>(`SELECT * FROM shelters`);
    const liveTeams = await db.query<any>(`SELECT * FROM teams`);

    // 2. Deterministic Sandbox Engine (Guarantees zero database mutations)
    const fallbackGenerator = (): DisasterSimulationOutput => {
      return this.computeDeterministicSimulation(
        simulationId,
        params,
        liveIncidents,
        liveResources,
        liveShelters,
        liveTeams,
        nowIso
      );
    };

    // 3. Optional External LLM Simulation
    const systemPrompt = `You are the Disaster Simulation Agent for RakshaGrid.
Evaluate synthetic disaster scenarios and generate comparative countermeasure strategies.
Rules:
- STRICT ISOLATION: All outputs are synthetic scenarios for stress-testing.
- Compare at least two distinct operational strategies.
- Accurately project resource bottlenecks and shelter saturation under stress.
- Return valid JSON matching DisasterSimulationOutput schema.`;

    const userPrompt = `Simulation Scenario Configuration:
Scenario Name: ${params.scenarioName}
Rainfall: ${params.rainfallIntensityMmPerHour} mm/hr
River Gauge Rise: +${params.riverGaugeRiseMeters} meters
Simultaneous Incidents to Inject: ${params.simultaneousIncidentsCount}
Disabled/Blocked Teams: ${JSON.stringify(params.disabledTeamIds)}
Target Region: ${params.targetRegion} (Duration: ${params.durationHours} hours)
Baseline Production Context:
- Active Incidents: ${liveIncidents.length}
- Total Shelter Beds: ${liveShelters.reduce((acc, s) => acc + (s.capacity || 0), 0)}
- Available Teams: ${liveTeams.filter(t => t.status === 'Available').length}
- Inventory Items: ${liveResources.length}
Generate comprehensive simulation projections and strategy evaluations.`;

    const provider = providerFactory.getActiveProvider();
    const result = await provider.generateStructuredCompletion<DisasterSimulationOutput>(
      userPrompt,
      systemPrompt,
      fallbackGenerator
    );

    const output = result.data;
    output.simulationId = simulationId;
    output.isSimulatedSandbox = true;
    output.warningNotice = 'SANDBOX SIMULATION ENVIRONMENT — ALL SCENARIOS, ELEVATIONS, AND CASUALTIES ARE SYNTHETIC. ZERO LIVE PRODUCTION INCIDENTS OR RESOURCES MODIFIED.';
    output.timestamp = nowIso;
    output.inputParameters = params;

    return output;
  }

  private computeDeterministicSimulation(
    simulationId: string,
    params: SimulationScenarioInput,
    _liveIncidents: any[],
    liveResources: any[],
    liveShelters: any[],
    _liveTeams: any[],
    nowIso: string
  ): DisasterSimulationOutput {
    // Generate synthetic incidents
    const simulatedIncidents: DisasterSimulationOutput['simulatedIncidents'] = [];
    const incidentTemplates = [
      { title: 'Simulated Embankment Breach at Usmanpur', sev: 'Critical', loc: 'Usmanpur Yamuna Dyke, Sector 4', lat: 28.6750, lng: 77.2510, pop: 1200 },
      { title: 'Simulated Submerged Arterial Underpass', sev: 'High', loc: 'Minto Road Sub-grade Transit', lat: 28.6380, lng: 77.2280, pop: 350 },
      { title: 'Simulated Transformer Flashover & Local Grid Outage', sev: 'High', loc: 'Okhla Industrial Substation Phase II', lat: 28.5350, lng: 77.2750, pop: 600 },
      { title: 'Simulated Structural Wall Collapse at Slum Cluster', sev: 'Critical', loc: 'Geeta Colony Enclave', lat: 28.6520, lng: 77.2650, pop: 850 },
      { title: 'Simulated Storm Drain Siphon Reverse Surge', sev: 'Medium', loc: 'Barapullah Nullah Outfall', lat: 28.5850, lng: 77.2500, pop: 220 }
    ];

    for (let i = 0; i < Math.min(params.simultaneousIncidentsCount, incidentTemplates.length); i++) {
      const tmpl = incidentTemplates[i];
      simulatedIncidents.push({
        id: `sim_inc_${i + 1}`,
        title: `[SIMULATED] ${tmpl.title}`,
        severity: tmpl.sev,
        simulatedLocation: tmpl.loc,
        lat: tmpl.lat,
        lng: tmpl.lng,
        estimatedAffectedPopulation: tmpl.pop
      });
    }

    // Project Risk Changes
    const baselineRiskScore = 32;
    const rainfallDelta = Math.round((params.rainfallIntensityMmPerHour / 100) * 35);
    const riverDelta = Math.round((params.riverGaugeRiseMeters / 3.0) * 25);
    const simulatedScore = Math.min(98, baselineRiskScore + rainfallDelta + riverDelta);

    let baselineLevel: RiskLevel = 'MODERATE';
    let simulatedLevel: RiskLevel = 'HIGH';
    if (simulatedScore >= 80) simulatedLevel = 'CRITICAL';

    const expectedRiskChanges = [
      {
        area: 'Yamuna Riparian Corridor (Zone O)',
        baselineRiskScore: 35,
        simulatedRiskScore: simulatedScore,
        riskDelta: simulatedScore - 35,
        baselineRiskLevel: baselineLevel,
        simulatedRiskLevel: simulatedLevel
      },
      {
        area: 'Low-Lying Eastern Trans-Yamuna Drainage Basin',
        baselineRiskScore: 28,
        simulatedRiskScore: Math.min(92, simulatedScore - 6),
        riskDelta: Math.min(92, simulatedScore - 6) - 28,
        baselineRiskLevel: 'LOW' as RiskLevel,
        simulatedRiskLevel: (simulatedScore - 6 >= 75 ? 'CRITICAL' : 'HIGH') as RiskLevel
      },
      {
        area: 'Southern Floodway & Najafgarh Drain Confluence',
        baselineRiskScore: 22,
        simulatedRiskScore: Math.min(78, simulatedScore - 15),
        riskDelta: Math.min(78, simulatedScore - 15) - 22,
        baselineRiskLevel: 'LOW' as RiskLevel,
        simulatedRiskLevel: 'HIGH' as RiskLevel
      }
    ];

    // Resource Requirements & Bottleneck Projection
    const totalSimulatedPopulation = simulatedIncidents.reduce((sum, inc) => sum + inc.estimatedAffectedPopulation, 0);
    const estimatedResourceRequirements: DisasterSimulationOutput['estimatedResourceRequirements'] = [];
    const potentialBottlenecks: string[] = [];

    // Bottlenecks from disabled teams
    if (params.disabledTeamIds.length > 0) {
      potentialBottlenecks.push(`Severe response capacity deficit: ${params.disabledTeamIds.length} operational team(s) simulated as inaccessible due to localized road washouts.`);
    }

    // Shelter bottleneck check
    const totalShelterBeds = liveShelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
    const totalCurrentOccupancy = liveShelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
    const availableBeds = Math.max(0, totalShelterBeds - totalCurrentOccupancy);
    const projectedShelterDemand = Math.round(totalSimulatedPopulation * 0.45);

    if (projectedShelterDemand > availableBeds) {
      potentialBottlenecks.push(`Shelter Bed Deficit: Projected evacuee surge (${projectedShelterDemand} persons) exceeds available operational beds (${availableBeds}) by ${projectedShelterDemand - availableBeds} beds.`);
    }

    // Inventory checks
    for (const res of liveResources) {
      const name = res.name.toLowerCase();
      let simulatedDemand = 0;

      if (name.includes('boat')) {
        simulatedDemand = Math.round(params.simultaneousIncidentsCount * 2.5);
      } else if (name.includes('jacket')) {
        simulatedDemand = Math.min(500, Math.round(totalSimulatedPopulation * 0.25));
      } else if (name.includes('pump')) {
        simulatedDemand = Math.round(params.rainfallIntensityMmPerHour > 50 ? 8 : 4);
      } else if (name.includes('medical') || name.includes('kit')) {
        simulatedDemand = Math.round(totalSimulatedPopulation * 0.1);
      }

      if (simulatedDemand > 0) {
        const available = res.quantity_available || 0;
        const shortfall = Math.max(0, simulatedDemand - available);
        estimatedResourceRequirements.push({
          resourceName: res.name,
          category: res.category,
          availableInProduction: available,
          simulatedDemand,
          simulatedShortage: shortfall
        });

        if (shortfall > 0) {
          potentialBottlenecks.push(`Logistics shortfall in '${res.name}': Required ${simulatedDemand} ${res.unit}, but only ${available} available (shortfall of ${shortfall} ${res.unit}).`);
        }
      }
    }

    // Strategy Comparisons
    const strategyComparisons: SimulationStrategyComparison[] = [
      {
        strategyName: 'Strategy A: Pre-Emptive Evacuation & Upstream Relief Staging',
        description: 'Initiate mandatory low-lying evacuation 4 hours before crest; relocate families to primary dry-zone shelters and pre-stage inflatable motor boats at elevated embankment ramps.',
        evacuationEfficiencyPct: 91,
        shelterOverloadRisk: projectedShelterDemand > availableBeds ? 'high' : 'moderate',
        resourceExhaustionRisk: 'moderate',
        estimatedResponseTimeHours: 2.5,
        pros: [
          'Minimizes night-time water rescue risk and swiftwater entrapment.',
          'Maintains dry transport corridors for emergency medical ambulances.',
          'Conserves specialized swiftwater rescue personnel stamina.'
        ],
        cons: [
          'High initial citizen disruption and transit congestion.',
          'Requires immediate deployment of secondary transit buses and shelter beds.'
        ],
        recommended: true
      },
      {
        strategyName: 'Strategy B: In-Situ Defense, High-Capacity Dewatering & Tactical Response',
        description: 'Maintain populations in place; deploy heavy dewatering pump arrays and temporary sandbag floodwalls while dispatching teams strictly on 112 emergency calls.',
        evacuationEfficiencyPct: 62,
        shelterOverloadRisk: 'low',
        resourceExhaustionRisk: 'extreme',
        estimatedResponseTimeHours: 5.8,
        pros: [
          'Avoids immediate mass municipal shelter overcrowding.',
          'Lower initial transit disruption for non-affected sectors.'
        ],
        cons: [
          'Extremely dangerous if river surge exceeds +2.0m embankment freeboard.',
          'High risk of rapid water entrapment requiring hazardous emergency boat rescues under rain.'
        ],
        recommended: false
      }
    ];

    return {
      simulationId,
      scenarioName: params.scenarioName,
      isSimulatedSandbox: true,
      warningNotice: 'SANDBOX SIMULATION ENVIRONMENT — ALL SCENARIOS, ELEVATIONS, AND CASUALTIES ARE SYNTHETIC. ZERO LIVE PRODUCTION INCIDENTS OR RESOURCES MODIFIED.',
      inputParameters: params,
      simulatedIncidents,
      expectedRiskChanges,
      potentiallyAffectedAreas: [
        'Yamuna Floodplain (Zone O)',
        'Mayur Vihar Phase 1 Lowlands',
        'Geeta Colony Riverfront Enclave',
        'Minto Road Subway Basin'
      ],
      estimatedResourceRequirements,
      potentialBottlenecks,
      strategyComparisons,
      suggestedOptimalStrategy: 'Strategy A: Pre-Emptive Evacuation & Upstream Relief Staging',
      timestamp: nowIso
    };
  }
}

export const disasterSimulationAgent = new DisasterSimulationAgent();
