import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';

const router = Router();

// GET /api/resources
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, status, search } = req.query;

    let sql = 'SELECT * FROM resources WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string') {
      sql += ' AND (name LIKE ? OR storage_location LIKE ? OR id LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY name ASC';

    const rows = await db.query(sql, params);

    const formatted = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantityAvailable: Number(r.quantity_available),
      quantityAllocated: Number(r.quantity_allocated),
      unit: r.unit,
      storageLocation: r.storage_location,
      minThreshold: Number(r.min_threshold),
      status: r.status,
      updatedAt: r.updated_at
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch resources error:', error);
    res.status(500).json({ error: 'Failed to retrieve resources.' });
  }
});

// POST /api/resources
router.post('/', authenticate, requirePermission('manage_resources'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      category = 'food_water',
      quantityAvailable = 0,
      quantityAllocated = 0,
      unit = 'units',
      storageLocation = 'Central Relief Depot',
      minThreshold = 50
    } = req.body;

    if (!name || !storageLocation) {
      res.status(400).json({ error: 'Resource name and storage location are required.' });
      return;
    }

    const avail = Math.max(0, Number(quantityAvailable));
    const alloc = Math.max(0, Number(quantityAllocated));
    const thresh = Math.max(1, Number(minThreshold));

    let status = 'Sufficient';
    if (avail === 0) status = 'Depleted';
    else if (avail <= thresh * 0.5) status = 'Critical';
    else if (avail <= thresh) status = 'Low Stock';

    const resId = `RES-${category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO resources (id, name, category, quantity_available, quantity_allocated, unit, storage_location, min_threshold, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resId, name.trim(), category, avail, alloc, unit.trim(), storageLocation.trim(), thresh, status, now]
    );

    await recordAuditEvent({
      actor: req.user,
      action: 'resource_created',
      entityType: 'resource',
      entityId: resId,
      description: `Added inventory item: ${name} (${avail} ${unit})`
    });

    res.status(201).json({ message: 'Resource item created', id: resId });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Failed to create resource item.' });
  }
});

// POST /api/resources/:id/allocate (Prevents Negative Inventory)
router.post('/:id/allocate', authenticate, requirePermission('manage_resources'), async (req: Request, res: Response) => {
  try {
    const { note = '' } = req.body;
    const amount = Number(req.body.quantity ?? req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'Allocation quantity must be greater than zero.' });
      return;
    }

    let updatedItem: any = null;

    await db.transaction(async () => {
      const item = await db.get('SELECT * FROM resources WHERE id = ?', [req.params.id]);
      if (!item) {
        throw new Error('NOT_FOUND: Resource item not found.');
      }

      const available = Number(item.quantity_available);
      if (amount > available) {
        throw new Error(`INSUFFICIENT_STOCK: Requested allocation (${amount} ${item.unit}) exceeds available stock (${available} ${item.unit}). Negative inventory is prohibited.`);
      }

      const newAvailable = available - amount;
      const newAllocated = Number(item.quantity_allocated) + amount;
      const thresh = Number(item.min_threshold);

      let newStatus = 'Sufficient';
      if (newAvailable === 0) newStatus = 'Depleted';
      else if (newAvailable <= thresh * 0.5) newStatus = 'Critical';
      else if (newAvailable <= thresh) newStatus = 'Low Stock';

      const now = new Date().toISOString();

      await db.run(
        'UPDATE resources SET quantity_available = ?, quantity_allocated = ?, status = ?, updated_at = ? WHERE id = ?',
        [newAvailable, newAllocated, newStatus, now, req.params.id]
      );

      // Record movement ledger
      const movementId = `MOV-${Date.now()}`;
      await db.run(
        `INSERT INTO inventory_movements (id, resource_id, movement_type, quantity, previous_available, new_available, actor_id, note, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movementId, req.params.id, 'ALLOCATE', amount, available, newAvailable, req.user!.userId, note, now]
      );

      updatedItem = {
        id: item.id,
        name: item.name,
        quantityAvailable: newAvailable,
        quantityAllocated: newAllocated,
        status: newStatus,
        unit: item.unit
      };
    });

    await recordAuditEvent({
      actor: req.user,
      action: 'resource_allocated',
      entityType: 'resource',
      entityId: String(req.params.id),
      description: `Allocated ${amount} ${updatedItem.unit} of ${updatedItem.name}. Remaining available: ${updatedItem.quantityAvailable}. ${note}`
    });

    res.json({
      message: 'Resource allocated successfully',
      resource: updatedItem
    });
  } catch (error: any) {
    if (error.message.startsWith('NOT_FOUND')) {
      res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    } else if (error.message.startsWith('INSUFFICIENT_STOCK')) {
      res.status(400).json({ error: error.message.replace('INSUFFICIENT_STOCK: ', ''), code: 'INSUFFICIENT_STOCK' });
    } else {
      console.error('Resource allocation error:', error);
      res.status(500).json({ error: 'Failed to allocate resource.' });
    }
  }
});

