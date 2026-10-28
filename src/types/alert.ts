export type AlertType = 'Warning' | 'Evacuation Order' | 'Advisory' | 'Watch' | 'All Clear';

export type AlertSeverity = 'Minor' | 'Moderate' | 'Severe' | 'Extreme';

export type AlertStatus = 'Draft' | 'Ready for Review' | 'Approved for Demo' | 'Archived';

export interface AlertDeliveryChannels {
  sms: boolean;
  cellBroadcast: boolean;
  siren: boolean;
  radio: boolean;
  email: boolean;
  publicBulletin: boolean;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  body: string;
  type: AlertType;
  severity: AlertSeverity;
  targetRegion: string;
  relatedIncidentId?: string;
  relatedIncidentTitle?: string;
  safetyActions: string[];
  channels: AlertDeliveryChannels;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

