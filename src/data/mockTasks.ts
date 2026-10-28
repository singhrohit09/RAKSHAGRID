import { IncidentTask } from '../types/task';

export const INITIAL_TASKS: IncidentTask[] = [
  {
    id: 'TSK-1001',
    title: 'Deploy Sandbag Barricade on Breach Crest km 14.8',
    description: 'Stage 800 heavy woven sandbags along weakened river revetment to curb spillover into Mayur Vihar residential blocks.',
    relatedIncidentId: 'INC-2026-0101',
    relatedIncidentTitle: 'Yamuna River Embankment Breach — Sector 4',
    assignedTeamId: 'TEAM-NDRF-08',
    assignedTeamName: 'NDRF Battalion 8 — Alpha Strike',
    priority: 'Urgent',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'TSK-1002',
    title: 'Dispatch High-Capacity Dewatering Pumps to Moolchand',
    description: 'Position three 200 HP submersible pumps at low-point underpass basin to clear 4 feet standing floodwaters.',
    relatedIncidentId: 'INC-2026-0102',
    relatedIncidentTitle: 'Urban Flash Flood & Road Submergence',
    assignedTeamId: 'TEAM-SDRF-02',
    assignedTeamName: 'State Disaster Response Force — Bravo Water Ops',
    priority: 'High',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 3600000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'TSK-1003',
    title: 'Establish 2.4km Toxic Vapor Exclusion Perimeter',
    description: 'Deploy barricades and warn nearby colonies of volatile toluene fumes downwind from Okhla plant fire.',
    relatedIncidentId: 'INC-2026-0103',
    relatedIncidentTitle: 'Solvent Storage Bay Fire & Chemical Hazmat Plume',
    assignedTeamId: 'TEAM-FIRE-12',
    assignedTeamName: 'Industrial Hazmat & Fire Response 12',
    priority: 'Urgent',
    status: 'Ready',
    dueDate: new Date(Date.now() + 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'TSK-1004',
    title: 'Deliver 1,800 Water Jerrycans to Community Sports Complex',
    description: 'Coordinate transport convoy from Central Warehouse to Shelter SHL-NORTH-01 before evening meal distribution.',
    relatedIncidentId: 'INC-2026-0101',
    relatedIncidentTitle: 'Yamuna River Embankment Breach — Sector 4',
    assignedTeamId: 'TEAM-LOG-05',
    assignedTeamName: 'Relief Logistics Convoy 5',
    priority: 'High',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: 'TSK-1005',
    title: 'Deploy Heavy Earthmover to Clear Ridge Forest Road',
    description: 'Contracted JCB excavator en route to clear fallen debris and mud slurry blocking ambulance detour route.',
    relatedIncidentId: 'INC-2026-0105',
    relatedIncidentTitle: 'Ridge Escarpment Debris Slide & Roadway Blockage',
    priority: 'Medium',
    status: 'Blocked',
    dueDate: new Date(Date.now() + 3600000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 0.5).toISOString()
  },
  {
    id: 'TSK-1006',
    title: 'Erect Emergency Hydraulic Shoring Beneath Overpass Pier 3',
    description: 'Secure structural load of Old Delhi pedestrian bridge before rail corridor reopens.',
    relatedIncidentId: 'INC-2026-0104',
    relatedIncidentTitle: 'Pedestrian Overpass Truss Fracture',
    priority: 'Medium',
    status: 'Completed',
    dueDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'TSK-1007',
    title: 'Pre-position 6 Evacuation Buses at Sector 9 Transit Hub',
    description: 'Prepare standby fleet in case Mayur Vihar water level rises above flood danger mark (205.33m).',
    relatedIncidentId: 'INC-2026-0101',
    relatedIncidentTitle: 'Yamuna River Embankment Breach — Sector 4',
    assignedTeamId: 'TEAM-EVAC-01',
    assignedTeamName: 'Civil Defence Evacuation Taskforce 1',
    priority: 'High',
    status: 'Backlog',
    dueDate: new Date(Date.now() + 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];
