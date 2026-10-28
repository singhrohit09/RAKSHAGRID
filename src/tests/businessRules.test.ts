import { describe, it, expect } from 'vitest';
import { hasPermission } from '../utils/permissions';
import { escapeCSVValue } from '../utils/csvExport';
import { isValidLatitude, isValidLongitude, isNonNegativeNumber, validateIncidentForm } from '../utils/validators';

describe('Role & Permission Authorization Matrix', () => {
  it('should grant Administrator full authority across all operational domains', () => {
    expect(hasPermission('admin', 'view_incidents')).toBe(true);
    expect(hasPermission('admin', 'create_incidents')).toBe(true);
    expect(hasPermission('admin', 'delete_incidents')).toBe(true);
    expect(hasPermission('admin', 'manage_teams')).toBe(true);
    expect(hasPermission('admin', 'manage_shelters')).toBe(true);
    expect(hasPermission('admin', 'manage_resources')).toBe(true);
    expect(hasPermission('admin', 'approve_alerts')).toBe(true);
    expect(hasPermission('admin', 'change_settings')).toBe(true);
    expect(hasPermission('admin', 'reset_demo_data')).toBe(true);
  });

  it('should allow Incident Commander tactical incident & alert control, but restrict system settings', () => {
    expect(hasPermission('commander', 'view_incidents')).toBe(true);
    expect(hasPermission('commander', 'create_incidents')).toBe(true);
    expect(hasPermission('commander', 'approve_alerts')).toBe(true);
    expect(hasPermission('commander', 'manage_teams')).toBe(true);
    // Restricted for Commander:
    expect(hasPermission('commander', 'change_settings')).toBe(false);
    expect(hasPermission('commander', 'reset_demo_data')).toBe(false);
  });

  it('should restrict Field Responder to field execution only', () => {
    expect(hasPermission('responder', 'view_incidents')).toBe(true);
    expect(hasPermission('responder', 'manage_tasks')).toBe(true);
    // Restricted:
    expect(hasPermission('responder', 'create_incidents')).toBe(false);
    expect(hasPermission('responder', 'delete_incidents')).toBe(false);
    expect(hasPermission('responder', 'approve_alerts')).toBe(false);
    expect(hasPermission('responder', 'manage_resources')).toBe(false);
  });

  it('should allow Logistics Officer inventory and shelter management, but block alert approvals', () => {
    expect(hasPermission('logistics', 'manage_shelters')).toBe(true);
    expect(hasPermission('logistics', 'manage_resources')).toBe(true);
    expect(hasPermission('logistics', 'assign_tasks')).toBe(true);
    // Restricted:
    expect(hasPermission('logistics', 'create_alerts')).toBe(false);
    expect(hasPermission('logistics', 'approve_alerts')).toBe(false);
    expect(hasPermission('logistics', 'delete_incidents')).toBe(false);
  });

  it('should restrict Read-Only Analyst to viewing without write or mutation capability', () => {
    expect(hasPermission('analyst', 'view_incidents')).toBe(true);
    expect(hasPermission('analyst', 'view_analytics')).toBe(true);
    expect(hasPermission('analyst', 'view_audit')).toBe(true);
    // All write actions blocked:
    expect(hasPermission('analyst', 'create_incidents')).toBe(false);
    expect(hasPermission('analyst', 'edit_incidents')).toBe(false);
    expect(hasPermission('analyst', 'delete_incidents')).toBe(false);
    expect(hasPermission('analyst', 'manage_teams')).toBe(false);
    expect(hasPermission('analyst', 'manage_shelters')).toBe(false);
    expect(hasPermission('analyst', 'manage_resources')).toBe(false);
    expect(hasPermission('analyst', 'approve_alerts')).toBe(false);
  });
});

describe('CSV Escaping and Sanitization (RFC 4180)', () => {
  it('should enclose strings containing commas in quotes', () => {
    const raw = 'Sector 4, Mayur Vihar, Riverfront';
    const escaped = escapeCSVValue(raw);
    expect(escaped).toBe('"Sector 4, Mayur Vihar, Riverfront"');
  });

  it('should escape internal double quotes by doubling them', () => {
    const raw = 'Evacuate "immediately" per order';
    const escaped = escapeCSVValue(raw);
    expect(escaped).toBe('"Evacuate ""immediately"" per order"');
  });

  it('should handle multiline text with newlines safely', () => {
    const raw = 'Turn off power.\nEvacuate immediately.';
    const escaped = escapeCSVValue(raw);
    expect(escaped).toBe('"Turn off power.\nEvacuate immediately."');
  });

  it('should handle null and undefined gracefully', () => {
    expect(escapeCSVValue(null)).toBe('""');
    expect(escapeCSVValue(undefined)).toBe('""');
  });
});

describe('Coordinate and Form Validation', () => {
  it('should validate geographical coordinates within legal global bounds', () => {
    expect(isValidLatitude(28.6139)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLatitude(-91)).toBe(false);

    expect(isValidLongitude(77.2090)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(181)).toBe(false);
    expect(isValidLongitude(-181)).toBe(false);
  });

  it('should enforce non-negative population and casualty figures', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(1500)).toBe(true);
    expect(isNonNegativeNumber(-5)).toBe(false);
  });

  it('should reject incident forms with missing titles or invalid lat/lng', () => {
    const invalidForm = {
      title: 'A', // Too short
      category: '',
      severity: '',
      locationName: '',
      latitude: 195, // Out of bounds
      longitude: 77.2,
      affectedPopulation: -10
    };

    const result = validateIncidentForm(invalidForm);
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.category).toBeDefined();
    expect(result.errors.latitude).toBeDefined();
    expect(result.errors.affectedPopulation).toBeDefined();
  });

  it('should accept valid incident forms', () => {
    const validForm = {
      title: 'Yamuna River Embankment Breach',
      category: 'flood',
      severity: 'Critical',
      locationName: 'Mayur Vihar Sector 4',
      latitude: 28.6250,
      longitude: 77.2350,
      affectedPopulation: 14500
    };

    const result = validateIncidentForm(validForm);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });
});
