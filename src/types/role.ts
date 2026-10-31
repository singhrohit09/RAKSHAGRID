export type PersonaId = 
  | 'admin'
  | 'commander'
  | 'responder'
  | 'logistics'
  | 'analyst';

export type Permission = 
  | 'view_incidents'
  | 'create_incidents'
  | 'edit_incidents'
  | 'close_incidents'
  | 'delete_incidents'
  | 'manage_teams'
  | 'manage_shelters'
  | 'manage_resources'
  | 'assign_tasks'
  | 'manage_tasks'
  | 'create_alerts'
  | 'approve_alerts'
  | 'view_analytics'
  | 'view_audit'
  | 'change_settings'
  | 'reset_demo_data'
  | 'run_ai_analysis'
  | 'approve_ai_recommendations'
  | 'run_disaster_simulation';

export interface Persona {
  id: PersonaId;
  name: string;
  roleLabel: string;
  department: string;
  callsign: string;
  avatarInitials: string;
  description: string;
  permissions: Permission[];
}

