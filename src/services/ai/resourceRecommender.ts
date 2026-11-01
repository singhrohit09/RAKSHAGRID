/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Team } from '../../types';
import { ResourceRecommendation } from '../../types/ai';
import { calculateDistanceKm } from '../geospatial/spatialAnalysis.service';

export class ResourceRecommendationEngine {
  /**
   * Generates prioritized response team dispatch recommendations with deterministic Turf.js calculations
   */
  public static generateDispatchRecommendations(
    incidents: Incident[],
    teams: Team[]
  ): ResourceRecommendation[] {
    const targetIncidents = incidents.filter(
      (inc) => inc.status !== 'resolved' && (!inc.assignedTeamId || inc.severity === 'critical')
    );

    const availableTeams = teams.filter((t) => t.status === 'available');
    const recommendations: ResourceRecommendation[] = [];

    targetIncidents.forEach((inc) => {
      // Specialty mapping
      let preferredSpecialty = 'General Search & Rescue';
      if (inc.disasterType === 'flood') preferredSpecialty = 'Flood Rescue';
      else if (inc.disasterType === 'cyclone') preferredSpecialty = 'Cyclone & Wind Response';
      else if (inc.disasterType === 'medical') preferredSpecialty = 'Medical Rapid Response';
      else if (inc.disasterType === 'landslide') preferredSpecialty = 'Collapsed Structure Search';

      // Find teams with matching specialty first, then sort by distance
      const sortedTeams = [...availableTeams].sort((a, b) => {
        const distA = calculateDistanceKm(inc.coordinates, a.location);
        const distB = calculateDistanceKm(inc.coordinates, b.location);

        const aMatchesSpecialty = a.specialization.toLowerCase().includes(inc.disasterType) || a.specialization.toLowerCase().includes(preferredSpecialty.toLowerCase());
        const bMatchesSpecialty = b.specialization.toLowerCase().includes(inc.disasterType) || b.specialization.toLowerCase().includes(preferredSpecialty.toLowerCase());

        if (aMatchesSpecialty && !bMatchesSpecialty) return -1;
        if (!aMatchesSpecialty && bMatchesSpecialty) return 1;

        return distA - distB;
      });

      if (sortedTeams.length > 0) {
        const topTeam = sortedTeams[0];
        const distanceKm = Number(
          calculateDistanceKm(inc.coordinates, topTeam.location).toFixed(1)
        );
        // Estimated transit speed in emergency conditions ~ 35 km/h + 10 min muster
        const estimatedEtaMinutes = Math.round((distanceKm / 35) * 60 + 10);

        const matchesSpecialty =
          topTeam.specialization.toLowerCase().includes(inc.disasterType) ||
          topTeam.specialization.toLowerCase().includes(preferredSpecialty.toLowerCase());

        const rationale = `${topTeam.name} (${topTeam.memberCount} personnel) is stationed in ${topTeam.assignedZone} (${distanceKm} km from incident). ${
          matchesSpecialty
            ? `Direct domain match: specializes in ${topTeam.specialization}.`
            : `Available immediate unit for tactical containment.`
        } Estimated transit ETA is ${estimatedEtaMinutes} minutes under active storm traffic conditions.`;

        recommendations.push({
          id: `REC-DISP-${inc.id}-${topTeam.id}`,
          incidentId: inc.id,
          incidentTitle: inc.title,
          incidentSeverity: inc.severity,
          requiredSpecialty: preferredSpecialty,
          recommendedTeamId: topTeam.id,
          recommendedTeamName: topTeam.name,
          teamLeader: topTeam.leader,
          distanceKm,
          estimatedEtaMinutes,
          rationale,
          confidence: matchesSpecialty ? 0.94 : 0.81,
          status: 'PENDING_REVIEW',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return recommendations;
  }
}
