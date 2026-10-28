import { AuditLogEvent } from '../types/audit';

export const INITIAL_AUDIT_LOGS: AuditLogEvent[] = [
  {
    id: 'AUD-001',
    timestamp: new Date(Date.now() - 3600000 * 6.2).toISOString(),
    actor: 'System Seeder',
    actorRole: 'System',
    action: 'system_initialized',
    entityType: 'system',
    entityId: 'SYS-INIT',
    description: 'RakshaGrid Phase 1 operational data store initialized with baseline disaster exercise scenario.'
  },
  {
    id: 'AUD-002',
    timestamp: new Date(Date.now() - 3600000 * 6.0).toISOString(),
    actor: 'Patrol Drone Observer',
    actorRole: 'Field Observer',
    action: 'incident_created',
    entityType: 'incident',
    entityId: 'INC-2026-0101',
    description: 'Logged Critical incident: Yamuna River Embankment Breach — Sector 4.'
  },
  {
    id: 'AUD-003',
    timestamp: new Date(Date.now() - 3600000 * 5.4).toISOString(),
    actor: 'Cmdr. Ananya Sen',
    actorRole: 'Incident Commander',
    action: 'team_assigned',
    entityType: 'incident',
    entityId: 'INC-2026-0101',
    description: 'Dispatched team NDRF Battalion 8 — Alpha Strike (42 personnel) to Mayur Vihar riverfront breach.'
  },
  {
    id: 'AUD-004',
    timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(),
    actor: 'Pooja Kulkarni',
    actorRole: 'Logistics Officer',
    action: 'shelter_updated',
    entityType: 'shelter',
    entityId: 'SHL-NORTH-01',
    description: 'Updated Sector 4 Community Sports Complex shelter occupancy to 940 / 1200 (Near Capacity).'
  },
  {
    id: 'AUD-005',
    timestamp: new Date(Date.now() - 3600000 * 4.0).toISOString(),
    actor: 'Director Rajesh Verma',
    actorRole: 'Administrator',
    action: 'alert_approved',
    entityType: 'alert',
    entityId: 'ALT-2026-001',
    description: 'Approved Demo Evacuation Alert: Flash Flood Evacuation Order for Mayur Vihar Sector 4.'
  },
  {
    id: 'AUD-006',
    timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString(),
    actor: 'Pooja Kulkarni',
    actorRole: 'Logistics Officer',
    action: 'resource_allocated',
    entityType: 'resource',
    entityId: 'RES-WAT-001',
    description: 'Allocated 1,800 units of 20L Packaged Water to Shelter SHL-NORTH-01.'
  }
];