// POST /api/resources/:id/release
router.post('/:id/release', authenticate, requirePermission('manage_resources'), async (req: Request, res: Response) => {
  try {
    const { note = '' } = req.body;
    const amount = Number(req.body.quantity ?? req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'Release quantity must be greater than zero.' });
      return;
    }

    let updatedItem: any = null;

    await db.transaction(async () => {
      const item = await db.get('SELECT * FROM resources WHERE id = ?', [req.params.id]);
      if (!item) {
        throw new Error('NOT_FOUND: Resource item not found.');
      }

      const allocated = Number(item.quantity_allocated);
      if (amount > allocated) {
        throw new Error(`OVER_RELEASE: Cannot release more than currently allocated (${allocated} ${item.unit}). Requested: ${amount} ${item.unit}.`);
      }

      const available = Number(item.quantity_available);
      const newAvailable = available + amount;
      const newAllocated = allocated - amount;
      const thresh = Number(item.min_threshold);

      let newStatus = 'Sufficient';
      if (newAvailable === 0) newStatus = 'Depleted';
      else if (newAvailable <= thresh * 0.5) newStatus = 'Critical';
      else if (newAvailable <= thresh) newStatus = 'Low Stock';

      const now = new Date().toISOString();

      await db.run(
        'UPDATE resources SET quantity_available = ?, quantity_allocated = ?, status = ?, updated_at = ? WHERE id = ?',
        [newAvailable, newAllocated, newStatus, now, req.params.id]
      );

      const movementId = `MOV-${Date.now()}`;
      await db.run(
        `INSERT INTO inventory_movements (id, resource_id, movement_type, quantity, previous_available, new_available, actor_id, note, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movementId, req.params.id, 'RELEASE', amount, available, newAvailable, req.user!.userId, note, now]
      );

      updatedItem = {
        id: item.id,
        name: item.name,
        quantityAvailable: newAvailable,
        quantityAllocated: newAllocated,
        status: newStatus,
        unit: item.unit
      };
    });

    await recordAuditEvent({
      actor: req.user,
      action: 'resource_released',
      entityType: 'resource',
      entityId: String(req.params.id),
      description: `Released ${amount} ${updatedItem.unit} of ${updatedItem.name} back to depot stock.`
    });

    res.json({
      message: 'Resource released back to available stock',
      resource: updatedItem
    });
  } catch (error: any) {
    if (error.message.startsWith('NOT_FOUND')) {
      res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    } else if (error.message.startsWith('OVER_RELEASE')) {
      res.status(400).json({ error: error.message.replace('OVER_RELEASE: ', '') });
    } else {
      console.error('Resource release error:', error);
      res.status(500).json({ error: 'Failed to release resource.' });
    }
  }
});

// DELETE /api/resources/:id
router.delete('/:id', authenticate, requirePermission('manage_resources'), async (req: Request, res: Response) => {
  try {
    const existing = await db.get('SELECT name FROM resources WHERE id = ?', [req.params.id]);
    if (!existing) {
      res.status(404).json({ error: 'Resource item not found.' });
      return;
    }

    await db.run('DELETE FROM resources WHERE id = ?', [req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'resource_deleted',
      entityType: 'resource',
      entityId: String(req.params.id),
      description: `Removed resource item: ${existing.name}`
    });

    res.json({ message: 'Resource item removed successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource item.' });
  }
});

export default router;
