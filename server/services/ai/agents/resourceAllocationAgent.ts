import { db } from '../../../db/connection.js';
import { haversineDistanceMeters } from '../../gis/geofenceEngine.js';
import { providerFactory } from '../providers/providerFactory.js';
import { 
  ResourceAllocationOutput, 
  TeamAllocationRecommendation, 
  ResourceSupplyRecommendation, 
  ShelterRecommendation, 
  ResourceShortageWarning, 
  DataProvenance 
} from '../types.js';

export interface ResourceAllocationInput {
  targetIncidentId?: string;
}

export class ResourceAllocationAgent {
  public readonly id = 'resource_allocation';
  public readonly name = 'Smart Resource Allocation Agent';
  public readonly role = 'Tactical Resource Matching, Logistics Optimization & Bottleneck Detection';

  public async recommend(input?: ResourceAllocationInput): Promise<ResourceAllocationOutput> {
    const nowIso = new Date().toISOString();

    // 1. Fetch available teams, active incidents, inventory resources, and shelters
    const incidents = await db.query<any>(
      `SELECT * FROM incidents WHERE status != 'Closed' ${input?.targetIncidentId ? 'AND id = ?' : ''} ORDER BY priority ASC, reported_at DESC`,
      input?.targetIncidentId ? [input.targetIncidentId] : []
    );

    const teams = await db.query<any>(
      `SELECT * FROM teams`
    );

    const resources = await db.query<any>(
      `SELECT * FROM resources`
    );

    const shelters = await db.query<any>(
      `SELECT * FROM shelters`
    );

    const dataSources: DataProvenance[] = [
      {
        source: 'RakshaGrid Teams Registry',
        sourceAttribution: 'State Disaster Response Force Roster',
        timestamp: nowIso,
        isLive: true,
        isSimulated: false,
        isCached: false
      },
      {
        source: 'Emergency Inventory Management System',
        sourceAttribution: 'Central Warehouse Logistics Ledger',
        timestamp: nowIso,
        isLive: true,
        isSimulated: false,
        isCached: false
      },
      {
        source: 'Municipal Shelter Capacity Registry',
        sourceAttribution: 'Department of Relief and Rehabilitation',
        timestamp: nowIso,
        isLive: true,
        isSimulated: false,
        isCached: false
      }
    ];

    // 2. Fallback Deterministic Matching Engine
    const fallbackGenerator = (): ResourceAllocationOutput => {
      return this.computeDeterministicRecommendations(incidents, teams, resources, shelters, dataSources, nowIso);
    };

    // 3. Optional External LLM Orchestration
    const systemPrompt = `You are the Smart Resource Allocation Agent for RakshaGrid.
Recommend response teams, inventory supplies, and shelter capacity to address active emergency incidents.
Rules:
- NEVER recommend teams with status != 'Available'.
- NEVER allocate resources that exceed available quantity.
- Calculate approximate distances when valid coordinates exist.
- Flag shortages and logistics bottlenecks.
- Return valid JSON matching the ResourceAllocationOutput schema.`;

    const userPrompt = `Operational Data:
Active Incidents: ${JSON.stringify(incidents.map(i => ({ id: i.id, title: i.title, priority: i.priority, cat: i.category, sev: i.severity, lat: i.latitude, lng: i.longitude, teamId: i.assigned_team_id })))}
Teams: ${JSON.stringify(teams.map(t => ({ id: t.id, name: t.name, status: t.status, type: t.type, skills: t.skills, lat: t.latitude, lng: t.longitude })))}
Inventory Resources: ${JSON.stringify(resources.map(r => ({ id: r.id, name: r.name, available: r.quantity_available, allocated: r.quantity_allocated, unit: r.unit, cat: r.category, min: r.min_threshold })))}
Shelters: ${JSON.stringify(shelters.map(s => ({ id: s.id, name: s.name, cap: s.capacity, occ: s.current_occupancy, lat: s.latitude, lng: s.longitude, status: s.status })))}
Generate optimal resource allocations and detect shortages.`;

    const provider = providerFactory.getActiveProvider();
    const result = await provider.generateStructuredCompletion<ResourceAllocationOutput>(
      userPrompt,
      systemPrompt,
      fallbackGenerator
    );

    const output = result.data;
    output.timestamp = nowIso;
    output.dataSources = dataSources;
    return output;
  }

