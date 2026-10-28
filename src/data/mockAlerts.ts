import { EmergencyAlert } from '../types/alert';

export const INITIAL_ALERTS: EmergencyAlert[] = [
  {
    id: 'ALT-2026-001',
    title: 'FLASH FLOOD EVACUATION ORDER: Mayur Vihar Sector 4 Low-Lying Riverfront',
    body: 'Urgent Evacuation Order issued by Incident Command. Embankment breach upstream is rapidly inundating Sector 4 ground levels. All residents in floodplain parcels must immediately relocate to designated higher-ground shelters.',
    type: 'Evacuation Order',
    severity: 'Extreme',
    targetRegion: 'Sector 4, Mayur Vihar, Riverfront Reach km 12-16',
    relatedIncidentId: 'INC-2026-0101',
    relatedIncidentTitle: 'Yamuna River Embankment Breach — Sector 4',
    safetyActions: [
      'Turn off residential main electricity circuit breaker and LPG gas valves before departing.',
      'Take emergency grab-bag: medicines, ID cards, phone charger, and potable water.',
      'Do NOT attempt to walk or drive through standing or moving flood water.',
      'Report immediately to Sector 4 Community Sports Complex (Shelter SHL-NORTH-01) or call Demo Helpline 1077.'
    ],
    channels: {
      sms: false,
      cellBroadcast: false,
      siren: false,
      radio: false,
      email: false,
      publicBulletin: true
    },
    status: 'Approved for Demo',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    approvedBy: 'Director Rajesh Verma (Admin)',
    approvedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'ALT-2026-002',
    title: 'CHEMICAL HAZMAT ADVISORY: Toxic Vapor Plume — Okhla Phase II & Vicinity',
    body: 'Industrial petrochemical storage fire at Okhla Phase II has generated a chemical vapor cloud containing solvent particulates. Residents within 2.5km downwind are advised to shelter in place with windows sealed.',
    type: 'Warning',
    severity: 'Severe',
    targetRegion: 'Okhla Phase II, Tehkhand, Harkesh Nagar Corridor',
    relatedIncidentId: 'INC-2026-0103',
    relatedIncidentTitle: 'Solvent Storage Bay Fire & Chemical Hazmat Plume',
    safetyActions: [
      'Remain indoors; shut all windows, doors, and AC external ventilation dampers.',
      'Cover mouth and nose with a damp cloth or N95 mask if brief outdoor movement is unavoidable.',
      'Keep pets indoors and cover exposed drinking water containers.',
      'Vulnerable individuals with respiratory or cardiac conditions should seek immediate medical attention if experiencing eye stinging or shortness of breath.'
    ],
    channels: {
      sms: false,
      cellBroadcast: false,
      siren: false,
      radio: false,
      email: false,
      publicBulletin: true
    },
    status: 'Ready for Review',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: 'ALT-2026-003',
    title: 'TRAFFIC ADVISORY: Moolchand Underpass Closed Due to Waterlogging',
    body: 'Moolchand underpass is inundated with over 4 feet of stormwater. All vehicular traffic diverted to Outer Ring Road overhead flyovers.',
    type: 'Advisory',
    severity: 'Moderate',
    targetRegion: 'South District Ring Road Arterial Corridor',
    relatedIncidentId: 'INC-2026-0102',
    relatedIncidentTitle: 'Urban Flash Flood & Road Submergence',
    safetyActions: [
      'Use Ring Road elevated flyover bypass.',
      'Allow extra 40 minutes for emergency medical transport routing.',
      'Heed field traffic police marshals.'
    ],
    channels: {
      sms: false,
      cellBroadcast: false,
      siren: false,
      radio: false,
      email: false,
      publicBulletin: false
    },
    status: 'Draft',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];
