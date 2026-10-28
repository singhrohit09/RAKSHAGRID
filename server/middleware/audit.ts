import { db } from '../db/connection.js';
import { UserSessionPayload } from '../auth/jwt.js';

export interface AuditParams {
  actor?: UserSessionPayload;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditEvent(params: AuditParams): Promise<void> {
  const eventId = `AUD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString();

  const actorId = params.actor ? (params.actor.userId || params.actor.id) : (params.userId || 'SYSTEM');
  const actorName = params.actor ? params.actor.displayName : (params.userName || 'System Daemon');
  const actorRole = params.actor ? params.actor.role : (params.userRole || 'System');

  // Sanitize metadata to never log sensitive fields
  const safeMeta = params.metadata ? { ...params.metadata } : {};
  delete safeMeta.password;
  delete safeMeta.passwordHash;
  delete safeMeta.token;
  delete safeMeta.cookie;

  await db.run(
    `INSERT INTO audit_events (id, timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, description, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId,
      now,
      actorId,
      actorName,
      actorRole,
      params.action,
      params.entityType,
      params.entityId,
      params.description,
      Object.keys(safeMeta).length > 0 ? JSON.stringify(safeMeta) : null
    ]
  );
}
