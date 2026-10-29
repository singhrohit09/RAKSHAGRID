import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { signSessionToken } from '../auth/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { recordAuditEvent } from '../middleware/audit.js';
import { PersonaId } from '../../src/types/role.js';
import { SERVER_PERMISSIONS } from '../auth/roles.js';
import { 
  isPasswordStrong, 
  generateCryptographicToken, 
  hashToken 
} from '../config/security.js';
import { 
  authRateLimiter, 
  passwordResetRateLimiter 
} from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/register (Privilege Escalation Protected)
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role: requestedRole, department = '', callsign = '' } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required.' });
      return;
    }

    // PRIVILEGE ESCALATION GUARD: Public registration cannot self-assign privileged roles
    if (requestedRole && requestedRole !== 'responder' && requestedRole !== 'analyst') {
      res.status(403).json({
        error: 'Privilege escalation rejected: Administrative or command roles cannot be self-assigned via public registration.'
      });
      return;
    }

    const assignedRole: PersonaId = requestedRole || 'responder';

    // Password strength verification
    const passCheck = isPasswordStrong(password);
    if (!passCheck.valid) {
      res.status(400).json({ error: passCheck.reason });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
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
      [userId, cleanEmail, passwordHash, displayName.trim(), assignedRole, department.trim(), callsign.trim(), now, now]
    );

    const sessionPayload = {
      id: userId,
      userId,
      email: cleanEmail,
      displayName: displayName.trim(),
      role: assignedRole,
      department: department.trim(),
      callsign: callsign.trim()
    };

    const token = signSessionToken(sessionPayload);

    // Set HttpOnly cookie with secure parameters
    res.cookie('raksha_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    await recordAuditEvent({
      actor: sessionPayload,
      action: 'user_registered',
      entityType: 'user',
      entityId: userId,
      description: `Registered user account ${displayName} (${assignedRole})`
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
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get<any>('SELECT * FROM users WHERE email = ?', [cleanEmail]);
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
      path: '/',
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

  res.clearCookie('raksha_session', { path: '/' });
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

// POST /api/auth/forgot-password (Tokenized Recovery Request)
router.post('/forgot-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get<any>('SELECT id, display_name FROM users WHERE email = ?', [cleanEmail]);

    // Constant-time behavior: Always respond with success to prevent account enumeration
    if (!user) {
      res.json({ message: 'If an account exists with this email address, password reset instructions have been issued.' });
      return;
    }

    // Clean up expired tokens for this user
    const now = new Date().toISOString();
    await db.run('DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < ?', [user.id, now]);

    // Generate high-entropy 256-bit token
    const rawToken = generateCryptographicToken(32);
    const tokenHash = hashToken(rawToken);
    const tokenId = `RST-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    await db.run(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [tokenId, user.id, tokenHash, expiresAt, now]
    );

    await recordAuditEvent({
      action: 'password_reset_requested',
      entityType: 'user',
      entityId: user.id,
      description: `Password recovery token requested for ${user.display_name}`
    });

    const isNonProduction = process.env.NODE_ENV !== 'production';

    res.json({
      message: 'If an account exists with this email address, password reset instructions have been issued.',
      // In development/test mode only, return token for developer evaluation
      ...(isNonProduction ? { resetToken: rawToken, note: 'Dev-only: In production, token is transmitted via external delivery boundary.' } : {})
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// POST /api/auth/reset-password (Tokenized Verification & Password Reset)
router.post('/reset-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Reset token and new password are required.' });
      return;
    }

    const strength = isPasswordStrong(newPassword);
    if (!strength.valid) {
      res.status(400).json({ error: strength.reason });
      return;
    }

    const tokenHash = hashToken(token.trim());
    const now = new Date().toISOString();

    const resetRecord = await db.get<{ id: string; user_id: string; expires_at: string }>(
      'SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?',
      [tokenHash, now]
    );

    if (!resetRecord) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.transaction(async () => {
      // Update password
      await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, now, resetRecord.user_id]);
      // Consume and invalidate token
      await db.run('DELETE FROM password_reset_tokens WHERE user_id = ?', [resetRecord.user_id]);
    });

    await recordAuditEvent({
      action: 'password_reset_completed',
      entityType: 'user',
      entityId: resetRecord.user_id,
      description: 'Password reset completed successfully using verified one-time token.'
    });

    res.json({ message: 'Password has been successfully updated. You may now log in with your new credentials.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/auth/change-password (Authenticated User Password Update)
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    const user = await db.get<any>('SELECT password_hash FROM users WHERE id = ?', [req.user!.userId]);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Current password does not match.' });
      return;
    }

    const strength = isPasswordStrong(newPassword);
    if (!strength.valid) {
      res.status(400).json({ error: strength.reason });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    const now = new Date().toISOString();

    await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, now, req.user!.userId]);

    await recordAuditEvent({
      actor: req.user,
      action: 'password_changed',
      entityType: 'user',
      entityId: req.user!.userId,
      description: `User ${req.user!.displayName} changed their password.`
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// PUT /api/auth/users/:id/role (Administrator Only Role Modification)
router.put('/users/:id/role', authenticate, requirePermission('change_settings'), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles: PersonaId[] = ['admin', 'commander', 'responder', 'logistics', 'analyst'];

    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const targetUser = await db.get<any>('SELECT id, display_name, email, role FROM users WHERE id = ?', [req.params.id]);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const now = new Date().toISOString();
    await db.run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, req.params.id]);

    await recordAuditEvent({
      actor: req.user,
      action: 'role_modified',
      entityType: 'user',
      entityId: String(req.params.id),
      description: `Administrator ${req.user!.displayName} changed role for ${targetUser.display_name} from ${targetUser.role} to ${role}`
    });

    res.json({
      message: 'User role updated successfully.',
      userId: req.params.id,
      newRole: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

export default router;
