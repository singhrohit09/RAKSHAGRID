export type DisasterCategory = 
  | 'flood' 
  | 'flash_flood'
  | 'heavy_rainfall'
  | 'severe_storm'
  | 'cyclone' 
  | 'earthquake' 
  | 'landslide' 
  | 'wildfire' 
  | 'industrial' 
  | 'other';

export type IncidentSeverity = 'Low' | 'Moderate' | 'High' | 'Critical';

export type IncidentStatus = 
  | 'Reported' 
  | 'Verified' 
  | 'Active' 
  | 'Contained' 
  | 'Resolved' 
  | 'Closed';

export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type IncidentSource = 'Demo' | 'Manual Report' | 'Integration';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  actor: string;
  note: string;
  type: 'status_change' | 'team_assigned' | 'priority_change' | 'general';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: DisasterCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  priority: IncidentPriority;
  locationName: string;
  latitude: number;
  longitude: number;
  reportedAt: string;
  updatedAt: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  affectedPopulation: number;
  casualties: number;
  source: IncidentSource;
  estimatedRadiusMeters?: number;
  timeline: TimelineEntry[];
}
