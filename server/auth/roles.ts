import { PersonaId, Permission } from '../../src/types/role.js';

export const SERVER_PERMISSIONS: Record<PersonaId, Permission[]> = {
  admin: [
    'view_incidents',
    'create_incidents',
    'edit_incidents',
    'close_incidents',
    'delete_incidents',
    'manage_teams',
    'manage_shelters',
    'manage_resources',
    'assign_tasks',
    'manage_tasks',
    'create_alerts',
    'approve_alerts',
    'view_analytics',
    'view_audit',
    'change_settings',
    'reset_demo_data',
    'run_ai_analysis',
    'approve_ai_recommendations',
    'run_disaster_simulation'
  ],
  commander: [
    'view_incidents',
    'create_incidents',
    'edit_incidents',
    'close_incidents',
    'delete_incidents',
    'manage_teams',
    'assign_tasks',
    'manage_tasks',
    'create_alerts',
    'approve_alerts',
    'view_analytics',
    'view_audit',
    'run_ai_analysis',
    'approve_ai_recommendations',
    'run_disaster_simulation'
  ],
  responder: [
    'view_incidents',
    'edit_incidents',
    'manage_tasks',
    'view_analytics',
    'run_ai_analysis'
  ],
  logistics: [
    'view_incidents',
    'manage_shelters',
    'manage_resources',
    'assign_tasks',
    'manage_tasks',
    'view_analytics',
    'run_ai_analysis'
  ],
  analyst: [
    'view_incidents',
    'view_analytics',
    'view_audit',
    'run_ai_analysis',
    'run_disaster_simulation'
  ]
};

export function hasServerPermission(role: PersonaId, permission: Permission): boolean {
  const allowed = SERVER_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

