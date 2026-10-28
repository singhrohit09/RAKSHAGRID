import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';

const router = Router();

// GET /api/alerts
router.get('/', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT a.*, i.title as related_incident_title
      FROM alerts a
      LEFT JOIN incidents i ON a.related_incident_id = i.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // If not authenticated, only return alerts approved for demo/public
    if (!req.user) {
      sql += " AND a.status = 'Approved for Demo'";
    } else if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string') {
      sql += ' AND (a.title LIKE ? OR a.body LIKE ? OR a.target_region LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY a.created_at DESC';

    const rows = await db.query(sql, params);

    const formatted = rows.map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      type: a.type,
      severity: a.severity,
      targetRegion: a.target_region,
      relatedIncidentId: a.related_incident_id,
      relatedIncidentTitle: a.related_incident_title,
      safetyActions: JSON.parse(a.safety_actions || '[]'),
      channels: JSON.parse(a.channels || '{}'),
      status: a.status,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      approvedBy: a.approved_by,
      approvedAt: a.approved_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ error: 'Failed to retrieve emergency alerts.' });
  }
});

// POST /api/alerts
router.post('/', authenticate, requirePermission('create_alerts'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      body,
      type = 'Warning',
      severity = 'Severe',
      targetRegion,
      relatedIncidentId,
      safetyActions = [],
      channels = { publicBulletin: true }
    } = req.body;

    if (!title || !body || !targetRegion) {
      res.status(400).json({ error: 'Title, body text, and target region are required.' });
      return;
    }

    const alertId = `ALT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const actionsArray = Array.isArray(safetyActions) ? safetyActions : String(safetyActions).split('\n').map(s => s.trim());

    await db.run(
      `INSERT INTO alerts (id, title, body, type, severity, target_region, related_incident_id, safety_actions, channels, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertId,
        title.trim(),
        body.trim(),
        type,
        severity,
        targetRegion.trim(),
        relatedIncidentId || null,
        JSON.stringify(actionsArray),
        JSON.stringify(channels),
        'Draft',
        now,
        now
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'alert_created',
      entityType: 'alert',
      entityId: alertId,
      description: `Drafted emergency alert: "${title}"`
    });

    res.status(201).json({ message: 'Alert created as Draft', id: alertId });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to draft alert.' });
  }
});

// PUT /api/alerts/:id
router.put('/:id', authenticate, requirePermission('create_alerts'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }

    const {
      title = existing.title,
      body = existing.body,
      type = existing.type,
      severity = existing.severity,
      targetRegion = existing.target_region,
      relatedIncidentId = existing.related_incident_id,
      safetyActions,
      channels,
      status = existing.status
    } = req.body;

    const actionsJson = safetyActions !== undefined
      ? JSON.stringify(Array.isArray(safetyActions) ? safetyActions : String(safetyActions).split('\n').map(s => s.trim()))
      : existing.safety_actions;

    const channelsJson = channels !== undefined ? JSON.stringify(channels) : existing.channels;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE alerts
       SET title = ?, body = ?, type = ?, severity = ?, target_region = ?, related_incident_id = ?, safety_actions = ?, channels = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        title.trim(),
        body.trim(),
        type,
        severity,
        targetRegion.trim(),
        relatedIncidentId || null,
        actionsJson,
        channelsJson,
        status,
        now,
        req.params.id
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'alert_updated',
      entityType: 'alert',
      entityId: String(req.params.id),
      description: `Updated emergency alert ${req.params.id}: "${title}"`
    });

    res.json({ message: 'Alert updated successfully' });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert.' });
  }
});

// POST /api/alerts/:id/approve (Authorized Commanders / Administrators only)
router.post('/:id/approve', authenticate, requirePermission('approve_alerts'), async (req: Request, res: Response) => {
  try {
    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }

    const now = new Date().toISOString();
    const approverName = `${req.user!.displayName} (${req.user!.role.toUpperCase()})`;

    await db.run(
      `UPDATE alerts
       SET status = 'Approved for Demo', approved_by = ?, approved_at = ?, updated_at = ?
       WHERE id = ?`,
      [approverName, now, now, req.params.id]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'alert_approved',
      entityType: 'alert',
      entityId: String(req.params.id),
      description: `Approved demo emergency alert: "${alert.title}" (Simulated only — no public telecommunications transmission)`
    });

    res.json({
      message: 'Alert approved for demo display. (No external transmission occurred).',
      approvedBy: approverName,
      approvedAt: now,
      status: 'Approved for Demo'
    });
  } catch (error) {
    console.error('Approve alert error:', error);
    res.status(500).json({ error: 'Failed to approve alert.' });
  }
});

// POST /api/alerts/:id/archive
router.post('/:id/archive', authenticate, requirePermission('create_alerts'), async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    await db.run("UPDATE alerts SET status = 'Archived', updated_at = ? WHERE id = ?", [now, req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'alert_archived',
      entityType: 'alert',
      entityId: String(req.params.id),
      description: `Archived alert ${req.params.id}`
    });

    res.json({ message: 'Alert archived' });
  } catch (error) {
    console.error('Archive alert error:', error);
    res.status(500).json({ error: 'Failed to archive alert.' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticate, requirePermission('create_alerts'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT title FROM alerts WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }

    await db.run('DELETE FROM alerts WHERE id = ?', [req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'alert_deleted',
      entityType: 'alert',
      entityId: String(req.params.id),
      description: `Deleted alert record: "${existing.title}" (${req.params.id})`
    });

    res.json({ message: 'Alert record deleted' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert.' });
  }
});

export default router;
