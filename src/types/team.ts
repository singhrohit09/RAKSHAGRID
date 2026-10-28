export type TeamType = 
  | 'search_rescue' 
  | 'medical' 
  | 'fire_hazmat' 
  | 'logistics' 
  | 'evacuation' 
  | 'technical';

export type TeamStatus = 'Available' | 'Deployed' | 'Busy' | 'Off Duty';

export interface ResponseTeam {
  id: string;
  name: string;
  type: TeamType;
  staffCount: number;
  skills: string[];
  homeBase: string;
  status: TeamStatus;
  currentAssignment?: string;
  incidentId?: string;
  contactCallsign: string;
  contactPhone: string; // Fictional demo
  latitude: number;
  longitude: number;
  updatedAt: string;
}
