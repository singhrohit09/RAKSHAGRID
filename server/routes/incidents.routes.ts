import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';

const router = Router();

// GET /api/incidents
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, severity, status, category, sortBy = 'reported_at', sortOrder = 'DESC' } = req.query;

    let sql = `
      SELECT i.*, t.name as assigned_team_name
      FROM incidents i
      LEFT JOIN teams t ON i.assigned_team_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string') {
      sql += ` AND (i.title LIKE ? OR i.id LIKE ? OR i.location_name LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (severity && severity !== 'all') {
      sql += ` AND i.severity = ?`;
      params.push(severity);
    }

    if (status && status !== 'all') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (category && category !== 'all') {
      sql += ` AND i.category = ?`;
      params.push(category);
    }

    const validSortCols: Record<string, string> = {
      reported_at: 'i.reported_at',
      priority: 'i.priority',
      severity: 'i.severity',
      title: 'i.title'
    };
    const orderCol = validSortCols[String(sortBy)] || 'i.reported_at';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${orderCol} ${orderDir}`;

    const incidents = await db.query(sql, params);

    // Fetch timelines for each incident
    const incidentIds = incidents.map((i: any) => i.id);
    const timelines: any[] = incidentIds.length > 0 
      ? await db.query(`SELECT * FROM incident_timeline WHERE incident_id IN (${incidentIds.map(() => '?').join(',')}) ORDER BY timestamp ASC`, incidentIds)
      : [];

    const timelineMap: Record<string, any[]> = {};
    timelines.forEach(t => {
      if (!timelineMap[t.incident_id]) timelineMap[t.incident_id] = [];
      timelineMap[t.incident_id].push({
        id: t.id,
        timestamp: t.timestamp,
        actor: t.actor,
        note: t.note,
        type: t.type
      });
    });

    const formatted = incidents.map((i: any) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      category: i.category,
      severity: i.severity,
      status: i.status,
      priority: i.priority,
      locationName: i.location_name,
      latitude: Number(i.latitude),
      longitude: Number(i.longitude),
      reportedAt: i.reported_at,
      updatedAt: i.updated_at,
      assignedTeamId: i.assigned_team_id,
      assignedTeamName: i.assigned_team_name,
      affectedPopulation: Number(i.affected_population),
      casualties: Number(i.casualties),
      source: i.source,
      estimatedRadiusMeters: Number(i.estimated_radius_meters),
      timeline: timelineMap[i.id] || []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ error: 'Failed to retrieve incidents.' });
  }
});

// GET /api/incidents/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const inc = await db.get(
      `SELECT i.*, t.name as assigned_team_name 
       FROM incidents i 
       LEFT JOIN teams t ON i.assigned_team_id = t.id 
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!inc) {
      res.status(404).json({ error: 'Incident record not found.' });
      return;
    }

    const timelines = await db.query(
      'SELECT * FROM incident_timeline WHERE incident_id = ? ORDER BY timestamp ASC',
      [req.params.id]
    );

    res.json({
      id: inc.id,
      title: inc.title,
      description: inc.description,
      category: inc.category,
      severity: inc.severity,
      status: inc.status,
      priority: inc.priority,
      locationName: inc.location_name,
      latitude: Number(inc.latitude),
      longitude: Number(inc.longitude),
      reportedAt: inc.reported_at,
      updatedAt: inc.updated_at,
      assignedTeamId: inc.assigned_team_id,
      assignedTeamName: inc.assigned_team_name,
      affectedPopulation: Number(inc.affected_population),
      casualties: Number(inc.casualties),
      source: inc.source,
      estimatedRadiusMeters: Number(inc.estimated_radius_meters),
      timeline: timelines
    });
  } catch (error) {
    console.error('Fetch incident detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve incident details.' });
  }
});

