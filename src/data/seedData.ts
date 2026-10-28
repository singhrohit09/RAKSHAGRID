import { Incident } from '../types/incident';
import { ResponseTeam } from '../types/team';
import { Shelter } from '../types/shelter';
import { ResourceItem } from '../types/resource';
import { IncidentTask } from '../types/task';
import { EmergencyAlert } from '../types/alert';
import { AuditLogEvent } from '../types/audit';
import { AppSettings } from '../types/settings';

import { INITIAL_INCIDENTS } from './mockIncidents';
import { INITIAL_TEAMS } from './mockTeams';
import { INITIAL_SHELTERS } from './mockShelters';
import { INITIAL_RESOURCES } from './mockResources';
import { INITIAL_TASKS } from './mockTasks';
import { INITIAL_ALERTS } from './mockAlerts';
import { INITIAL_AUDIT_LOGS } from './mockAuditLogs';

export const STORAGE_VERSION = 'v1.0';
export const STORAGE_KEY = `rakshagrid_state_${STORAGE_VERSION}`;
export const SETTINGS_KEY = `rakshagrid_settings_${STORAGE_VERSION}`;

export const DEFAULT_SETTINGS: AppSettings = {
  operatingRegion: 'National Capital Riverine District (Demo Sector 4)',
  operationsCenterName: 'RakshaGrid Unified Operations Command EOC',
  timeZone: 'Asia/Kolkata (IST)',
  use24HourFormat: true,
  mapDefaultLat: 28.6139,
  mapDefaultLng: 77.2090,
  mapDefaultZoom: 12,
  mapLayers: {
    showIncidents: true,
    showTeams: true,
    showShelters: true,
    showRiskRadius: true
  },
  demoNotificationsEnabled: true,
  soundAlertsEnabled: false,
  demoModeNoticeDismissed: false,
  simulatedIntegrations: {
    weatherService: 'simulated',
    seismicFeed: 'simulated',
    sirenNetwork: 'simulated',
    capGateway: 'simulated'
  }
};

export interface RakshaDataState {
  incidents: Incident[];
  teams: ResponseTeam[];
  shelters: Shelter[];
  resources: ResourceItem[];
  tasks: IncidentTask[];
  alerts: EmergencyAlert[];
  auditLogs: AuditLogEvent[];
}

export function getInitialDataState(): RakshaDataState {
  return {
    incidents: INITIAL_INCIDENTS,
    teams: INITIAL_TEAMS,
    shelters: INITIAL_SHELTERS,
    resources: INITIAL_RESOURCES,
    tasks: INITIAL_TASKS,
    alerts: INITIAL_ALERTS,
    auditLogs: INITIAL_AUDIT_LOGS
  };
}

