import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { seedDatabase } from '../scripts/seed.js';
import { NotificationDeduplicator } from '../services/notifications/deduplicator.js';
import { NotificationDispatcher } from '../services/notifications/dispatcher.js';

describe('RakshaGrid Alert & Notification Infrastructure', () => {
  const testAdminPassword = 'NotifAdminPassword#2026!';
  const testResponderPassword = 'NotifResponderPassword#2026!';
  let adminToken = '';
  let responderToken = '';

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_PASSWORD = testAdminPassword;
    process.env.DEV_BOOTSTRAP_PASSWORD = testResponderPassword;
    await seedDatabase(true);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@rakshagrid.gov.in', password: testAdminPassword });
    adminToken = adminLogin.body.token;

    const respLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'responder@rakshagrid.gov.in', password: testResponderPassword });
    responderToken = respLogin.body.token;
  });

  describe('1. Alert Deduplication Engine', () => {
    it('allows initial alert and suppresses duplicate triggers within cooling window', () => {
      const deduplicator = new NotificationDeduplicator(1000); // 1s window for test
      const key = 'zone-flood-01:evacuation';

      // First check: should NOT be duplicate
      expect(deduplicator.isDuplicate(key)).toBe(false);

      // Immediate second check: SHOULD be duplicate
      expect(deduplicator.isDuplicate(key)).toBe(true);

      // Third check: still duplicate
      expect(deduplicator.isDuplicate(key)).toBe(true);
    });

    it('tracks deduplication cache stats accurately', () => {
      const deduplicator = new NotificationDeduplicator();
      deduplicator.isDuplicate('alert-1');
      deduplicator.isDuplicate('alert-2');

      expect(deduplicator.getStats().trackedKeys).toBe(2);
      deduplicator.clear();
      expect(deduplicator.getStats().trackedKeys).toBe(0);
    });
  });

  describe('2. Multichannel Notification Dispatcher', () => {
    it('dispatches to In-App and Simulated Telecomm channels safely', async () => {
      const dispatcher = new NotificationDispatcher();
      const summary = await dispatcher.dispatch({
        title: 'Flash Flood Evacuation Notice',
        message: 'Water levels approaching critical crest at Old Railway Bridge.',
        severity: 'critical',
        channels: ['in_app', 'sms', 'webhook'],
        deduplicationKey: `unique-test-${Date.now()}`
      });

      expect(summary.notificationId).toBeDefined();
      expect(summary.overallStatus).toBe('success');
      expect(summary.results.length).toBe(3);

      const inAppResult = summary.results.find(r => r.channel === 'in_app');
      expect(inAppResult?.status).toBe('delivered');
      expect(inAppResult?.success).toBe(true);

      const smsResult = summary.results.find(r => r.channel === 'sms');
      expect(smsResult?.status).toBe('simulated');
      expect(smsResult?.provider).toContain('Simulated');

      const webhookResult = summary.results.find(r => r.channel === 'webhook');
      expect(webhookResult?.status).toBe('simulated'); // No ALERT_WEBHOOK_URL in test
    });

    it('evaluates geofenced incident alert rules and dispatches critical notification', async () => {
      const dispatcher = new NotificationDispatcher();
      const summary = await dispatcher.evaluateGeofenceIncidentAlert(
        {
          id: 'INC-HIGH-TEST',
          title: 'River Embankment Breach',
          severity: 'Critical',
          locationName: 'Yamuna Floodplain'
        },
        'Yamuna Inundation Zone O'
      );

      expect(summary).not.toBeNull();
      expect(summary?.severity).toBe('critical');
      expect(summary?.title).toContain('EMERGENCY ALERT');
    });
  });

  describe('3. REST Notification Endpoints & RBAC Enforcement', () => {
    it('POST /api/notifications/dispatch - dispatches alert with commander/admin authorization', async () => {
      const res = await request(app)
        .post('/api/notifications/dispatch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Hazard Alert Broadcast',
          message: 'Severe waterlogging reported across South Delhi transit corridors.',
          severity: 'high',
          channels: ['in_app', 'sms'],
          deduplicationKey: `api-test-${Date.now()}`
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.results.length).toBe(2);
    });

    it('POST /api/notifications/dispatch - rejects unauthorized roles (responder) with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/notifications/dispatch')
        .set('Authorization', `Bearer ${responderToken}`)
        .send({
          title: 'Unauthorized Public Alert',
          message: 'Trying to broadcast without permission.',
          severity: 'critical',
          channels: ['sms']
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/notifications/dispatch - rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/notifications/dispatch')
        .send({
          title: 'Unauthenticated Alert',
          message: 'No auth token provided.',
          channels: ['in_app']
        });

      expect(res.status).toBe(401);
    });

    it('GET /api/notifications/deliveries - retrieves delivery audit records', async () => {
      const res = await request(app)
        .get('/api/notifications/deliveries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const firstRecord = res.body.data[0];
      expect(firstRecord.channel).toBeDefined();
      expect(firstRecord.delivery_status).toBeDefined();
      expect(firstRecord.provider).toBeDefined();
    });
  });
});
