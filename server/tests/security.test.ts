import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { seedDatabase } from '../scripts/seed.js';
import { 
  getValidatedJwtSecret, 
  resetJwtSecretCacheForTesting, 
  isPasswordStrong, 
  generateSecurePassword, 
  generateCryptographicToken 
} from '../config/security.js';
import { bootstrapAdmin } from '../scripts/bootstrap-admin.js';

describe('RakshaGrid Security Hardening & Regression Suite', () => {
  const testAdminPassword = 'AdminSecureSecret#2026!';
  const testResponderPassword = 'ResponderSecureSecret#2026!';
  let adminToken = '';
  let responderToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = testAdminPassword;
    process.env.DEV_BOOTSTRAP_PASSWORD = testResponderPassword;
    await seedDatabase(true);

    // Obtain admin token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@rakshagrid.gov.in', password: testAdminPassword });
    adminToken = adminLogin.body.token;

    // Obtain responder token
    const respLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'responder@rakshagrid.gov.in', password: testResponderPassword });
    responderToken = respLogin.body.token;
  });

  describe('1. Privilege Escalation Guard & Registration Policies', () => {
    it('rejects public registration attempts claiming administrator role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `attacker_admin_${Date.now()}@example.com`,
          password: 'StrongAttackerPassword#2026',
          displayName: 'Rogue Admin Attempt',
          role: 'admin' // Attempted privilege escalation
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Privilege escalation rejected');
    });

    it('rejects public registration attempts claiming commander role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `attacker_cmdr_${Date.now()}@example.com`,
          password: 'StrongAttackerPassword#2026',
          displayName: 'Rogue Commander Attempt',
          role: 'commander'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Privilege escalation rejected');
    });

    it('rejects registration with weak passwords (under 10 chars or missing classes)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `weak_${Date.now()}@example.com`,
          password: 'weak', // under 10 chars
          displayName: 'Weak Password User',
          role: 'responder'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('10 characters');
    });

    it('allows administrator to elevate or modify user roles via authenticated endpoint', async () => {
      // First register a valid responder
      const userEmail = `promoted_${Date.now()}@example.com`;
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: userEmail,
          password: 'ValidResponderPassword#2026',
          displayName: 'Candidate For Promotion',
          role: 'responder'
        });
      expect(reg.status).toBe(201);
      const newUserId = reg.body.user.id;

      // Admin updates role
      const res = await request(app)
        .put(`/api/auth/users/${newUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'logistics' });

      expect(res.status).toBe(200);
      expect(res.body.newRole).toBe('logistics');
    });

    it('forbids non-administrators from modifying user roles', async () => {
      const res = await request(app)
        .put('/api/auth/users/USR-RESP-03/role')
        .set('Authorization', `Bearer ${responderToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Cryptographic Secret Validation & Production Safety', () => {
    it('fails safely in production if JWT_SECRET is missing or too short', () => {
      const prevEnv = process.env.NODE_ENV;
      const prevSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'short';
        resetJwtSecretCacheForTesting();

        expect(() => getValidatedJwtSecret()).toThrow(/at least 32 characters/);

        delete process.env.JWT_SECRET;
        resetJwtSecretCacheForTesting();
        expect(() => getValidatedJwtSecret()).toThrow(/JWT_SECRET environment variable is missing/);
      } finally {
        process.env.NODE_ENV = prevEnv;
        process.env.JWT_SECRET = prevSecret;
        resetJwtSecretCacheForTesting();
      }
    });

    it('fails safely in production if JWT_SECRET is a known insecure placeholder', () => {
      const prevEnv = process.env.NODE_ENV;
      const prevSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'rakshagrid-dev-secret-key-change-in-production-2026';
        resetJwtSecretCacheForTesting();

        expect(() => getValidatedJwtSecret()).toThrow(/compromised or placeholder default/);
      } finally {
        process.env.NODE_ENV = prevEnv;
        process.env.JWT_SECRET = prevSecret;
        resetJwtSecretCacheForTesting();
      }
    });

    it('generates high-entropy passwords meeting all complexity requirements', () => {
      for (let i = 0; i < 5; i++) {
        const pwd = generateSecurePassword(16);
        expect(pwd.length).toBe(16);
        const check = isPasswordStrong(pwd);
        expect(check.valid).toBe(true);
      }
    });
  });

  describe('3. First-Administrator Provisioning Utility', () => {
    it('provisions administrator safely with strong password validation', async () => {
      const testEmail = `bootstrap_test_${Date.now()}@example.com`;
      const result = await bootstrapAdmin({
        email: testEmail,
        password: 'ValidBootstrapAdminPass#2026',
        force: true
      });
      expect(result.email).toBe(testEmail);
    });

    it('rejects weak bootstrap password attempts', async () => {
      await expect(
        bootstrapAdmin({
          email: 'weakadmin@example.com',
          password: 'weak',
          force: true
        })
      ).rejects.toThrow(/Insecure bootstrap password/);
    });
  });

  describe('4. Tokenized Password Recovery Security', () => {
    it('rejects unauthenticated password reset attempts without token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'admin@rakshagrid.gov.in',
          newPassword: 'HackedPassword#2026!'
        });

      // Token is mandatory
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Reset token and new password are required');
    });

    it('rejects password reset with invalid or fabricated token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: generateCryptographicToken(32),
          newPassword: 'ValidNewPassword#2026!'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired password reset token');
    });

    it('completes end-to-end tokenized password reset flow securely', async () => {
      // 0. Register a dedicated test user for password reset
      const targetEmail = `reset_target_${Date.now()}@example.com`;
      const initialPassword = 'InitialTargetPassword#2026!';
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: targetEmail,
          password: initialPassword,
          displayName: 'Reset Target User',
          role: 'responder'
        });
      expect(regRes.status).toBe(201);

      // 1. Request reset token
      const reqRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: targetEmail });

      expect(reqRes.status).toBe(200);
      expect(reqRes.body.resetToken).toBeDefined();

      const resetToken = reqRes.body.resetToken;
      const updatedPassword = 'NewSecurePassword#2026!';

      // 2. Consume reset token with strong new password
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: updatedPassword
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('successfully updated');

      // 3. Verify old password no longer works
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: targetEmail, password: initialPassword });
      expect(oldLogin.status).toBe(401);

      // 4. Verify new password works
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: targetEmail, password: updatedPassword });
      expect(newLogin.status).toBe(200);

      // 5. Verify the one-time token cannot be reused
      const reuseAttempt = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword#2026!'
        });
      expect(reuseAttempt.status).toBe(400);
    });
  });

  describe('5. CORS & CSRF Hardening', () => {
    it('blocks credentialed requests from unapproved third-party origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-threat-actor.com');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('CORS blocked');
    });

    it('allows requests from approved development origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(200);
    });

    it('blocks CSRF mutation when ambient cookie is used from an unauthorized origin', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Cookie', `raksha_session=${adminToken}`)
        .set('Origin', 'https://evil-cross-site-tracker.com')
        .send({ title: 'Cross site incident' });

      // Either CORS blocks it or CSRF middleware blocks it
      expect([403]).toContain(res.status);
    });
  });

  describe('6. Authentication Rate Limiting', () => {
    it('enforces rate limiting on repeated authentication attempts when header is active', async () => {
      const attempts = [];
      for (let i = 0; i < 12; i++) {
        attempts.push(
          await request(app)
            .post('/api/auth/login')
            .set('X-Test-Rate-Limit', 'true')
            .send({ email: 'nonexistent@example.com', password: 'BadPassword#123' })
        );
      }

      const rateLimited = attempts.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
