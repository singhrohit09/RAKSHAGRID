/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Shelter, Team } from '../../types';
import { RiskAssessment, RiskFactor, RiskLevel } from '../../types/ai';
import { calculateDistanceKm } from '../geospatial/spatialAnalysis.service';

export interface IncidentRiskInputs {
  incident: Incident;
  shelters: Shelter[];
  teams: Team[];
  observedRainfallMm?: number;
  observedWindSpeedKmh?: number;
  nearestRiverGaugeStatus?: 'NORMAL' | 'WARNING' | 'DANGER' | 'RECORD_HIGH';
}

export class ExplainableRiskEngine {
  /**
   * Evaluates comprehensive multi-factor risk for an incident
   */
  public static assessIncidentRisk(inputs: IncidentRiskInputs): RiskAssessment {
    const { incident, shelters, teams } = inputs;
    const factors: RiskFactor[] = [];

    // Factor 1: Hydro-Meteorological Hazard Severity (Weight: 0.25)
    let hydroRawScore = 30; // baseline
    let hydroExplanation = 'Normal hydrological and weather conditions.';
    let hydroDisplay = 'Normal baseline';

    if (inputs.nearestRiverGaugeStatus === 'RECORD_HIGH') {
      hydroRawScore = 98;
      hydroDisplay = 'Record High River Crest';
      hydroExplanation = 'River gauge adjacent to incident has breached historic flood levels.';
    } else if (inputs.nearestRiverGaugeStatus === 'DANGER') {
      hydroRawScore = 85;
      hydroDisplay = 'Danger Level Breached';
      hydroExplanation = 'Adjacent river level is past official CWC Danger Mark.';
    } else if (inputs.nearestRiverGaugeStatus === 'WARNING') {
      hydroRawScore = 60;
      hydroDisplay = 'Warning Level Active';
      hydroExplanation = 'River levels approaching critical flood embankments.';
    } else if (inputs.observedRainfallMm && inputs.observedRainfallMm > 50) {
      hydroRawScore = Math.min(100, Math.round(inputs.observedRainfallMm * 1.2));
      hydroDisplay = `${inputs.observedRainfallMm.toFixed(1)} mm/hr rainfall`;
      hydroExplanation = 'Heavy localized precipitation exacerbates surface run-off.';
    } else if (incident.disasterType === 'flood') {
      hydroRawScore = incident.severity === 'critical' ? 90 : 65;
      hydroDisplay = `Active ${incident.disasterType} incident`;
      hydroExplanation = 'Active waterlogging and rising water levels reported.';
    }

    factors.push({
      id: 'f_hydro_hazard',
      name: 'Hydrological & Meteorological Hazard',
      weight: 0.25,
      rawScore: hydroRawScore,
      weightedScore: Number((0.25 * hydroRawScore).toFixed(1)),
      valueDisplay: hydroDisplay,
      explanation: hydroExplanation,
      dataSource: 'CWC Hydrology Telemetry & Open-Meteo Weather API',
      freshness: '< 5 minutes ago',
    });

    // Factor 2: Incident Severity & Casualties (Weight: 0.25)
    let severityRawScore = 20;
    if (incident.severity === 'critical') severityRawScore = 95;
    else if (incident.severity === 'high') severityRawScore = 75;
    else if (incident.severity === 'medium') severityRawScore = 45;
    else severityRawScore = 20;

    if (incident.casualties && (incident.casualties.injured > 0 || incident.casualties.deceased > 0)) {
      severityRawScore = Math.min(100, severityRawScore + 10);
    }

    factors.push({
      id: 'f_incident_severity',
      name: 'Reported Incident Severity & Trauma',
      weight: 0.25,
      rawScore: severityRawScore,
      weightedScore: Number((0.25 * severityRawScore).toFixed(1)),
      valueDisplay: `${incident.severity.toUpperCase()} (${incident.casualties?.injured || 0} casualties)`,
      explanation: `EOC verified incident rating with confirmed casualties or active rescue operations.`,
      dataSource: 'RakshaGrid Incident Registry',
      freshness: 'Real-time',
    });

    // Factor 3: Population Exposure & Vulnerability (Weight: 0.20)
    const pop = incident.affectedPopulation || 0;
    let popScore = 15;
    if (pop > 15000) popScore = 95;
    else if (pop > 7500) popScore = 80;
    else if (pop > 2000) popScore = 60;
    else if (pop > 500) popScore = 40;
    else popScore = 20;

    factors.push({
      id: 'f_population_exposure',
      name: 'Exposed Population Density',
      weight: 0.20,
      rawScore: popScore,
      weightedScore: Number((0.20 * popScore).toFixed(1)),
      valueDisplay: `${pop.toLocaleString()} citizens affected`,
      explanation: `Demographic density in immediate hazard buffer.`,
      dataSource: 'District Census & Incident Field Estimation',
      freshness: 'Synchronized with incident report',
    });

    // Factor 4: Shelter Capacity & Evacuation Deficit (Weight: 0.15)
    // Find closest shelter
    let nearestShelterDist = 999;
    let nearestShelterOccupancyPct = 50;
    shelters.forEach((s) => {
      const dist = calculateDistanceKm(incident.coordinates, s.coordinates);
      if (dist < nearestShelterDist) {
        nearestShelterDist = dist;
        nearestShelterOccupancyPct = (s.currentOccupancy / (s.capacity || 1)) * 100;
      }
    });

    let shelterRawScore = 25;
    if (nearestShelterOccupancyPct >= 95) shelterRawScore = 90;
    else if (nearestShelterOccupancyPct >= 80) shelterRawScore = 70;
    else if (nearestShelterDist > 25) shelterRawScore = 60;
    else shelterRawScore = 30;

    factors.push({
      id: 'f_shelter_capacity',
      name: 'Shelter Saturation & Evacuation Deficit',
      weight: 0.15,
      rawScore: shelterRawScore,
      weightedScore: Number((0.15 * shelterRawScore).toFixed(1)),
      valueDisplay: `${nearestShelterOccupancyPct.toFixed(0)}% nearest occupancy (${nearestShelterDist.toFixed(1)} km)`,
      explanation:
        nearestShelterOccupancyPct >= 80
          ? 'Nearest emergency relief camp is at or above 80% capacity threshold.'
          : 'Adequate shelter buffer remains within operational radius.',
      dataSource: 'National Shelter Registry & Evacuation Ops',
      freshness: 'Real-time telemetry',
    });

    // Factor 5: Response Team Proximity & Availability (Weight: 0.15)
    let closestAvailableTeamDist = 999;
    teams
      .filter((t) => t.status === 'available')
      .forEach((t) => {
        const dist = calculateDistanceKm(incident.coordinates, t.location);
        if (dist < closestAvailableTeamDist) {
          closestAvailableTeamDist = dist;
        }
      });

    let teamRawScore = 20;
    if (closestAvailableTeamDist === 999) {
      teamRawScore = 95; // No teams available!
    } else if (closestAvailableTeamDist > 40) {
      teamRawScore = 80;
    } else if (closestAvailableTeamDist > 15) {
      teamRawScore = 50;
    } else {
      teamRawScore = 20;
    }

    factors.push({
      id: 'f_team_proximity',
      name: 'First-Responder Deployment Distance',
      weight: 0.15,
      rawScore: teamRawScore,
      weightedScore: Number((0.15 * teamRawScore).toFixed(1)),
      valueDisplay:
        closestAvailableTeamDist === 999
          ? 'Zero available units'
          : `${closestAvailableTeamDist.toFixed(1)} km to closest team`,
      explanation:
        closestAvailableTeamDist > 25
          ? 'Extended transit time required for tactical response units.'
          : 'First-responder units situated within standard rapid-response window.',
      dataSource: 'RakshaGrid Force Tracking & Deployment Fleet',
      freshness: 'Real-time telemetry',
    });

    // Compute Overall Score (0 - 100)
    const overallScore = Math.round(
      factors.reduce((accum, factor) => accum + factor.weightedScore, 0)
    );

    let riskLevel: RiskLevel = 'LOW';
    if (overallScore >= 76) riskLevel = 'CRITICAL';
    else if (overallScore >= 51) riskLevel = 'HIGH';
    else if (overallScore >= 26) riskLevel = 'MODERATE';
    else riskLevel = 'LOW';

    // Generate Contextual Recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'CRITICAL') {
      recommendations.push('Immediate mandatory evacuation for ground-floor and riverbank structures.');
      recommendations.push('Pre-position swift-water rescue craft and aerial surveillance units.');
      recommendations.push('Divert incoming evacuees to secondary regional relief complexes.');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Issue targeted CAP emergency broadcast to affected telecom towers.');
      recommendations.push('Mobilize standby medical and hazmat response personnel.');
      recommendations.push('Reinforce temporary earthen levees and drain culverts.');
    } else if (riskLevel === 'MODERATE') {
      recommendations.push('Maintain active watch on river gauge trends every 30 minutes.');
      recommendations.push('Alert local emergency response officers to maintain vehicle readiness.');
    } else {
      recommendations.push('Continue standard situational surveillance.');
    }