// POST /api/incidents
router.post('/', authenticate, requirePermission('create_incidents'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description = '',
      category,
      severity,
      status = 'Reported',
      priority = 'P2',
      locationName,
      latitude,
      longitude,
      assignedTeamId,
      affectedPopulation = 0,
      casualties = 0,
      source = 'Manual Report',
      estimatedRadiusMeters = 1000
    } = req.body;

    if (!title || !category || !severity || !locationName) {
      res.status(400).json({ error: 'Title, category, severity, and location name are required.' });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({ error: 'Latitude must be a valid coordinate between -90 and 90.' });
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'Longitude must be a valid coordinate between -180 and 180.' });
      return;
    }

    const incidentId = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    await db.transaction(async () => {
      await db.run(
        `INSERT INTO incidents (id, title, description, category, severity, status, priority, location_name, latitude, longitude, reported_at, updated_at, assigned_team_id, affected_population, casualties, source, estimated_radius_meters)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incidentId,
          title.trim(),
          description.trim(),
          category,
          severity,
          status,
          priority,
          locationName.trim(),
          lat,
          lng,
          now,
          now,
          assignedTeamId || null,
          Math.max(0, Number(affectedPopulation)),
          Math.max(0, Number(casualties)),
          source,
          Number(estimatedRadiusMeters) || 1000
        ]
      );

      const timelineId = `TL-${Date.now()}`;
      await db.run(
        `INSERT INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          timelineId,
          incidentId,
          now,
          req.user!.displayName,
          `Incident registered with priority ${priority} and severity ${severity}.`,
          'general'
        ]
      );
    });

    await recordAuditEvent({
      actor: req.user,
      action: 'incident_created',
      entityType: 'incident',
      entityId: incidentId,
      description: `Created incident: "${title}" (${severity}) at ${locationName}`
    });

    res.status(201).json({
      message: 'Incident registered successfully',
      id: incidentId
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident.' });
  }
});

// PUT /api/incidents/:id
router.put('/:id', authenticate, requirePermission('edit_incidents'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    const {
      title = existing.title,
      description = existing.description,
      category = existing.category,
      severity = existing.severity,
      status = existing.status,
      priority = existing.priority,
      locationName = existing.location_name,
      latitude = existing.latitude,
      longitude = existing.longitude,
      assignedTeamId = existing.assigned_team_id,
      affectedPopulation = existing.affected_population,
      casualties = existing.casualties,
      estimatedRadiusMeters = existing.estimated_radius_meters
    } = req.body;

    const now = new Date().toISOString();

    await db.transaction(async () => {
      await db.run(
        `UPDATE incidents
         SET title = ?, description = ?, category = ?, severity = ?, status = ?, priority = ?, location_name = ?, latitude = ?, longitude = ?, assigned_team_id = ?, affected_population = ?, casualties = ?, estimated_radius_meters = ?, updated_at = ?
         WHERE id = ?`,
        [
          title,
          description,
          category,
          severity,
          status,
          priority,
          locationName,
          Number(latitude),
          Number(longitude),
          assignedTeamId || null,
          Number(affectedPopulation),
          Number(casualties),
          Number(estimatedRadiusMeters),
          now,
          req.params.id
        ]
      );

      // Append timeline entries on significant transitions
      if (status !== existing.status) {
        await db.run(
          `INSERT INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `TL-${Date.now()}`,
            req.params.id,
            now,
            req.user!.displayName,
            `Status transitioned from ${existing.status} to ${status}.`,
            'status_change'
          ]
        );
      }

      if (assignedTeamId && assignedTeamId !== existing.assigned_team_id) {
        await db.run(
          `INSERT INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `TL-${Date.now()}-2`,
            req.params.id,
            now,
            req.user!.displayName,
            `Assigned to response team: ${assignedTeamId}.`,
            'team_assigned'
          ]
        );
      }
    });

    await recordAuditEvent({
      actor: req.user,
      action: 'incident_updated',
      entityType: 'incident',
      entityId: String(req.params.id),
      description: `Updated incident ${req.params.id}: ${title} (${status})`
    });

    res.json({ message: 'Incident updated successfully' });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident.' });
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', authenticate, requirePermission('delete_incidents'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT title FROM incidents WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    await db.transaction(async () => {
      await db.run('DELETE FROM incident_timeline WHERE incident_id = ?', [req.params.id]);
      await db.run('DELETE FROM incidents WHERE id = ?', [req.params.id]);
    });

    await recordAuditEvent({
      actor: req.user,
      action: 'incident_deleted',
      entityType: 'incident',
      entityId: String(req.params.id),
      description: `Deleted incident: "${existing.title}" (${req.params.id})`
    });

    res.json({ message: 'Incident removed from registry.' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Failed to delete incident.' });
  }
});

// POST /api/incidents/:id/timeline
router.post('/:id/timeline', authenticate, requirePermission('edit_incidents'), async (req: Request, res: Response) => {
  try {
    const { note, type = 'general' } = req.body;
    if (!note || !note.trim()) {
      res.status(400).json({ error: 'Timeline note text is required.' });
      return;
    }

    const timelineId = `TL-${Date.now()}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO incident_timeline (id, incident_id, timestamp, actor, note, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [timelineId, req.params.id, now, req.user!.displayName, note.trim(), type]
    );

    res.status(201).json({ message: 'Timeline note recorded.', id: timelineId });
  } catch (error) {
    console.error('Post timeline note error:', error);
    res.status(500).json({ error: 'Failed to record timeline note.' });
  }
});

export default router;
