import { Persona, PersonaId, Permission } from '../types/role';

export const PERSONAS: Record<PersonaId, Persona> = {
  admin: {
    id: 'admin',
    name: 'Director Rajesh Verma',
    roleLabel: 'Emergency Operations Administrator',
    department: 'State Disaster Management Authority (SDMA)',
    callsign: 'COMMAND-01',
    avatarInitials: 'RV',
    description: 'Unrestricted administrative authority across all operational domains, settings, and lifecycle actions.',
    permissions: [
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
    ]
  },
  commander: {
    id: 'commander',
    name: 'Cmdr. Ananya Sen',
    roleLabel: 'Incident Commander',
    department: 'Unified Incident Command Post',
    callsign: 'EOC-ALPHA',
    avatarInitials: 'AS',
    description: 'Tactical command authority. Orchestrates incident response, task dispatch, response teams, and public alerts.',
    permissions: [
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
    ]
  },
  responder: {
    id: 'responder',
    name: 'Vikramaditya Rao',
    roleLabel: 'Field Responder Lead',
    department: 'National Disaster Response Force (NDRF Bat. 8)',
    callsign: 'RESCUE-LEAD-8',
    avatarInitials: 'VR',
    description: 'Ground unit leader. Updates incident status from the field, executes tactical tasks, reports hazards.',
    permissions: [
      'view_incidents',
      'edit_incidents',
      'manage_tasks',
      'view_analytics'
    ]
  },
  logistics: {
    id: 'logistics',
    name: 'Pooja Kulkarni',
    roleLabel: 'Logistics Officer',
    department: 'Relief Supply & Shelters Section',
    callsign: 'SUPPLY-BASE',
    avatarInitials: 'PK',
    description: 'Manages shelter capacity, allocates relief inventory, coordinates supply transport and distribution.',
    permissions: [
      'view_incidents',
      'manage_shelters',
      'manage_resources',
      'assign_tasks',
      'manage_tasks',
      'view_analytics'
    ]
  },
  analyst: {
    id: 'analyst',
    name: 'Dr. Siddharth Mehta',
    roleLabel: 'Read-Only Analyst',
    department: 'Meteorological & Impact Assessment Group',
    callsign: 'IMPACT-OBSERVER',
    avatarInitials: 'SM',
    description: 'Situational awareness observer. Reviews data, trends, impact reports, and audit trails without operational write access.',
    permissions: [
      'view_incidents',
      'view_analytics',
      'view_audit'
    ]
  }
};

/**
 * Checks if the given persona has the required permission.
 */
export function hasPermission(personaId: PersonaId, permission: Permission): boolean {
  const persona = PERSONAS[personaId];
  if (!persona) return false;
  return persona.permissions.includes(permission);
}

/**
 * Returns a human-readable explanation if an action is restricted.
 */
export function getPermissionRestrictionMessage(personaId: PersonaId, permission: Permission): string {
  const persona = PERSONAS[personaId];
  if (!persona) return 'Access restricted: unknown persona.';
  return `Action restricted: '${persona.roleLabel}' does not possess '${permission.replace(/_/g, ' ')}' authorization. Switch to Administrator or Commander in Demo Mode.`;
}