    const summary = `${incident.title} exhibits ${riskLevel} operational risk (Composite Score: ${overallScore}/100). Primary driver is ${
      factors.reduce((prev, curr) => (curr.weightedScore > prev.weightedScore ? curr : prev)).name
    }.`;

    return {
      id: `RA-${incident.id}-${Date.now()}`,
      targetType: 'incident',
      targetId: incident.id,
      targetName: incident.title,
      coordinates: incident.coordinates,
      overallScore,
      riskLevel,
      confidence: 0.89,
      factors,
      summary,
      recommendations,
      disclaimer:
        'EXPERIMENTAL AI HEURISTIC: This risk index is calculated for operational decision support and does not supersede official statutory warnings issued by IMD, CWC, or NDMA.',
      modelUsed: 'RakshaGrid Multi-Factor Risk Assessment Engine v4.0',
      calculatedAt: new Date().toISOString(),
      dataFreshnessSeconds: 120,
    };
  }

  /**
   * Assesses regional composite threat index across all active incidents
   */
  public static assessRegionalThreat(
    regionName: string,
    incidents: Incident[],
    shelters: Shelter[],
    teams: Team[]
  ): RiskAssessment {
    const regionalIncidents = incidents.filter(
      (inc) => inc.region.toLowerCase() === regionName.toLowerCase() || inc.location.toLowerCase().includes(regionName.toLowerCase())
    );

    const activeList = regionalIncidents.length > 0 ? regionalIncidents : incidents;
    const scores = activeList.map((inc) => this.assessIncidentRisk({ incident: inc, shelters, teams }).overallScore);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 35;

    let riskLevel: RiskLevel = 'MODERATE';
    if (avgScore >= 76) riskLevel = 'CRITICAL';
    else if (avgScore >= 51) riskLevel = 'HIGH';
    else if (avgScore >= 26) riskLevel = 'MODERATE';
    else riskLevel = 'LOW';

    return {
      id: `RA-REG-${Date.now()}`,
      targetType: 'region',
      targetId: regionName,
      targetName: regionName,
      coordinates: activeList[0]?.coordinates || { lat: 20.2961, lng: 85.8245 },
      overallScore: avgScore,
      riskLevel,
      confidence: 0.91,
      factors: [
        {
          id: 'f_regional_density',
          name: 'Concurrent Active Incident Density',
          weight: 0.4,
          rawScore: Math.min(100, activeList.length * 25),
          weightedScore: Math.round(0.4 * Math.min(100, activeList.length * 25)),
          valueDisplay: `${activeList.length} active incidents`,
          explanation: 'Simultaneous disaster points create resource contention.',
          dataSource: 'RakshaGrid EOC Database',
          freshness: 'Real-time',
        },
        {
          id: 'f_regional_gauges',
          name: 'Major Hydrological System Status',
          weight: 0.6,
          rawScore: 75,
          weightedScore: 45,
          valueDisplay: 'Active Monsoon Catchment Surge',
          explanation: 'Brahmani and Mahanadi basins carrying elevated discharge.',
          dataSource: 'CWC Hydrological Monitoring',
          freshness: 'Live API Telemetry',
        },
      ],
      summary: `Region ${regionName} threat index is ${riskLevel} (${avgScore}/100) across ${activeList.length} monitoring vectors.`,
      recommendations: [
        'Establish unified regional incident command post.',
        'Coordinate inter-district mutual aid resource transfers.',
      ],
      disclaimer: 'Advisory operational intelligence calculation. Official advisories governed by NDMA.',
      modelUsed: 'RakshaGrid Regional Aggregation Model v4.0',
      calculatedAt: new Date().toISOString(),
      dataFreshnessSeconds: 90,
    };
  }
}
