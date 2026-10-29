import { Router, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';
import { seedDatabase } from '../scripts/seed.js';
import { DEFAULT_SETTINGS } from '../../src/data/seedData.js';

const router = Router();

// GET /api/settings - Retrieve system settings
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const row = await db.get<{ key: string; value: string; updated_at: string }>(
      'SELECT value, updated_at FROM system_settings WHERE key = ?',
      ['app_settings']
    );

    if (!row) {
      return res.json({
        success: true,
        data: DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString()
      });
    }

    const settings = JSON.parse(row.value);
    res.json({
      success: true,
      data: settings,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
  }
});

// PUT /api/settings - Update system settings
router.put('/', authenticate, requirePermission('change_settings'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const newSettings = req.body;

    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }

    const now = new Date().toISOString();
    await db.run(
      `INSERT OR REPLACE INTO system_settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      ['app_settings', JSON.stringify(newSettings), now]
    );

    await recordAuditEvent({
      userId: user.id,
      userName: user.displayName,
      userRole: user.role,
      action: 'UPDATE_SETTINGS',
      entityType: 'settings',
      entityId: 'app_settings',
      description: `System operational settings modified by ${user.displayName} (${user.role})`,
      metadata: { updatedBy: user.email, timestamp: now }
    });

    res.json({
      success: true,
      message: 'System settings saved successfully',
      data: newSettings,
      updatedAt: now
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update system settings' });
  }
});

// POST /api/settings/reset - Reset system data to default state
router.post('/reset', authenticate, requirePermission('change_settings'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'admin' && user.role !== 'commander') {
      return res.status(403).json({ success: false, error: 'System reset is restricted to Emergency Command or Administrators' });
    }

    await seedDatabase(true);

    await recordAuditEvent({
      userId: user.id,
      userName: user.displayName,
      userRole: user.role,
      action: 'SYSTEM_RESET',
      entityType: 'system',
      entityId: 'database',
      description: `Full system reset performed by ${user.displayName} (${user.role}) to restore initial demo state`,
      metadata: { initiatedBy: user.email, timestamp: new Date().toISOString() }
    });

    res.json({
      success: true,
      message: 'System state successfully reset to initial operational baseline'
    });
  } catch (error) {
    console.error('Settings reset error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset system state' });
  }
});

export default router;

