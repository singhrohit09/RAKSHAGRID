import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';

const router = Router();

// GET /api/tasks
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, priority, teamId, incidentId, search } = req.query;

    let sql = `
      SELECT t.*, i.title as related_incident_title, tm.name as assigned_team_name
      FROM tasks t
      LEFT JOIN incidents i ON t.related_incident_id = i.id
      LEFT JOIN teams tm ON t.assigned_team_id = tm.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string') {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.id LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (status && status !== 'all') {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    if (teamId && teamId !== 'all') {
      sql += ' AND t.assigned_team_id = ?';
      params.push(teamId);
    }

    if (incidentId) {
      sql += ' AND t.related_incident_id = ?';
      params.push(incidentId);
    }

    sql += ' ORDER BY t.due_date ASC';

    const rows = await db.query(sql, params);

    const formatted = rows.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      relatedIncidentId: t.related_incident_id,
      relatedIncidentTitle: t.related_incident_title,
      assignedTeamId: t.assigned_team_id,
      assignedTeamName: t.assigned_team_name,
      priority: t.priority,
      status: t.status,
      dueDate: t.due_date,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// POST /api/tasks
router.post('/', authenticate, requirePermission('assign_tasks'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description = '',
      relatedIncidentId,
      assignedTeamId,
      priority = 'High',
      status = 'Ready',
      dueDate
    } = req.body;

    if (!title || !dueDate) {
      res.status(400).json({ error: 'Task title and due date are required.' });
      return;
    }

    // Verify incident reference if provided
    if (relatedIncidentId) {
      const inc = await db.get('SELECT id FROM incidents WHERE id = ?', [relatedIncidentId]);
      if (!inc) {
        res.status(400).json({ error: `Referenced incident (${relatedIncidentId}) does not exist.` });
        return;
      }
    }

    // Verify team reference if provided
    if (assignedTeamId) {
      const tm = await db.get('SELECT id FROM teams WHERE id = ?', [assignedTeamId]);
      if (!tm) {
        res.status(400).json({ error: `Referenced team (${assignedTeamId}) does not exist.` });
        return;
      }
    }

    const taskId = `TSK-${Math.floor(2000 + Math.random() * 8000)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO tasks (id, title, description, related_incident_id, assigned_team_id, priority, status, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        title.trim(),
        description.trim(),
        relatedIncidentId || null,
        assignedTeamId || null,
        priority,
        status,
        dueDate,
        now,
        now
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'task_created',
      entityType: 'task',
      entityId: taskId,
      description: `Dispatched task: "${title}" (Priority: ${priority})`
    });

    res.status(201).json({ message: 'Task created', id: taskId });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id/status
router.put('/:id/status', authenticate, requirePermission('manage_tasks'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Completed'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid task status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const existing = await db.get('SELECT title, status FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const now = new Date().toISOString();
    await db.run('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [status, now, req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'task_status_changed',
      entityType: 'task',
      entityId: String(req.params.id),
      description: `Moved task "${existing.title}" from ${existing.status} to ${status}`
    });

    res.json({ message: 'Task status updated', status });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status.' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, requirePermission('manage_tasks'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const {
      title = existing.title,
      description = existing.description,
      relatedIncidentId = existing.related_incident_id,
      assignedTeamId = existing.assigned_team_id,
      priority = existing.priority,
      status = existing.status,
      dueDate = existing.due_date
    } = req.body;

    const now = new Date().toISOString();

    await db.run(
      `UPDATE tasks
       SET title = ?, description = ?, related_incident_id = ?, assigned_team_id = ?, priority = ?, status = ?, due_date = ?, updated_at = ?
       WHERE id = ?`,
      [
        title.trim(),
        description.trim(),
        relatedIncidentId || null,
        assignedTeamId || null,
        priority,
        status,
        dueDate,
        now,
        req.params.id
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'task_updated',
      entityType: 'task',
      entityId: String(req.params.id),
      description: `Updated task ${req.params.id}: ${title}`
    });

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, requirePermission('manage_tasks'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT title FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'task_deleted',
      entityType: 'task',
      entityId: String(req.params.id),
      description: `Deleted task: "${existing.title}" (${req.params.id})`
    });

    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

export default router;
