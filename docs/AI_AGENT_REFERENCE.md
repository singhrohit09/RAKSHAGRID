# RakshaGrid — AI Agent Reference Guide

**Project**: RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform  
**Active Phase**: Phase 4 — Multi-Agent AI & Disaster Intelligence  
**Authorized Repository**: `https://github.com/singhrohit09/RAKSHAGRID.git`

This document details the operational specification, inputs, outputs, scoring logic, permitted tools, and fallback behavior for all five specialized agents in RakshaGrid.

---

## 1. AGENT 1: Disaster Risk Intelligence Agent (`disaster_risk`)

### Purpose
Analyzes meteorological telemetry, hydrological river baselines, active emergency incidents, and spatial hazard geofences to compute regional disaster risk scores and identify flood and storm vulnerability.

### Inputs
```typescript
interface DisasterRiskInput {
  latitude?: number;         // Default: 28.6139 (Delhi NCR center)
  longitude?: number;        // Default: 77.2090
  radiusKm?: number;         // Default: 35 km operational radius
  focusRegionName?: string;  // Optional target sector filter
}
```

### Risk Level Tiers & Scoring Logic
- **LOW (0–29)**: Ambient conditions; routine monitoring.
- **MODERATE (30–49)**: Seasonal rain, minor localized pooling, or moderate winds (25–40 km/h).
- **HIGH (50–74)**: Heavy rainfall (>15 mm), rising river gauge trends, active critical incidents, or proximity to hazard geofences.
- **CRITICAL (75–100)**: Torrential precipitation (>50 mm), river gauge exceeding danger level (>205.33m on Yamuna), active gale winds (>60 km/h), or multiple unresolved critical incidents.

### Output Schema
```typescript
interface DisasterRiskOutput {
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  overallRiskScore: number;                 // 0 to 100
  confidenceScore: number;                  // 0 to 100
  affectedAreas: AreaRiskAssessment[];      // Sector breakdowns
  primaryContributingFactors: string[];    // Major risk drivers
  recommendedPrecautions: string[];        // Recommended civil advisories
  dataSources: DataProvenance[];            // Live vs simulated badges
  assessmentTimestamp: string;             // ISO 8601 UTC timestamp
  isDegraded: boolean;                     // True if external weather stream offline
  degradedReason?: string;
}
```

### Permitted Tools
`OpenMeteoWeather`, `HydrologyTelemetricEngine`, `GeofenceSpatialEvaluator`, `IncidentRegistry`.

---

## 2. AGENT 2: Incident Intelligence & Prioritization Agent (`incident_prioritization`)

### Purpose
Triages active emergency incidents dynamically based on severity, reported casualties, exposed population, unaddressed duration, and spatial proximity to active hazard zones.

### Inputs
Takes zero required parameters; queries all non-closed incidents and active geofences from the relational database.

### Priority Level Tiers
- **P1 — CRITICAL**: Immediate threat to life, active casualties, or containment breach. Requires rapid incident commander dispatch.
- **P2 — HIGH**: High risk of injury or major structural destruction (e.g. major transformer fire, severe waterlogging).
- **P3 — MEDIUM**: Secondary emergency hazard or controlled incident requiring coordinated response.
- **P4 — LOW**: Minor nuisance or monitoring incident with negligible immediate threat.

### Urgency Scoring Components
1. **Base Severity**: Critical (+40), High (+25), Medium (+12).
2. **Casualties**: +10 per confirmed casualty (up to +30).
3. **Population Density**: +20 for >500 exposed, +10 for >100 exposed.
4. **Unattended Aging**: +15 for unassigned incidents aged >4 hours.
5. **Geofence Proximity**: +10 if within 3,000 meters of a declared critical risk zone.

### Output Schema
```typescript
interface IncidentPrioritizationOutput {
  prioritizedIncidents: PrioritizedIncidentRecommendation[];
  escalationsCount: number;
  criticalCount: number;
  confidenceScore: number;
  dataSources: DataProvenance[];
  timestamp: string;
}
```

---

## 3. AGENT 3: Smart Resource Allocation Agent (`resource_allocation`)

### Purpose
Calculates tactical matching between available emergency response teams, warehouse inventory supplies, and municipal shelter beds. Recommends allocations without autonomous execution.

### Inputs
```typescript
interface ResourceAllocationInput {
  targetIncidentId?: string; // Optional focus on single incident
}
```

