import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';
import { 
  GeofenceZone, 
  validateGeofenceGeometry, 
  evaluateSpatialContainment,
  SpatialEntity
} from '../services/gis/geofenceEngine.js';

const router = Router();

function mapRowToGeofence(row: any): GeofenceZone {
  let coords: [number, number][] = [];
  try {
    coords = typeof row.coordinates_json === 'string' ? JSON.parse(row.coordinates_json) : row.coordinates_json;
  } catch {
    coords = [];
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    severity: row.severity,
    status: row.status,
    shapeType: row.shape_type,
    centerLatitude: row.center_latitude !== null ? Number(row.center_latitude) : undefined,
    centerLongitude: row.center_longitude !== null ? Number(row.center_longitude) : undefined,
    radiusMeters: row.radius_meters !== null ? Number(row.radius_meters) : undefined,
    coordinates: coords,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * GET /api/geofences
 * Retrieves all geofences and operational risk zones.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    let sql = 'SELECT * FROM geofences';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await db.all<any>(sql, params);
    const geofences = rows.map(mapRowToGeofence);

    res.json(geofences);
  } catch (error: any) {
    console.error('Fetch geofences error:', error);
    res.status(500).json({ error: 'Failed to retrieve geofences.' });
  }
});

/**
 * GET /api/geofences/eval
 * Performs server-side spatial analysis: evaluates all active hazard zones against
 * real incidents, response teams, and evacuation shelters.
 */
router.get('/eval', async (_req: Request, res: Response) => {
  try {
    const zoneRows = await db.all<any>('SELECT * FROM geofences');
    const zones = zoneRows.map(mapRowToGeofence);

    // Fetch active incidents
    const incidentRows = await db.all<any>('SELECT id, title, latitude, longitude FROM incidents WHERE status != ?', ['Closed']);
    const incidents: SpatialEntity[] = incidentRows.map(r => ({
      id: r.id,
      title: r.title,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      type: 'incident'
    }));

    // Fetch response teams
    const teamRows = await db.all<any>('SELECT id, name, latitude, longitude FROM teams');
    const teams: SpatialEntity[] = teamRows.map(r => ({
      id: r.id,
      name: r.name,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      type: 'team'
    }));

    // Fetch shelters
    const shelterRows = await db.all<any>('SELECT id, name, latitude, longitude FROM shelters');
    const shelters: SpatialEntity[] = shelterRows.map(r => ({
      id: r.id,
      name: r.name,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      type: 'shelter'
    }));

    const report = evaluateSpatialContainment(zones, incidents, teams, shelters);
    res.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('Evaluate geofences error:', error);
    res.status(500).json({ error: 'Failed to evaluate spatial geofences.' });
  }
});

/**
 * GET /api/geofences/:id
 * Retrieves a single geofence by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const row = await db.get<any>('SELECT * FROM geofences WHERE id = ?', [req.params.id]);
    if (!row) {
      res.status(404).json({ error: 'Geofence zone not found.' });
      return;
    }
    res.json(mapRowToGeofence(row));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch geofence.' });
  }
});

/**
 * POST /api/geofences
 * Creates a new geofenced risk zone or evacuation perimeter.
 * Restricted to commanders and administrators.
 */
router.post('/', authenticate, requirePermission('create_incidents'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      severity = 'Medium',
      shapeType = 'polygon',
      coordinates,
      radiusMeters,
      description
    } = req.body;

    if (!name || !category || !coordinates) {
      res.status(400).json({ error: 'Zone name, category, and coordinates are required.' });
      return;
    }

    const validation = validateGeofenceGeometry(shapeType, coordinates, radiusMeters);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const id = `ZONE-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const centerLat = shapeType === 'circle' && coordinates[0] ? coordinates[0][0] : null;
    const centerLng = shapeType === 'circle' && coordinates[0] ? coordinates[0][1] : null;

    await db.run(
      `INSERT INTO geofences (id, name, category, severity, status, shape_type, center_latitude, center_longitude, radius_meters, coordinates_json, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        category,
        severity,
        shapeType,
        centerLat,
        centerLng,
        radiusMeters || null,
        JSON.stringify(coordinates),
        description || '',
        req.user?.displayName || 'Authorized EOC Officer',
        now,
        now
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'create_geofence',
      entityType: 'geofence',
      entityId: id,
      description: `Created ${severity} risk zone "${name}" (${category}) with ${shapeType} boundary.`
    });

    res.status(201).json({
      message: 'Geofenced risk zone established successfully.',
      id,
      zone: {
        id,
        name,
        category,
        severity,
        status: 'Active',
        shapeType,
        coordinates,
        radiusMeters
      }
    });
  } catch (error: any) {
    console.error('Create geofence error:', error);
    res.status(500).json({ error: 'Failed to create geofence zone.' });
  }
});

/**
 * PUT /api/geofences/:id
 * Updates an existing geofence.
 */
router.put('/:id', authenticate, requirePermission('create_incidents'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get<any>('SELECT id, name FROM geofences WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Geofence zone not found.' });
      return;
    }

    const {
      name,
      category,
      severity,
      status,
      shapeType,
      coordinates,
      radiusMeters,
      description
    } = req.body;

    if (shapeType && coordinates) {
      const validation = validateGeofenceGeometry(shapeType, coordinates, radiusMeters);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE geofences 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           severity = COALESCE(?, severity),
           status = COALESCE(?, status),
           shape_type = COALESCE(?, shape_type),
           radius_meters = COALESCE(?, radius_meters),
           coordinates_json = CASE WHEN ? IS NOT NULL THEN ? ELSE coordinates_json END,
           description = COALESCE(?, description),
           updated_at = ?
       WHERE id = ?`,
      [
        name,
        category,
        severity,
        status,
        shapeType,
        radiusMeters,
        coordinates ? JSON.stringify(coordinates) : null,
        coordinates ? JSON.stringify(coordinates) : null,
        description,
        now,
        req.params.id
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'update_geofence',
      entityType: 'geofence',
      entityId: String(req.params.id),
      description: `Updated geofence zone "${existing.name}".`
    });

    res.json({ message: 'Geofence zone updated successfully.' });
  } catch (error: any) {
    console.error('Update geofence error:', error);
    res.status(500).json({ error: 'Failed to update geofence zone.' });
  }
});

/**
 * DELETE /api/geofences/:id
 * Removes or archives a geofence zone.
 */
router.delete('/:id', authenticate, requirePermission('create_incidents'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get<any>('SELECT id, name FROM geofences WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Geofence zone not found.' });
      return;
    }

    await db.run('DELETE FROM geofences WHERE id = ?', [req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'delete_geofence',
      entityType: 'geofence',
      entityId: String(req.params.id),
      description: `Decommissioned geofenced hazard zone "${existing.name}".`
    });

    res.json({ message: 'Geofence zone removed successfully.' });
  } catch (error: any) {
    console.error('Delete geofence error:', error);
    res.status(500).json({ error: 'Failed to delete geofence zone.' });
  }
});

export default router;
