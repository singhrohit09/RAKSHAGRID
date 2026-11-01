import test from 'node:test';
import assert from 'node:assert/strict';
import { getRolePermissions } from '../context/AuthContext';
import { Role } from '../types';

test('RBAC - Administrator has universal operational & system privileges', () => {
  const perms = getRolePermissions('administrator');
  assert.equal(perms.canCreateIncident, true);
  assert.equal(perms.canEditIncident, true);
  assert.equal(perms.canDeleteIncident, true);
  assert.equal(perms.canBroadcastAlert, true);
  assert.equal(perms.canDispatchTeam, true);
  assert.equal(perms.canAllocateResources, true);
  assert.equal(perms.canUpdateShelter, true);
  assert.equal(perms.canAssignTasks, true);
  assert.equal(perms.canManageSettings, true);
  assert.equal(perms.canViewAudit, true);
});

test('RBAC - Incident Commander has full tactical command but no destructive deletion or settings management', () => {
  const perms = getRolePermissions('incident_commander');
  assert.equal(perms.canCreateIncident, true);
  assert.equal(perms.canEditIncident, true);
  assert.equal(perms.canDeleteIncident, false, 'Commanders cannot delete incident records');
  assert.equal(perms.canBroadcastAlert, true);
  assert.equal(perms.canDispatchTeam, true);
  assert.equal(perms.canAllocateResources, true);
  assert.equal(perms.canUpdateShelter, true);
  assert.equal(perms.canAssignTasks, true);
  assert.equal(perms.canManageSettings, false, 'Commanders cannot change global system settings');
  assert.equal(perms.canViewAudit, true);
});

test('RBAC - Field Responder can report incidents and update tasks but cannot broadcast alerts or delete', () => {
  const perms = getRolePermissions('field_responder');
  assert.equal(perms.canCreateIncident, true);
  assert.equal(perms.canEditIncident, true);
  assert.equal(perms.canDeleteIncident, false);
  assert.equal(perms.canBroadcastAlert, false, 'Field responders cannot issue mass alerts');
  assert.equal(perms.canDispatchTeam, false);
  assert.equal(perms.canAllocateResources, false);
  assert.equal(perms.canUpdateShelter, false);
  assert.equal(perms.canAssignTasks, true);
  assert.equal(perms.canManageSettings, false);
  assert.equal(perms.canViewAudit, false, 'Field responders cannot access system audit logs');
});

test('RBAC - Logistics Officer controls resources and shelters but cannot broadcast alerts or manage settings', () => {
  const perms = getRolePermissions('logistics_officer');
  assert.equal(perms.canCreateIncident, false);
  assert.equal(perms.canEditIncident, false);
  assert.equal(perms.canDeleteIncident, false);
  assert.equal(perms.canBroadcastAlert, false);
  assert.equal(perms.canDispatchTeam, false);
  assert.equal(perms.canAllocateResources, true, 'Logistics can allocate resources');
  assert.equal(perms.canUpdateShelter, true, 'Logistics can update shelter status');
  assert.equal(perms.canAssignTasks, true);
  assert.equal(perms.canManageSettings, false);
  assert.equal(perms.canViewAudit, false);
});

test('RBAC - Read-Only Analyst has zero mutation privileges', () => {
  const perms = getRolePermissions('read_only_analyst');
  assert.equal(perms.canCreateIncident, false);
  assert.equal(perms.canEditIncident, false);
  assert.equal(perms.canDeleteIncident, false);
  assert.equal(perms.canBroadcastAlert, false);
  assert.equal(perms.canDispatchTeam, false);
  assert.equal(perms.canAllocateResources, false);
  assert.equal(perms.canUpdateShelter, false);
  assert.equal(perms.canAssignTasks, false);
  assert.equal(perms.canManageSettings, false);
  assert.equal(perms.canViewAudit, false);
});
