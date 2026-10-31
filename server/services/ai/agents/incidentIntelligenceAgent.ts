import { db } from '../../../db/connection.js';
import { haversineDistanceMeters } from '../../gis/geofenceEngine.js';
import { providerFactory } from '../providers/providerFactory.js';
import { 
  IncidentPrioritizationOutput, 
  PrioritizedIncidentRecommendation, 
  IncidentPriority, 
  DataProvenance 
} from '../types.js';

export class IncidentIntelligenceAgent {
  public readonly id = 'incident_prioritization';
  public readonly name = 'Incident Intelligence & Prioritization Agent';
  public readonly role = 'Dynamic Incident Triage, Severity Ranking & Escalation Advisor';

  public async prioritize(): Promise<IncidentPrioritizationOutput> {
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // 1. Fetch active incidents from database
    const incidents = await db.query<any>(
      `SELECT i.*, t.name as assigned_team_name, t.type as assigned_team_type 
       FROM incidents i 
       LEFT JOIN teams t ON i.assigned_team_id = t.id 
       WHERE i.status != 'Closed' 
       ORDER BY i.reported_at DESC`
    );

    // 2. Fetch active geofences to assess spatial risk containment
    const geofences = await db.query<any>(
      `SELECT * FROM geofences WHERE status = 'Active'`
    );

    const dataSources: DataProvenance[] = [
      {
        source: 'RakshaGrid Incidents Relational Ledger',
        sourceAttribution: 'State Operations Center Database',
        timestamp: nowIso,
        isLive: true,
        isSimulated: false,
        isCached: false
      },
      {
        source: 'Operational GIS Geofence Engine',
        sourceAttribution: 'Spatial Hazard Boundary Registry',
        timestamp: nowIso,
        isLive: true,
        isSimulated: false,
        isCached: false
      }
    ];

    if (incidents.length === 0) {
      return {
        prioritizedIncidents: [],
        escalationsCount: 0,
        criticalCount: 0,
        confidenceScore: 100,
        dataSources,
        timestamp: nowIso
      };
    }

    // 3. Fallback Deterministic Prioritization Algorithm
    const fallbackGenerator = (): IncidentPrioritizationOutput => {
      return this.computeDeterministicPrioritization(incidents, geofences, nowMs, dataSources, nowIso);
    };

    // 4. External LLM Triage with Deterministic Fallback Protection
    const systemPrompt = `You are the Incident Intelligence & Prioritization Agent for RakshaGrid.
Triage active emergency incidents based on severity, affected population, casualties, age, and hazard proximity.
Priority tiers:
- P1: Life-threatening, immediate dispatch required, active casualties, or containment breach.
- P2: High risk of life or major infrastructure loss, severe waterlogging, active fire.
- P3: Controlled incident or secondary hazard requiring coordination.
- P4: Low impact, monitoring only.
Return valid JSON matching the IncidentPrioritizationOutput schema.`;

    const userPrompt = `Active Incidents to Triage:
${JSON.stringify(incidents.map(i => ({
  id: i.id,
  title: i.title,
  currentPriority: i.priority,
  severity: i.severity,
  category: i.category,
  affectedPop: i.affected_population,
  casualties: i.casualties,
  reportedAt: i.reported_at,
  hasAssignedTeam: Boolean(i.assigned_team_id),
  lat: i.latitude,
  lng: i.longitude
})))}
Active Geofenced Hazard Zones:
${JSON.stringify(geofences.map(g => ({ name: g.name, severity: g.severity, cat: g.category })))}
Perform triage and rank each incident.`;

    const provider = providerFactory.getActiveProvider();
    const result = await provider.generateStructuredCompletion<IncidentPrioritizationOutput>(
      userPrompt,
      systemPrompt,
      fallbackGenerator
    );

    const output = result.data;
    output.timestamp = nowIso;
    output.dataSources = dataSources;
    return output;
  }

