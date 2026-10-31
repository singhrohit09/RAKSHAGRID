/**
 * RakshaGrid Phase 4 — Multi-Agent AI System Core Types
 * Defines data contracts, schemas, agent IDs, risk levels, priorities,
 * execution states, and data provenance interfaces.
 */

export type AgentId = 
  | 'disaster_risk'
  | 'incident_prioritization'
  | 'resource_allocation'
  | 'response_coordinator'
  | 'disaster_simulation';

export type AgentExecutionStatus = 
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DEGRADED';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface DataProvenance {
  source: string;
  sourceAttribution: string;
  timestamp: string;
  isLive: boolean;
  isSimulated: boolean;
  isCached: boolean;
  coverageArea?: string;
}

export interface ContributingFactor {
  factor: string;
  weight: number; // 0 to 1
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface AreaRiskAssessment {
  areaName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  contributingFactors: ContributingFactor[];
  hazardTypes: ('flood' | 'heavy_rainfall' | 'storm' | 'landslide' | 'hazmat' | 'other')[];
  recommendedPrecautions: string[];
}

export interface DisasterRiskOutput {
  overallRiskLevel: RiskLevel;
  overallRiskScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  affectedAreas: AreaRiskAssessment[];
  primaryContributingFactors: string[];
  recommendedPrecautions: string[];
  dataSources: DataProvenance[];
  assessmentTimestamp: string;
  isDegraded: boolean;
  degradedReason?: string;
}

export interface PrioritizedIncidentRecommendation {
  incidentId: string;
  title: string;
  currentPriority: string;
  recommendedPriority: IncidentPriority;
  priorityChanged: boolean;
  reason: string;
  supportingEvidence: string[];
  confidenceScore: number; // 0 - 100
  suggestedNextAction: string;
  urgencyScore: number; // 0 - 100
  escalationNeeded: boolean;
  affectedPopulation?: number;
  distanceToNearestRiskZoneMeters?: number;
}

export interface IncidentPrioritizationOutput {
  prioritizedIncidents: PrioritizedIncidentRecommendation[];
  escalationsCount: number;
  criticalCount: number;
  confidenceScore: number;
  dataSources: DataProvenance[];
  timestamp: string;
}

export interface TeamAllocationRecommendation {
  recommendationId: string;
  targetIncidentId: string;
  targetIncidentTitle: string;
  suggestedTeamId: string;
  suggestedTeamName: string;
  teamType: string;
  teamStatus: string;
  skills: string[];
  reason: string;
  estimatedDistanceKm?: number;
  confidenceScore: number;
  missingInformationOrConstraints: string[];
  approvalStatus: ApprovalStatus;
}

export interface ResourceSupplyRecommendation {
  recommendationId: string;
  targetIncidentId: string;
  targetIncidentTitle: string;
  resourceId: string;
  resourceName: string;
  category: string;
  availableQuantity: number;
  recommendedQuantity: number;
  unit: string;
  reason: string;
  confidenceScore: number;
  missingInformationOrConstraints: string[];
  approvalStatus: ApprovalStatus;
}

export interface ShelterRecommendation {
  recommendationId: string;
  targetIncidentId?: string;
  shelterId: string;
  shelterName: string;
  capacity: number;
  currentOccupancy: number;
  availableCapacity: number;
  occupancyRate: number;
  reason: string;
  estimatedDistanceKm?: number;
  isAlternative: boolean;
  confidenceScore: number;
}

export interface ResourceShortageWarning {
  resourceId?: string;
  resourceName: string;
  category: string;
  currentStock: number;
  estimatedDemand: number;
  shortfall: number;
  severity: 'moderate' | 'high' | 'critical';
  mitigationAdvice: string;
}

export interface ResourceAllocationOutput {
  teamRecommendations: TeamAllocationRecommendation[];
  supplyRecommendations: ResourceSupplyRecommendation[];
  shelterRecommendations: ShelterRecommendation[];
  shortages: ResourceShortageWarning[];
  resourceConflicts: string[];
  confidenceScore: number;
  dataSources: DataProvenance[];
  timestamp: string;
}

export interface AgentExecutionTrace {
  agentId: AgentId;
  agentName: string;
  status: AgentExecutionStatus;
  durationMs: number;
  confidenceScore: number;
  summary: string;
  error?: string;
}

export interface SynthesizedActionPlanStep {
  stepNumber: number;
  phase: 'immediate' | 'short_term' | 'stabilization';
  action: string;
  assignedRole: string;
  priority: 'P1' | 'P2' | 'P3';
  requiresHumanApproval: boolean;
  approvalEntity?: {
    type: 'team' | 'resource' | 'incident' | 'alert';
    id: string;
  };
}

export interface ResponseCoordinatorOutput {
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

export interface SimulationScenarioInput {
  scenarioName: string;
  rainfallIntensityMmPerHour: number;
  riverGaugeRiseMeters: number;
  simultaneousIncidentsCount: number;
  disabledTeamIds: string[];
  targetRegion: string;
  durationHours: number;
}

export interface SimulationStrategyComparison {
  strategyName: string;
  description: string;
  evacuationEfficiencyPct: number;
  shelterOverloadRisk: 'low' | 'moderate' | 'high' | 'extreme';
  resourceExhaustionRisk: 'low' | 'moderate' | 'high' | 'extreme';
  estimatedResponseTimeHours: number;
  pros: string[];
  cons: string[];
  recommended: boolean;
}

export interface DisasterSimulationOutput {
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
    baselineRiskLevel: RiskLevel;
    simulatedRiskLevel: RiskLevel;
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

export interface AgentDescriptor {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  version: string;
  status: 'online' | 'degraded' | 'offline';
  lastExecutionAt: string | null;
  lastExecutionStatus: AgentExecutionStatus | null;
  permittedTools: string[];
}

