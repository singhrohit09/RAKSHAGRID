import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';

const router = Router();

// GET /api/shelters
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, region, search } = req.query;

    let sql = 'SELECT * FROM shelters WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string') {
      sql += ' AND (name LIKE ? OR address LIKE ? OR region LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (region && region !== 'all') {
      sql += ' AND region = ?';
      params.push(region);
    }

    sql += ' ORDER BY name ASC';

    const rows = await db.query(sql, params);

    const formatted = rows.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      region: s.region,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      capacity: Number(s.capacity),
      currentOccupancy: Number(s.current_occupancy),
      status: s.status,
      facilities: JSON.parse(s.facilities || '{}'),
      contactPerson: s.contact_person,
      contactPhone: s.contact_phone,
      notes: s.notes,
      updatedAt: s.updated_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch shelters error:', error);
    res.status(500).json({ error: 'Failed to retrieve shelters.' });
  }
});

// POST /api/shelters
router.post('/', authenticate, requirePermission('manage_shelters'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      address,
      region,
      latitude,
      longitude,
      capacity = 100,
      currentOccupancy = 0,
      facilities = {},
      contactPerson = '',
      contactPhone = '',
      notes = ''
    } = req.body;

    if (!name || !address || !region) {
      res.status(400).json({ error: 'Shelter name, address, and operational region are required.' });
      return;
    }

    const shelterId = `SHL-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const cap = Math.max(1, Number(capacity));
    const occ = Math.max(0, Number(currentOccupancy));

    let status = 'Open';
    if (occ >= cap) status = 'Full';
    else if (occ >= cap * 0.85) status = 'Near Capacity';

    await db.run(
      `INSERT INTO shelters (id, name, address, region, latitude, longitude, capacity, current_occupancy, status, facilities, contact_person, contact_phone, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shelterId,
        name.trim(),
        address.trim(),
        region.trim(),
        Number(latitude) || 28.6139,
        Number(longitude) || 77.2090,
        cap,
        occ,
        status,
        JSON.stringify(facilities),
        contactPerson.trim(),
        contactPhone.trim(),
        notes.trim(),
        now
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'shelter_created',
      entityType: 'shelter',
      entityId: shelterId,
      description: `Registered shelter: ${name} (Capacity: ${cap} beds)`
    });

    res.status(201).json({ message: 'Shelter created', id: shelterId });
  } catch (error) {
    console.error('Create shelter error:', error);
    res.status(500).json({ error: 'Failed to create shelter.' });
  }
});

// PUT /api/shelters/:id/occupancy (and POST)
const handleOccupancyUpdate = async (req: Request, res: Response) => {
  try {
    const occVal = req.body.occupancy ?? req.body.currentOccupancy;
    const allowOverflow = Boolean(req.body.allowOverflow || req.body.forceOverride);
    const overrideReason = req.body.overrideReason || req.body.reason;
    const occ = Number(occVal);

    if (isNaN(occ) || occ < 0) {
      res.status(400).json({ error: 'Occupancy count must be a non-negative number.' });
      return;
    }

    const shelter = await db.get('SELECT * FROM shelters WHERE id = ?', [req.params.id]);
    if (!shelter) {
      res.status(404).json({ error: 'Shelter record not found.' });
      return;
    }

    const cap = Number(shelter.capacity);

    if (occ > cap && !allowOverflow) {
      res.status(400).json({
        error: `Occupancy (${occ}) exceeds safe shelter capacity (${cap}). Confirmation override required.`,
        code: 'EXCEEDS_CAPACITY'
      });
      return;
    }

    let newStatus = 'Open';
    if (occ >= cap) newStatus = 'Full';
    else if (occ >= cap * 0.85) newStatus = 'Near Capacity';

    const now = new Date().toISOString();

    await db.run(
      'UPDATE shelters SET current_occupancy = ?, status = ?, updated_at = ? WHERE id = ?',
      [occ, newStatus, now, req.params.id]
    );

    const auditDesc = occ > cap
      ? `Updated shelter ${shelter.name} occupancy to ${occ}/${cap} (OVERFLOW OVERRIDE: ${overrideReason || 'Emergency intake authority authorization'})`
      : `Updated shelter ${shelter.name} occupancy to ${occ}/${cap} (${newStatus})`;

    await recordAuditEvent({
      actor: req.user,
      action: 'shelter_occupancy_updated',
      entityType: 'shelter',
      entityId: String(req.params.id),
      description: auditDesc
    });

    res.json({
      message: occ > cap ? 'Occupancy updated with emergency overflow override' : 'Occupancy updated',
      occupancy: occ,
      capacity: cap,
      status: newStatus,
      isOverflow: occ > cap,
      overrideReason: occ > cap ? (overrideReason || 'Emergency surge protocol authorized') : undefined,
      shelter: {
        id: req.params.id,
        name: shelter.name,
        currentOccupancy: occ,
        capacity: cap,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Update occupancy error:', error);
    res.status(500).json({ error: 'Failed to update shelter occupancy.' });
  }
};

router.put('/:id/occupancy', authenticate, requirePermission('manage_shelters'), handleOccupancyUpdate);
router.post('/:id/occupancy', authenticate, requirePermission('manage_shelters'), handleOccupancyUpdate);

// PUT /api/shelters/:id
router.put('/:id', authenticate, requirePermission('manage_shelters'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT * FROM shelters WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Shelter not found.' });
      return;
    }

    const {
      name = existing.name,
      address = existing.address,
      region = existing.region,
      latitude = existing.latitude,
      longitude = existing.longitude,
      capacity = existing.capacity,
      facilities,
      contactPerson = existing.contact_person,
      contactPhone = existing.contact_phone,
      notes = existing.notes
    } = req.body;

    const facilitiesJson = facilities !== undefined ? JSON.stringify(facilities) : existing.facilities;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE shelters
       SET name = ?, address = ?, region = ?, latitude = ?, longitude = ?, capacity = ?, facilities = ?, contact_person = ?, contact_phone = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        name,
        address,
        region,
        Number(latitude),
        Number(longitude),
        Number(capacity),
        facilitiesJson,
        contactPerson,
        contactPhone,
        notes,
        now,
        req.params.id
      ]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'shelter_updated',
      entityType: 'shelter',
      entityId: String(req.params.id),
      description: `Updated shelter details: ${name}`
    });

    res.json({ message: 'Shelter updated successfully' });
  } catch (error) {
    console.error('Update shelter error:', error);
    res.status(500).json({ error: 'Failed to update shelter.' });
  }
});

// DELETE /api/shelters/:id
router.delete('/:id', authenticate, requirePermission('manage_shelters'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT name FROM shelters WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Shelter not found.' });
      return;
    }

    await db.run('DELETE FROM shelters WHERE id = ?', [req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'shelter_deleted',
      entityType: 'shelter',
      entityId: String(req.params.id),
      description: `Removed shelter: ${existing.name}`
    });

    res.json({ message: 'Shelter removed successfully' });
  } catch (error) {
    console.error('Delete shelter error:', error);
    res.status(500).json({ error: 'Failed to delete shelter.' });
  }
});

export default router;
