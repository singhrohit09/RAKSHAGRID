export type AuditEntityType = 
  | 'incident' 
  | 'team' 
  | 'shelter' 
  | 'resource' 
  | 'task' 
  | 'alert' 
  | 'settings' 
  | 'system';

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
}