  private computeDeterministicPrioritization(
    incidents: any[],
    geofences: any[],
    nowMs: number,
    dataSources: DataProvenance[],
    nowIso: string
  ): IncidentPrioritizationOutput {
    const recommendations: PrioritizedIncidentRecommendation[] = [];

    for (const inc of incidents) {
      let urgencyScore = 20;
      const evidence: string[] = [];
      const currentPriority = inc.priority || 'P2';

      // 1. Severity weight
      if (inc.severity === 'Critical') {
        urgencyScore += 40;
        evidence.push('Reported as Critical severity level');
      } else if (inc.severity === 'High') {
        urgencyScore += 25;
        evidence.push('High severity operational classification');
      } else if (inc.severity === 'Medium') {
        urgencyScore += 12;
      }

      // 2. Casualty and population impact
      const casualties = inc.casualties || 0;
      const affectedPop = inc.affected_population || 0;

      if (casualties > 0) {
        urgencyScore += Math.min(30, casualties * 10);
        evidence.push(`${casualties} confirmed casualties reported on-site`);
      }

      if (affectedPop > 500) {
        urgencyScore += 20;
        evidence.push(`Dense population impact (>500 persons directly exposed)`);
      } else if (affectedPop > 100) {
        urgencyScore += 10;
        evidence.push(`Population impact: ${affectedPop} persons affected`);
      }

      // 3. Team assignment status
      if (!inc.assigned_team_id) {
        urgencyScore += 15;
        evidence.push('No response team currently assigned');
      }

      // 4. Age factor (unattended incident aging)
      const reportedMs = new Date(inc.reported_at).getTime();
      const ageHours = (nowMs - reportedMs) / (1000 * 60 * 60);

      if (ageHours > 4 && (!inc.assigned_team_id || inc.status === 'Reported')) {
        urgencyScore += 15;
        evidence.push(`Incident unresolved for ${Math.round(ageHours)} hours without progression`);
      } else if (ageHours > 1) {
        urgencyScore += 5;
      }

      // 5. Geofence proximity check
      let nearestDistMeters = Infinity;
      let nearestZoneName = '';
      for (const g of geofences) {
        if (g.center_latitude && g.center_longitude && inc.latitude && inc.longitude) {
          const d = haversineDistanceMeters(inc.latitude, inc.longitude, g.center_latitude, g.center_longitude);
          if (d < nearestDistMeters) {
            nearestDistMeters = d;
            nearestZoneName = g.name;
          }
        }
      }

      if (nearestDistMeters < 3000) {
        urgencyScore += 10;
        evidence.push(`Proximity to hazard geofence '${nearestZoneName}' (${Math.round(nearestDistMeters)}m)`);
      }

      urgencyScore = Math.min(100, Math.max(10, urgencyScore));

      // Determine recommended priority tier
      let recommendedPriority: IncidentPriority = 'P3';
      if (urgencyScore >= 75) recommendedPriority = 'P1';
      else if (urgencyScore >= 50) recommendedPriority = 'P2';
      else if (urgencyScore >= 25) recommendedPriority = 'P3';
      else recommendedPriority = 'P4';

      const priorityChanged = recommendedPriority !== currentPriority;
      const escalationNeeded = (recommendedPriority === 'P1' && currentPriority !== 'P1') || 
                               (urgencyScore >= 80 && !inc.assigned_team_id);

      let suggestedNextAction = 'Maintain standard operational dispatch and monitor task progression.';
      if (recommendedPriority === 'P1') {
        suggestedNextAction = inc.assigned_team_id 
          ? 'Reinforce on-site incident team with specialized medical/rescue logistics.' 
          : 'Immediately authorize rapid deployment of closest available rescue squad.';
      } else if (recommendedPriority === 'P2') {
        suggestedNextAction = 'Assign secondary task force and verify local shelter capacity.';
      }

      recommendations.push({
        incidentId: inc.id,
        title: inc.title,
        currentPriority,
        recommendedPriority,
        priorityChanged,
        reason: escalationNeeded 
          ? `Urgent escalation indicated due to cumulative impact score (${urgencyScore}/100) and unassigned operational status.`
          : `Prioritization aligned with severity (${inc.severity}) and affected population (${affectedPop}).`,
        supportingEvidence: evidence,
        confidenceScore: 92,
        suggestedNextAction,
        urgencyScore,
        escalationNeeded,
        affectedPopulation: affectedPop,
        distanceToNearestRiskZoneMeters: nearestDistMeters < 50000 ? Math.round(nearestDistMeters) : undefined
      });
    }

    // Sort by urgency score descending
    recommendations.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const escalationsCount = recommendations.filter(r => r.escalationNeeded).length;
    const criticalCount = recommendations.filter(r => r.recommendedPriority === 'P1').length;

    return {
      prioritizedIncidents: recommendations,
      escalationsCount,
      criticalCount,
      confidenceScore: 94,
      dataSources,
      timestamp: nowIso
    };
  }
}

export const incidentIntelligenceAgent = new IncidentIntelligenceAgent();
