/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident } from '../../types';
import { AIAlertRecommendation } from '../../types/ai';

export class AlertRecommendationService {
  /**
   * Generates CAP-compliant draft alert recommendations based on active critical disaster vectors
   */
  public static generateAlertDrafts(incidents: Incident[]): AIAlertRecommendation[] {
    const drafts: AIAlertRecommendation[] = [];

    const criticalFlood = incidents.find(
      (i) => i.disasterType === 'flood' && i.severity === 'critical' && i.status !== 'resolved'
    );

    if (criticalFlood) {
      drafts.push({
        id: `REC-ALERT-${criticalFlood.id}`,
        headline: `EMERGENCY EVACUATION WARNING: Catastrophic Inundation in ${criticalFlood.location}`,
        disasterType: 'flood',
        severity: 'critical',
        certainty: 'observed',
        urgency: 'immediate',
        affectedAreas: [criticalFlood.location, 'Downstream Riverbank Sectors', 'Ward 12-18'],
        publicInstructions:
          'Move immediately to designated multi-purpose cyclone/flood shelters or higher ground. Do not attempt to drive or walk through moving floodwaters. Disconnect electrical mains before vacating structures.',
        technicalRationale: `River gauge telemetry indicates water level 1.4m above Danger Mark with projected breach of flood embankments within 120 minutes. Incident #${criticalFlood.id} confirms active inundation.`,
        confidenceScore: 0.96,
        status: 'DRAFT',
        generatedAt: new Date().toISOString(),
        targetChannels: ['SMS Cell Broadcast', 'Emergency Siren Array', 'Public Radio (All India Radio)', 'RakshaGrid Public Portal'],
      });
    }

    const cycloneIncident = incidents.find(
      (i) => (i.disasterType === 'cyclone' || i.disasterType === 'landslide') && i.status !== 'resolved'
    );

    if (cycloneIncident) {
      drafts.push({
        id: `REC-ALERT-${cycloneIncident.id}`,
        headline: `SEVERE HAZARD ADVISORY: High-Risk Threat in ${cycloneIncident.location}`,
        disasterType: cycloneIncident.disasterType,
        severity: 'warning',
        certainty: 'likely',
        urgency: 'expected',
        affectedAreas: [cycloneIncident.location, `${cycloneIncident.region} District`],
        publicInstructions:
          'Stay indoors away from windows and vulnerable trees. Secure loose rooftop objects and maintain emergency battery radios. Await further instructions from EOC.',
        technicalRationale: `Atmospheric telemetry detects sustained gale-force winds and excessive soil saturation creating elevated structural and slope failure risk.`,
        confidenceScore: 0.91,
        status: 'DRAFT',
        generatedAt: new Date().toISOString(),
        targetChannels: ['Public Portal', 'Telecom SMS Push', 'State Disaster App'],
      });
    }

    return drafts;
  }
}
