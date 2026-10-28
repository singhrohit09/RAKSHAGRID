import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// GET /api/audit - List audit events with pagination and filters
router.get('/', authenticate, requirePermission('view_audit'), async (req: Request, res: Response) => {
  try {
    const { entity_type, action, actor_role, limit = '100', offset = '0', search } = req.query;

    let query = 'SELECT * FROM audit_events WHERE 1=1';
    const params: unknown[] = [];

    if (entity_type) {
      params.push(entity_type);
      query += ` AND entity_type = $${params.length}`;
    }
    if (action) {
      params.push(action);
      query += ` AND action = $${params.length}`;
    }
    if (actor_role) {
      params.push(actor_role);
      query += ` AND actor_role = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (description LIKE $${params.length} OR actor_name LIKE $${params.length} OR entity_id LIKE $${params.length})`;
    }

    query += ' ORDER BY timestamp DESC';

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 500);
    const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

    params.push(parsedLimit);
    query += ` LIMIT $${params.length}`;
    params.push(parsedOffset);
    query += ` OFFSET $${params.length}`;

    const events = await db.all<Record<string, unknown>>(query, params);

    // Parse metadata JSON safely
    const formattedEvents = events.map((e: Record<string, unknown>) => ({
      ...e,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata || {}
    }));

    const countResult = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM audit_events');

    res.json({
      success: true,
      total: countResult?.count || 0,
      count: formattedEvents.length,
      data: formattedEvents
    });
  } catch (error) {
    console.error('Audit query error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve audit events' });
  }
});

// GET /api/audit/export - Export audit events in CSV format
router.get('/export', authenticate, requirePermission('view_audit'), async (_req: Request, res: Response) => {
  try {
    const events = await db.all<Record<string, unknown>>('SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 2000');

    // Generate CSV string
    const headers = ['id', 'timestamp', 'actor_id', 'actor_name', 'actor_role', 'action', 'entity_type', 'entity_id', 'description'];
    const csvRows = [headers.join(',')];

    for (const row of events) {
      const values = headers.map(header => {
        const val = row[header] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rakshagrid_audit_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Audit export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export audit logs' });
  }
});

export default router;
