import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { signSessionToken } from '../auth/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { recordAuditEvent } from '../middleware/audit.js';
import { PersonaId } from '../../src/types/role.js';
import { SERVER_PERMISSIONS } from '../auth/roles.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role = 'responder', department = '', callsign = '' } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `USR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO users (id, email, password_hash, display_name, role, department, callsign, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email.toLowerCase().trim(), passwordHash, displayName.trim(), role, department.trim(), callsign.trim(), now, now]
    );

    const sessionPayload = {
      id: userId,
      userId,
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role: role as PersonaId,
      department: department.trim(),
      callsign: callsign.trim()
    };

    const token = signSessionToken(sessionPayload);

    // Set HttpOnly cookie
    res.cookie('raksha_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    await recordAuditEvent({
      actor: sessionPayload,
      action: 'user_registered',
      entityType: 'user',
      entityId: userId,
      description: `Registered user ${displayName} (${role})`
    });

    res.status(201).json({
      message: 'Registration successful',
      user: sessionPayload,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.get<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or credentials.' });
      return;
    }

    const sessionPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role as PersonaId,
      department: user.department || '',
      callsign: user.callsign || ''
    };

    const token = signSessionToken(sessionPayload);

    res.cookie('raksha_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    await recordAuditEvent({
      actor: sessionPayload,
      action: 'user_login',
      entityType: 'user',
      entityId: user.id,
      description: `User ${user.display_name} logged into operations console.`
    });

    res.json({
      message: 'Login successful',
      user: sessionPayload,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  if (req.user) {
    await recordAuditEvent({
      actor: req.user,
      action: 'user_logout',
      entityType: 'user',
      entityId: req.user.userId,
      description: `User ${req.user.displayName} logged out.`
    });
  }

  res.clearCookie('raksha_session');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await db.get<any>(
    'SELECT id, email, display_name, role, department, callsign, created_at FROM users WHERE id = ?',
    [req.user!.userId]
  );

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      department: user.department,
      callsign: user.callsign,
      createdAt: user.created_at
    },
    permissions: SERVER_PERMISSIONS[user.role as PersonaId] || []
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ error: 'Email and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const user = await db.get<any>('SELECT id, display_name, role FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      // Avoid revealing user existence in production
      res.json({ message: 'If the email exists, password has been updated.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hash, new Date().toISOString(), user.id]);

    await recordAuditEvent({
      action: 'password_reset',
      entityType: 'user',
      entityId: user.id,
      description: `Password reset performed for user account: ${user.display_name}`
    });

    res.json({ message: 'Password has been successfully updated. You may now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

export default router;
