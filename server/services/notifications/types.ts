/**
 * Multichannel Notification & Alert Architecture Types
 * Phase 3: In-App, Telecommunication Adapters & Delivery Tracking
 */

export type NotificationChannel = 'in_app' | 'webhook' | 'sms' | 'email';
export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DeliveryStatus = 'delivered' | 'simulated' | 'queued' | 'failed' | 'suppressed_duplicate';

export interface OutgoingNotification {
  id?: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
  targetRecipient?: string;
  incidentId?: string;
  geofenceId?: string;
  affectedRegion?: string;
  recommendedAction?: string;
  deduplicationKey?: string;
}

export interface ChannelDeliveryResult {
  channel: NotificationChannel;
  provider: string;
  status: DeliveryStatus;
  success: boolean;
  deliveredAt: string;
  error?: string;
}

export interface NotificationDispatchSummary {
  notificationId: string;
  title: string;
  severity: NotificationSeverity;
  channelsRequested: NotificationChannel[];
  results: ChannelDeliveryResult[];
  overallStatus: 'success' | 'partial' | 'failed' | 'suppressed';
}

export interface NotificationDeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  provider: string;
  deliveryStatus: DeliveryStatus;
  attempts: number;
  errorDetails?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  providerName: string;
  isSimulated: boolean;
  send(notification: OutgoingNotification): Promise<ChannelDeliveryResult>;
}
