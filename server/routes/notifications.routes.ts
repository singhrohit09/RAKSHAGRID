import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';
import { notificationDispatcher } from '../services/notifications/dispatcher.js';
import { OutgoingNotification } from '../services/notifications/types.js';

const router = Router();

// GET /api/notifications - Get user notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const notifications = await db.all<Record<string, unknown>>(
      `SELECT * FROM notifications 
       WHERE user_id = ? OR user_id IS NULL 
       ORDER BY created_at DESC LIMIT 50`,
      [user.id]
    );

    const formatted = notifications.map((n: Record<string, unknown>) => ({
      ...n,
      isRead: Boolean(n.is_read)
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
});

// GET /api/notifications/deliveries - Audit history of multichannel notification deliveries
router.get('/deliveries', authenticate, requirePermission('view_audit'), async (_req: Request, res: Response) => {
  try {
    const deliveries = await db.all<any>(
      `SELECT * FROM notification_deliveries 
       ORDER BY created_at DESC LIMIT 100`
    );

    res.json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error: any) {
    console.error('Fetch deliveries error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve delivery audit records' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.run('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await db.run(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? OR user_id IS NULL',
      [user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all notifications as read' });
  }
});

// POST /api/notifications/dispatch - Multichannel alert dispatcher with deduplication
router.post('/dispatch', authenticate, requirePermission('create_alerts'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      message,
      severity = 'medium',
      channels = ['in_app'],
      targetRecipient,
      incidentId,
      geofenceId,
      affectedRegion,
      recommendedAction,
      deduplicationKey
    } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, error: 'Title and message are required.' });
      return;
    }

    const payload: OutgoingNotification = {
      title,
      message,
      severity,
      channels,
      targetRecipient,
      incidentId,
      geofenceId,
      affectedRegion,
      recommendedAction,
      deduplicationKey
    };

    const summary = await notificationDispatcher.dispatch(payload);

    await recordAuditEvent({
      actor: req.user,
      action: 'dispatch_notification',
      entityType: 'notification',
      entityId: summary.notificationId,
      description: `Dispatched ${severity} notification "${title}" to channels [${channels.join(', ')}]. Overall: ${summary.overallStatus}`
    });

    res.status(200).json({
      success: summary.overallStatus !== 'failed',
      summary
    });
  } catch (error: any) {
    console.error('Dispatch error:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch notification' });
  }
});

// POST /api/notifications - Legacy internal broadcast notification
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, message, type = 'info', userId } = req.body;
    if (!title || !message) {
      res.status(400).json({ success: false, error: 'Title and message are required' });
      return;
    }

    const id = `NOTIF-${Date.now()}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
      [id, userId || null, title, message, type, now]
    );

    res.status(201).json({
      success: true,
      data: { id, userId, title, message, type, isRead: false, createdAt: now }
    });
  } catch (error) {
    console.error('Notification create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

export default router;
