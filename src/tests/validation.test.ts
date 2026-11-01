import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_INCIDENTS, INITIAL_TEAMS, INITIAL_SHELTERS, INITIAL_RESOURCES, INITIAL_TASKS, INITIAL_ALERTS, INITIAL_AUDIT_LOGS, DEMO_USERS } from '../services/mockData';

test('Data Integrity - All initial incidents have valid coordinates within physical Earth bounds', () => {
  for (const inc of INITIAL_INCIDENTS) {
    assert.ok(inc.coordinates.lat >= -90 && inc.coordinates.lat <= 90, `Incident ${inc.id} lat out of bounds: ${inc.coordinates.lat}`);
    assert.ok(inc.coordinates.lng >= -180 && inc.coordinates.lng <= 180, `Incident ${inc.id} lng out of bounds: ${inc.coordinates.lng}`);
    assert.ok(inc.affectedPopulation >= 0, `Incident ${inc.id} affected population must be >= 0`);
    assert.ok(Number.isInteger(inc.affectedPopulation), `Incident ${inc.id} affected population must be integer`);
    assert.ok(inc.priorityScore >= 1 && inc.priorityScore <= 100, `Incident ${inc.id} priorityScore must be between 1 and 100`);
    assert.ok(['critical', 'high', 'medium', 'low'].includes(inc.severity), `Incident ${inc.id} has invalid severity`);
    assert.ok(['active', 'investigating', 'contained', 'resolved'].includes(inc.status), `Incident ${inc.id} has invalid status`);
  }
});

test('Data Integrity - All initial shelters have capacity >= currentOccupancy >= 0', () => {
  for (const shelter of INITIAL_SHELTERS) {
    assert.ok(shelter.coordinates.lat >= -90 && shelter.coordinates.lat <= 90);
    assert.ok(shelter.coordinates.lng >= -180 && shelter.coordinates.lng <= 180);
    assert.ok(shelter.capacity > 0, `Shelter ${shelter.id} capacity must be > 0`);
    assert.ok(shelter.currentOccupancy >= 0, `Shelter ${shelter.id} occupancy must be >= 0`);
    assert.ok(shelter.currentOccupancy <= shelter.capacity, `Shelter ${shelter.id} occupancy cannot exceed capacity`);
  }
});

test('Data Integrity - All initial resources have totalQuantity >= availableQuantity >= 0', () => {
  for (const res of INITIAL_RESOURCES) {
    assert.ok(res.totalQuantity >= 0);
    assert.ok(res.availableQuantity >= 0);
    assert.ok(res.availableQuantity <= res.totalQuantity, `Resource ${res.id} available exceeds total`);
  }
});

test('Data Integrity - All demo personas correspond to valid roles', () => {
  const validRoles = ['administrator', 'incident_commander', 'field_responder', 'logistics_officer', 'read_only_analyst'];
  assert.equal(DEMO_USERS.length, 5, 'Should have exactly 5 demo personas');
  for (const user of DEMO_USERS) {
    assert.ok(validRoles.includes(user.role), `User ${user.id} has invalid role ${user.role}`);
    assert.ok(user.email.includes('@'), `User ${user.id} has invalid email`);
  }
});

test('Data Integrity - All audit logs have valid actor, action and timestamp', () => {
  for (const audit of INITIAL_AUDIT_LOGS) {
    assert.ok(audit.id, 'Audit log must have ID');
    assert.ok(audit.timestamp, 'Audit log must have timestamp');
    assert.ok(audit.actor && audit.actor.id, 'Audit log must have actor');
    assert.ok(audit.action, 'Audit log must have action');
    assert.ok(['info', 'warning', 'critical'].includes(audit.severity), 'Audit log severity must be valid');
  }
});
