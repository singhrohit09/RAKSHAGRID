import { db } from '../../db/connection.js';
import { 
  OutgoingNotification, 
  NotificationDispatchSummary, 
  ChannelDeliveryResult,
  NotificationProvider 
} from './types.js';
import { 
  InAppNotificationProvider, 
  WebhookNotificationProvider, 
  SimulatedTelecommProvider 
} from './providers.js';
import { notificationDeduplicator } from './deduplicator.js';

export class NotificationDispatcher {
  private providers = new Map<string, NotificationProvider>();

  constructor() {
    this.registerProvider(new InAppNotificationProvider());
    this.registerProvider(new WebhookNotificationProvider());
    this.registerProvider(new SimulatedTelecommProvider());
  }

  public registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  /**
   * Dispatches an emergency notification across requested channels with deduplication and delivery persistence.
   */
  public async dispatch(notification: OutgoingNotification): Promise<NotificationDispatchSummary> {
    const notificationId = notification.id || `ALERT-DISPATCH-${Date.now().toString().slice(-6)}`;
    const dedupeKey = notification.deduplicationKey || `${notification.incidentId || notification.geofenceId || 'global'}:${notification.title}`;

    // 1. Check deduplication
    if (notificationDeduplicator.isDuplicate(dedupeKey)) {
      return {
        notificationId,
        title: notification.title,
        severity: notification.severity,
        channelsRequested: notification.channels,
        results: notification.channels.map(ch => ({
          channel: ch,
          provider: this.providers.get(ch)?.providerName || 'Unknown Provider',
          status: 'suppressed_duplicate',
          success: false,
          deliveredAt: new Date().toISOString(),
          error: 'Suppressed duplicate alert within cooling period.'
        })),
        overallStatus: 'suppressed'
      };
    }

    // 2. Dispatch to each requested channel
    const results: ChannelDeliveryResult[] = [];
    const now = new Date().toISOString();

    for (const channel of notification.channels) {
      const provider = this.providers.get(channel);
      if (!provider) {
        results.push({
          channel,
          provider: 'Unregistered Provider',
          status: 'failed',
          success: false,
          deliveredAt: now,
          error: `No provider registered for channel '${channel}'`
        });
        continue;
      }

      try {
        const result = await provider.send({ ...notification, id: notificationId });
        results.push(result);

        // 3. Persist delivery record for accountability
        await this.persistDeliveryRecord(notificationId, notification, result);
      } catch (err: any) {
        const failedResult: ChannelDeliveryResult = {
          channel,
          provider: provider.providerName,
          status: 'failed',
          success: false,
          deliveredAt: now,
          error: err.message
        };
        results.push(failedResult);
        await this.persistDeliveryRecord(notificationId, notification, failedResult);
      }
    }

    const allSuccessful = results.every(r => r.success);
    const someSuccessful = results.some(r => r.success);

    return {
      notificationId,
      title: notification.title,
      severity: notification.severity,
      channelsRequested: notification.channels,
      results,
      overallStatus: allSuccessful ? 'success' : (someSuccessful ? 'partial' : 'failed')
    };
  }

  private async persistDeliveryRecord(notificationId: string, notification: OutgoingNotification, result: ChannelDeliveryResult): Promise<void> {
    try {
      const recordId = `DELIV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      await db.run(
        `INSERT INTO notification_deliveries (id, notification_id, channel, recipient, severity, title, message, provider, delivery_status, attempts, error_details, created_at, delivered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          recordId,
          notificationId,
          result.channel,
          notification.targetRecipient || 'Broadcast',
          notification.severity,
          notification.title,
          notification.message,
          result.provider,
          result.status,
          result.error || null,
          new Date().toISOString(),
          result.deliveredAt
        ]
      );
    } catch {
      // Non-fatal if delivery table insertion fails in test or disconnected state
    }
  }

  /**
   * Automatically evaluates whether an incident inside a geofenced risk zone requires an immediate alert broadcast.
   */
  public async evaluateGeofenceIncidentAlert(
    incident: { id: string; title: string; severity: string; locationName: string },
    zoneName: string
  ): Promise<NotificationDispatchSummary | null> {
    if (incident.severity !== 'Critical' && incident.severity !== 'High') {
      return null;
    }

    const title = `EMERGENCY ALERT: Hazard Contained in ${zoneName}`;
    const message = `Incident "${incident.title}" (${incident.severity}) has been confirmed inside active hazard perimeter: ${zoneName}. Prepare tactical deployment and evacuation protocols.`;

    return this.dispatch({
      title,
      message,
      severity: incident.severity === 'Critical' ? 'critical' : 'high',
      channels: ['in_app', 'sms'],
      incidentId: incident.id,
      affectedRegion: zoneName,
      recommendedAction: 'Verify perimeter cordon and notify nearest response units.'
    });
  }
}

export const notificationDispatcher = new NotificationDispatcher();
