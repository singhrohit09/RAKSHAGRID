import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';

const router = Router();

// GET /api/teams
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { type, status, search } = req.query;

    let sql = 'SELECT * FROM teams WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string') {
      sql += ' AND (name LIKE ? OR home_base LIKE ? OR id LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY name ASC';

    const rows = await db.query(sql, params);

    const formatted = rows.map((t: any) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      staffCount: Number(t.staff_count),
      skills: JSON.parse(t.skills || '[]'),
      homeBase: t.home_base,
      status: t.status,
      currentAssignment: t.current_assignment,
      contactCallsign: t.contact_callsign,
      contactPhone: t.contact_phone,
      latitude: Number(t.latitude),
      longitude: Number(t.longitude),
      updatedAt: t.updated_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch teams error:', error);
    res.status(500).json({ error: 'Failed to retrieve response teams.' });
  }
});

// POST /api/teams
router.post('/', authenticate, requirePermission('manage_teams'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      type = 'search_rescue',
      staffCount = 10,
      skills = [],
      homeBase,
      status = 'Available',
      currentAssignment = '',
      contactCallsign = 'UNIT-01',
      contactPhone = '+91 98765-DEMO',
      latitude = 28.6139,
      longitude = 77.2090
    } = req.body;

    if (!name || !homeBase) {
      res.status(400).json({ error: 'Team name and home base are required.' });
      return;
    }

    const teamId = `TEAM-${type.toUpperCase().substring(0, 4)}-${Math.floor(10 + Math.random() * 89)}`;
    const now = new Date().toISOString();

    const skillsArray = Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim());

    await db.run(
      `INSERT INTO teams (id, name, type, staff_count, skills, home_base, status, current_assignment, contact_callsign, contact_phone, latitude, longitude, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teamId,
        name.trim(),
        type,
        Math.max(1, Number(staffCount)),
        JSON.stringify(skillsArray),
        homeBase.trim(),
        status,
        currentAssignment.trim() || null,
        contactCallsign.trim(),
        contactPhone.trim(),
        Number(latitude),
        Number(longitude),
        now
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'team_created',
      entityType: 'team',
      entityId: teamId,
      description: `Registered response team: ${name} (${staffCount} personnel)`
    });

    res.status(201).json({ message: 'Team created', id: teamId });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create response team.' });
  }
});

// PUT /api/teams/:id
router.put('/:id', authenticate, requirePermission('manage_teams'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    const {
      name = existing.name,
      type = existing.type,
      staffCount = existing.staff_count,
      skills,
      homeBase = existing.home_base,
      status = existing.status,
      currentAssignment = existing.current_assignment,
      contactCallsign = existing.contact_callsign,
      contactPhone = existing.contact_phone,
      latitude = existing.latitude,
      longitude = existing.longitude
    } = req.body;

    const skillsJson = skills !== undefined
      ? JSON.stringify(Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim()))
      : existing.skills;

    const now = new Date().toISOString();

    await db.run(
      `UPDATE teams
       SET name = ?, type = ?, staff_count = ?, skills = ?, home_base = ?, status = ?, current_assignment = ?, contact_callsign = ?, contact_phone = ?, latitude = ?, longitude = ?, updated_at = ?
       WHERE id = ?`,
      [
        name,
        type,
        Math.max(1, Number(staffCount)),
        skillsJson,
        homeBase,
        status,
        currentAssignment || null,
        contactCallsign,
        contactPhone,
        Number(latitude),
        Number(longitude),
        now,
        req.params.id
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'team_updated',
      entityType: 'team',
      entityId: String(req.params.id),
      description: `Updated response team ${name} (${status})`
    });

    res.json({ message: 'Team updated successfully' });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update response team.' });
  }
});

// DELETE /api/teams/:id
router.delete('/:id', authenticate, requirePermission('manage_teams'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT name FROM teams WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    await db.run('DELETE FROM teams WHERE id = ?', [req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'team_deleted',
      entityType: 'team',
      entityId: String(req.params.id),
      description: `Removed response team: ${existing.name}`
    });

    res.json({ message: 'Team removed successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete response team.' });
  }
});

export default router;