### Allocation Rules & Safeguards
- **Strict Availability Enforcement**: NEVER recommends teams with status other than `'Available'`. Teams currently `'Deployed'` or `'Offline'` are excluded.
- **Stock Depletion Guards**: Recommended resource quantities cannot exceed `quantity_available`. Flags a warning if allocation will cause stock to drop below `min_threshold`.
- **Haversine Distance**: Calculates spherical road distance in kilometers using terrestrial coordinates. If GPS coordinates are absent, explicitly flags `'distance telemetry unavailable'`.
- **Shelter Overload Redirection**: If a shelter's occupancy exceeds 80%, generates a recommendation to divert evacuees to an alternative local shelter with <60% occupancy.

### Output Schema
```typescript
interface ResourceAllocationOutput {
  teamRecommendations: TeamAllocationRecommendation[];
  supplyRecommendations: ResourceSupplyRecommendation[];
  shelterRecommendations: ShelterRecommendation[];
  shortages: ResourceShortageWarning[];
  resourceConflicts: string[];
  confidenceScore: number;
  dataSources: DataProvenance[];
  timestamp: string;
}
```

---

## 4. AGENT 4: AI Emergency Response Coordinator (`response_coordinator`)

### Purpose
Acts as the central command dispatcher. Parses natural language questions, coordinates parallel dispatches to specialized sub-agents, detects conflicting recommendations, and formulates a 3-phase operational action plan.

### Inputs
```typescript
interface CoordinatorRunInput {
  query: string;           // Operator question (e.g. "Assess flood risk in Zone O and recommend teams")
  focusRegion?: string;    // Optional geographical sector
  latitude?: number;
  longitude?: number;
}
```

### 3-Phase Action Plan Structure
1. **Immediate Phase (0–2 Hours)**: Life-safety evacuations, rapid dispatch of rescue watercraft to P1 incidents, and sounding precautionary flood sirens.
2. **Short-Term Phase (2–8 Hours)**: Staging high-capacity dewatering pumps, secondary team matching, and perimeter cordons.
3. **Stabilization Phase (8–24 Hours)**: Secondary shelter supply requisitions, infrastructure damage surveys, and inter-agency situation reports.

### Output Schema
```typescript
interface ResponseCoordinatorOutput {
  executionId: string;
  userQuery: string;
  intent: string;
  agentsInvoked: AgentExecutionTrace[];
  consolidatedSummary: string;
  urgentSituations: string[];
  conflictingRecommendations: string[];
  synthesizedActionPlan: SynthesizedActionPlanStep[];
  overallConfidenceScore: number;
  dataSources: DataProvenance[];
  timestamp: string;
}
```

---

## 5. AGENT 5: Disaster Simulation Agent (`disaster_simulation`)

### Purpose
Provides a safe, isolated sandbox to simulate disaster scenarios (such as cloudbursts, river dyke breaches, and road network washouts) to stress-test municipal capacity and evaluate competing countermeasure strategies.

### Inputs
```typescript
interface SimulationScenarioInput {
  scenarioName: string;
  rainfallIntensityMmPerHour: number; // 0 to 500 mm/hr
  riverGaugeRiseMeters: number;       // 0 to 15 meters
  simultaneousIncidentsCount: number; // 1 to 50 incidents
  disabledTeamIds: string[];         // Teams simulated as blocked/inaccessible
  targetRegion: string;
  durationHours: number;
}
```

### Output Schema
```typescript
interface DisasterSimulationOutput {
  simulationId: string;
  scenarioName: string;
  isSimulatedSandbox: true;
  warningNotice: string;
  inputParameters: SimulationScenarioInput;
  simulatedIncidents: {
    id: string;
    title: string;
    severity: string;
    simulatedLocation: string;
    lat: number;
    lng: number;
    estimatedAffectedPopulation: number;
  }[];
  expectedRiskChanges: {
    area: string;
    baselineRiskScore: number;
    simulatedRiskScore: number;
    riskDelta: number;
    baselineRiskLevel: string;
    simulatedRiskLevel: string;
  }[];
  potentiallyAffectedAreas: string[];
  estimatedResourceRequirements: {
    resourceName: string;
    category: string;
    availableInProduction: number;
    simulatedDemand: number;
    simulatedShortage: number;
  }[];
  potentialBottlenecks: string[];
  strategyComparisons: SimulationStrategyComparison[];
  suggestedOptimalStrategy: string;
  timestamp: string;
}
```

