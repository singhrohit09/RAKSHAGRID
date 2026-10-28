import { Incident } from '../types/incident';

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0101',
    title: 'Yamuna River Embankment Breach — Sector 4',
    description: '35-meter embankment fracture due to prolonged torrential rainfall upstream. Inundating residential colony Sector 4 and cutting off arterial access route.',
    category: 'flood',
    severity: 'Critical',
    status: 'Active',
    priority: 'P1',
    locationName: 'Mayur Vihar Riverfront, Sector 4',
    latitude: 28.6250,
    longitude: 77.2350,
    reportedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    assignedTeamId: 'TEAM-NDRF-08',
    assignedTeamName: 'NDRF Battalion 8 — Alpha Strike',
    affectedPopulation: 14500,
    casualties: 0,
    source: 'Demo',
    estimatedRadiusMeters: 1800,
    timeline: [
      {
        id: 'TL-101-1',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        actor: 'Patrol Drone Observer',
        note: 'Embankment crack observed widening near river km 14.8.',
        type: 'general'
      },
      {
        id: 'TL-101-2',
        timestamp: new Date(Date.now() - 3600000 * 5.5).toISOString(),
        actor: 'Commander Ananya Sen',
        note: 'Upgraded severity from High to Critical. NDRF Battalion 8 deployed with 14 inflatable boats.',
        type: 'priority_change'
      },
      {
        id: 'TL-101-3',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        actor: 'Vikramaditya Rao',
        note: 'Evacuated 340 trapped families from Ground Floor tenements. Staging sandbag wall fortification.',
        type: 'status_change'
      }
    ]
  },
  {
    id: 'INC-2026-0102',
    title: 'Urban Flash Flood & Road Submergence',
    description: 'Underpass drainage failure on Ring Road Axis. 4.2 feet of standing water trapping urban buses and light passenger vehicles.',
    category: 'flash_flood',
    severity: 'High',
    status: 'Active',
    priority: 'P2',
    locationName: 'Moolchand Underpass Intersect',
    latitude: 28.5720,
    longitude: 77.2360,
    reportedAt: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    assignedTeamId: 'TEAM-SDRF-02',
    assignedTeamName: 'State Disaster Response Force — Bravo Water Ops',
    affectedPopulation: 3200,
    casualties: 0,
    source: 'Manual Report',
    estimatedRadiusMeters: 900,
    timeline: [
      {
        id: 'TL-102-1',
        timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
        actor: 'Traffic Control Room',
        note: 'Visual confirmation of 6 trapped public buses and passenger cars.',
        type: 'general'
      },
      {
        id: 'TL-102-2',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        actor: 'SDRF Bravo Lead',
        note: 'All vehicle occupants safely ferried to dry grade. High-capacity dewatering pumps deployed.',
        type: 'status_change'
      }
    ]
  },
  {
    id: 'INC-2026-0103',
    title: 'Solvent Storage Bay Fire & Chemical Hazmat Plume',
    description: 'Flash fire in industrial petrochemical compounding plant following lightning discharge. Toxic toluene vapor drift toward southeast residential corridor.',
    category: 'industrial',
    severity: 'Critical',
    status: 'Active',
    priority: 'P1',
    locationName: 'Okhla Phase II Chemical Complex',
    latitude: 28.5320,
    longitude: 77.2790,
    reportedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    assignedTeamId: 'TEAM-FIRE-12',
    assignedTeamName: 'Industrial Hazmat & Fire Response 12',
    affectedPopulation: 8900,
    casualties: 4,
    source: 'Integration',
    estimatedRadiusMeters: 2400,
    timeline: [
      {
        id: 'TL-103-1',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        actor: 'SCADA Telemetry Alarm',
        note: 'Thermal runaway detection in Tank Bay 4.',
        type: 'general'
      },
      {
        id: 'TL-103-2',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        actor: 'Fire Chief Mehra',
        note: 'Specialized chemical foam deluge active. Perimeter cordoned at 1.5km radius.',
        type: 'team_assigned'
      }
    ]
  },
  {
    id: 'INC-2026-0104',
    title: 'Pedestrian Overpass Truss Fracture',
    description: 'Structural micro-cracking and foundation displacement following soil saturation beneath railway overbridge abutment.',
    category: 'earthquake',
    severity: 'Moderate',
    status: 'Contained',
    priority: 'P3',
    locationName: 'Old Delhi Railway Junction South Overpass',
    latitude: 28.6580,
    longitude: 77.2280,
    reportedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    assignedTeamId: 'TEAM-MED-03',
    assignedTeamName: 'Emergency Medical Corps — Mobile 3',
    affectedPopulation: 1200,
    casualties: 1,
    source: 'Manual Report',
    estimatedRadiusMeters: 500,
    timeline: [
      {
        id: 'TL-104-1',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
        actor: 'Track Safety Inspector',
        note: 'Shift detected in support pier 3. Overpass immediately closed to pedestrian traffic.',
        type: 'general'
      },
      {
        id: 'TL-104-2',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        actor: 'Civil Engineering Cell',
        note: 'Temporary hydraulic jacks positioned. Risk of sudden structural collapse stabilized.',
        type: 'status_change'
      }
    ]
  },
  {
    id: 'INC-2026-0105',
    title: 'Ridge Escarpment Debris Slide & Roadway Blockage',
    description: 'Unconsolidated earth slope collapse blocking Ridge Road bypass. Mud and boulder slurry blocking key ambulance corridor.',
    category: 'landslide',
    severity: 'Moderate',
    status: 'Verified',
    priority: 'P3',
    locationName: 'North Ridge Forest Perimeter Road',
    latitude: 28.6820,
    longitude: 77.2140,
    reportedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    affectedPopulation: 650,
    casualties: 0,
    source: 'Demo',
    estimatedRadiusMeters: 400,
    timeline: [
      {
        id: 'TL-105-1',
        timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        actor: 'Forest Ranger Wireless',
        note: 'Slope failure across 40 meters of roadway. Heavy earthmovers requested.',
        type: 'general'
      }
    ]
  },
  {
    id: 'INC-2026-0106',
    title: 'Severe Thunderstorm & High-Voltage Grid Collapse',
    description: 'Gale winds (85 km/h) uprooting banyan trees onto primary 66kV transmission feeder line, causing cascading outage to 3 water treatment pump stations.',
    category: 'severe_storm',
    severity: 'High',
    status: 'Reported',
    priority: 'P2',
    locationName: 'Wazirabad Water Works Substation',
    latitude: 28.7120,
    longitude: 77.2310,
    reportedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    affectedPopulation: 45000,
    casualties: 0,
    source: 'Integration',
    estimatedRadiusMeters: 1200,
    timeline: [
      {
        id: 'TL-106-1',
        timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
        actor: 'Power Grid Telemetry',
        note: 'Feeder trip detected. Emergency genset backup initialized for raw water pumps.',
        type: 'general'
      }
    ]
  }
];

