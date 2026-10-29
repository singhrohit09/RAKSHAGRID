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
    'reset_demo_data'
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
    'view_audit'
  ],
  responder: [
    'view_incidents',
    'edit_incidents',
    'manage_tasks',
    'view_analytics'
  ],
  logistics: [
    'view_incidents',
    'manage_shelters',
    'manage_resources',
    'assign_tasks',
    'manage_tasks',
    'view_analytics'
  ],
  analyst: [
    'view_incidents',
    'view_analytics',
    'view_audit'
  ]
};

export function hasServerPermission(role: PersonaId, permission: Permission): boolean {
  const allowed = SERVER_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