  private computeDeterministicRecommendations(
    incidents: any[],
    teams: any[],
    resources: any[],
    shelters: any[],
    dataSources: DataProvenance[],
    nowIso: string
  ): ResourceAllocationOutput {
    const teamRecommendations: TeamAllocationRecommendation[] = [];
    const supplyRecommendations: ResourceSupplyRecommendation[] = [];
    const shelterRecommendations: ShelterRecommendation[] = [];
    const shortages: ResourceShortageWarning[] = [];
    const resourceConflicts: string[] = [];

    // Filter strictly available teams
    const availableTeams = teams.filter(t => t.status === 'Available');

    // 1. Team Allocation Matching
    const unassignedIncidents = incidents.filter(i => !i.assigned_team_id);
    const assignedInRecommendations = new Set<string>();

    for (const inc of unassignedIncidents) {
      // Find candidate teams with matching skills and proximity
      const candidates = availableTeams.filter(t => !assignedInRecommendations.has(t.id));
      if (candidates.length === 0) {
        resourceConflicts.push(`No available teams remaining to deploy to incident '${inc.title}' (${inc.priority}).`);
        continue;
      }

      // Rank by skill relevance and geographic proximity
      let bestTeam: any = null;
      let minDistanceKm = Infinity;

      for (const t of candidates) {
        let distKm: number | undefined;
        if (typeof inc.latitude === 'number' && typeof inc.longitude === 'number' &&
            typeof t.latitude === 'number' && typeof t.longitude === 'number') {
          const meters = haversineDistanceMeters(inc.latitude, inc.longitude, t.latitude, t.longitude);
          distKm = parseFloat((meters / 1000).toFixed(1));
        }

        const effectiveDist = distKm ?? 25; // Default distance if coordinates missing

        // Skill bonus: reduce effective distance if skills match incident category
        const skillsText = (t.skills || '').toLowerCase();
        const cat = (inc.category || '').toLowerCase();
        let skillMatch = false;

        if (cat.includes('flood') && (skillsText.includes('water') || skillsText.includes('boat') || skillsText.includes('flood'))) {
          skillMatch = true;
        } else if (cat.includes('fire') && (skillsText.includes('fire') || skillsText.includes('hazmat'))) {
          skillMatch = true;
        } else if (cat.includes('medical') && (skillsText.includes('medical') || skillsText.includes('paramedic') || skillsText.includes('triage'))) {
          skillMatch = true;
        }

        const score = skillMatch ? effectiveDist * 0.6 : effectiveDist;

        if (score < minDistanceKm) {
          minDistanceKm = score;
          bestTeam = { ...t, distanceKm: distKm };
        }
      }

      if (bestTeam) {
        assignedInRecommendations.add(bestTeam.id);
        const missingInfo: string[] = [];
        if (bestTeam.distanceKm === undefined) {
          missingInfo.push('Exact distance unavailable; missing GPS coordinate telemetry for team.');
        }

        teamRecommendations.push({
          recommendationId: `rec_team_${inc.id}_${bestTeam.id}`,
          targetIncidentId: inc.id,
          targetIncidentTitle: inc.title,
          suggestedTeamId: bestTeam.id,
          suggestedTeamName: bestTeam.name,
          teamType: bestTeam.type,
          teamStatus: bestTeam.status,
          skills: typeof bestTeam.skills === 'string' ? bestTeam.skills.split(',').map((s: string) => s.trim()) : [],
          reason: `Recommended based on team availability ('${bestTeam.status}'), domain skills, and operational proximity (${bestTeam.distanceKm ?? 'N/A'} km).`,
          estimatedDistanceKm: bestTeam.distanceKm,
          confidenceScore: bestTeam.distanceKm !== undefined ? 92 : 82,
          missingInformationOrConstraints: missingInfo,
          approvalStatus: 'pending'
        });
      }
    }

    // 2. Inventory Supply Recommendations
    for (const inc of incidents.slice(0, 4)) {
      const cat = (inc.category || '').toLowerCase();
      // Match relevant resources
      for (const res of resources) {
        const resCat = (res.category || '').toLowerCase();
        const resName = (res.name || '').toLowerCase();

        let isMatch = false;
        let qtyToRecommend = 0;

        if (cat.includes('flood') && (resName.includes('boat') || resName.includes('jacket') || resName.includes('pump') || resCat.includes('water'))) {
          isMatch = true;
          qtyToRecommend = Math.min(res.quantity_available, 5);
        } else if (cat.includes('medical') && (resName.includes('kit') || resName.includes('stretcher') || resCat.includes('medical'))) {
          isMatch = true;
          qtyToRecommend = Math.min(res.quantity_available, 10);
        } else if (resCat.includes('relief') || resName.includes('ration') || resName.includes('blanket')) {
          if ((inc.affected_population || 0) > 50) {
            isMatch = true;
            qtyToRecommend = Math.min(res.quantity_available, 20);
          }
        }

        if (isMatch && res.quantity_available > 0 && qtyToRecommend > 0) {
          supplyRecommendations.push({
            recommendationId: `rec_res_${inc.id}_${res.id}`,
            targetIncidentId: inc.id,
            targetIncidentTitle: inc.title,
            resourceId: res.id,
            resourceName: res.name,
            category: res.category,
            availableQuantity: res.quantity_available,
            recommendedQuantity: qtyToRecommend,
            unit: res.unit,
            reason: `Disaster response supply recommendation for ${inc.category} incident with ${inc.affected_population || 0} affected population.`,
            confidenceScore: 88,
            missingInformationOrConstraints: res.quantity_available - qtyToRecommend < res.min_threshold
              ? [`Approval will drop warehouse stock near or below minimum threshold (${res.min_threshold} ${res.unit}).`]
              : [],
            approvalStatus: 'pending'
          });
        }
      }
    }

    // 3. Shortage Detection
    for (const res of resources) {
      if (res.quantity_available < res.min_threshold) {
        const shortfall = res.min_threshold - res.quantity_available;
        shortages.push({
          resourceId: res.id,
          resourceName: res.name,
          category: res.category,
          currentStock: res.quantity_available,
          estimatedDemand: res.min_threshold + 10,
          shortfall,
          severity: res.quantity_available === 0 ? 'critical' : 'high',
          mitigationAdvice: `Replenish ${res.name} stock immediately via regional emergency depot requisition.`
        });
      }
    }

    // 4. Shelter Capacity Evaluation
    for (const s of shelters) {
      const availableCap = Math.max(0, s.capacity - s.current_occupancy);
      const occRate = s.capacity > 0 ? (s.current_occupancy / s.capacity) * 100 : 100;

      if (occRate >= 80) {
        // High occupancy shelter -> Find alternative
        const alternative = shelters.find(alt => alt.id !== s.id && (alt.current_occupancy / alt.capacity) < 0.6);
        shelterRecommendations.push({
          recommendationId: `rec_shl_${s.id}`,
          shelterId: s.id,
          shelterName: s.name,
          capacity: s.capacity,
          currentOccupancy: s.current_occupancy,
          availableCapacity: availableCap,
          occupancyRate: parseFloat(occRate.toFixed(1)),
          reason: `Shelter '${s.name}' operating at ${occRate.toFixed(1)}% capacity. ${alternative ? `Divert arriving evacuees to alternative shelter '${alternative.name}'.` : 'No immediate local shelter alternative with >40% free capacity.'}`,
          isAlternative: false,
          confidenceScore: 90
        });
      } else if (availableCap > 50) {
        // Viable destination shelter
        shelterRecommendations.push({
          recommendationId: `rec_shl_avail_${s.id}`,
          shelterId: s.id,
          shelterName: s.name,
          capacity: s.capacity,
          currentOccupancy: s.current_occupancy,
          availableCapacity: availableCap,
          occupancyRate: parseFloat(occRate.toFixed(1)),
          reason: `Primary recommended shelter site with ${availableCap} available beds and active support facilities.`,
          isAlternative: false,
          confidenceScore: 94
        });
      }
    }

    return {
      teamRecommendations,
      supplyRecommendations,
      shelterRecommendations,
      shortages,
      resourceConflicts,
      confidenceScore: 92,
      dataSources,
      timestamp: nowIso
    };
  }
}

export const resourceAllocationAgent = new ResourceAllocationAgent();
