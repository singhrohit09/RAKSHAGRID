/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinates } from './index';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT_DATA';

export interface RiskFactor {
  id: string;
  name: string;
  weight: number; // 0 to 1
  rawScore: number; // 0 to 100
  weightedScore: number; // weight * rawScore
  valueDisplay: string;
  explanation: string;
  dataSource: string;
  freshness: string;
}

export interface RiskAssessment {
  id: string;
  targetType: 'incident' | 'zone' | 'region';
  targetId: string;
  targetName: string;
  coordinates: Coordinates;
  overallScore: number; // 0 to 100
  riskLevel: RiskLevel;
  confidence: number; // 0.0 to 1.0
  factors: RiskFactor[];
  summary: string;
  recommendations: string[];
  disclaimer: string;
  modelUsed: string;
  calculatedAt: string;
  dataFreshnessSeconds: number;
}

export type AgentType =
  | 'disaster_intel'
  | 'weather_intel'
  | 'flood_intel'
  | 'resource_opt'
  | 'shelter_mgmt'
  | 'emergency_planning'
  | 'chief_orchestrator';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentRun {
  id: string;
  agentType: AgentType;
  agentName: string;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  inputMetrics: Record<string, unknown>;
  findings: string[];
  threatIndicators: Array<{
    title: string;
    level: 'normal' | 'elevated' | 'severe' | 'critical';
    metric: string;
  }>;
  recommendedActions: string[];
  confidence: number;
  isAiPowered: boolean;
  modelIdentifier: string;
}

export interface SituationAwarenessReport {
  id: string;
  generatedAt: string;
  threatLevel: RiskLevel;
  overallScore: number;
  executiveSummary: string;
  topThreats: Array<{
    id: string;
    title: string;
    severity: string;
    threatDescription: string;
    recommendedMitigation: string;
  }>;
  criticalShelterAlerts: Array<{
    shelterId: string;
    shelterName: string;
    occupancyPct: number;
    issue: string;
    action: string;
  }>;
  resourceDeficits: Array<{
    resourceName: string;
    currentAvailable: number;
    estimatedRequired: number;
    deficit: number;
    urgency: 'high' | 'medium' | 'critical';
  }>;
  evacuationPriorities: Array<{
    zoneName: string;
    priorityOrder: number;
    estimatedPopulation: number;
    primaryHazard: string;
  }>;
  orchestratorAgentRuns: AgentRun[];
  confidenceScore: number;
  dataFreshnessTimestamp: string;
  modelAttribution: string;
}

export type RecommendationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ResourceRecommendation {
  id: string;
  incidentId: string;
  incidentTitle: string;
  incidentSeverity: string;
  requiredSpecialty: string;
  recommendedTeamId: string;
  recommendedTeamName: string;
  teamLeader: string;
  distanceKm: number;
  estimatedEtaMinutes: number;
  rationale: string;
  confidence: number;
  status: RecommendationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ScenarioParameters {
  rainfallMultiplier: number; // 1.0 to 3.0
  riverSurgeMeters: number; // 0.0 to 5.0
  windSpeedDeltaKmh: number; // 0 to 80
  damReleaseCusecs: number; // 0 to 150000
  powerGridOutage: boolean;
  bridgeCollapses: boolean;
}

export interface ScenarioImpacts {
  estimatedAffectedPopulation: number;
  threatenedSheltersCount: number;
  threatenedShelters: Array<{
    id: string;
    name: string;
    currentOccupancy: number;
    capacity: number;
    projectedRisk: string;
  }>;
  floodedZonesCount: number;
  floodedZones: string[];
  criticalInfrastructureImpacted: string[];
  estimatedResourceDeficits: Array<{
    item: string;
    projectedDeficit: number;
    unit: string;
  }>;
  projectedCasualtyRisk: 'low' | 'moderate' | 'high' | 'critical';
  simulationNarrative: string;
}

export interface DisasterScenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  parameters: ScenarioParameters;
  impacts: ScenarioImpacts;
  baselineDiff: {
    populationIncreasePct: number;
    additionalThreatenedShelters: number;
    newDeficitCount: number;
  };
  isSimulation: true; // Permanent watermark
}

export type AlertRecommendationStatus = 'DRAFT' | 'PROMOTED' | 'DISMISSED';

export interface AIAlertRecommendation {
  id: string;
  headline: string;
  disasterType: string;
  severity: 'warning' | 'watch' | 'advisory' | 'critical';
  certainty: 'observed' | 'likely' | 'possible';
  urgency: 'immediate' | 'expected' | 'future';
  affectedAreas: string[];
  publicInstructions: string;
  technicalRationale: string;
  confidenceScore: number;
  status: AlertRecommendationStatus;
  generatedAt: string;
  promotedAt?: string;
  promotedBy?: string;
  targetChannels: string[];
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Array<{
    title: string;
    source: string;
    value?: string;
  }>;
  toolCalls?: Array<{
    toolName: string;
    query: string;
    resultSummary: string;
  }>;
  isAiGenerated: boolean;
}

export interface ModelBenchmarkMetrics {
  modelName: string;
  evaluatedDataset: string;
  sampleSize: number;
  lastEvaluatedAt: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  brierScore: number;
  limitations: string[];
}
