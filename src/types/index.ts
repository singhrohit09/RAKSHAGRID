/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role =
  | 'administrator'
  | 'incident_commander'
  | 'field_responder'
  | 'logistics_officer'
  | 'read_only_analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  agency: string;
  badgeNumber: string;
  avatarUrl?: string;
  phone?: string;
  region?: string;
}

export type DisasterType =
  | 'flood'
  | 'cyclone'
  | 'earthquake'
  | 'landslide'
  | 'wildfire'
  | 'industrial'
  | 'medical'
  | 'tsunami';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus = 'active' | 'investigating' | 'contained' | 'resolved';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  disasterType: DisasterType;
  severity: SeverityLevel;
  location: string;
  region: string;
  coordinates: Coordinates;
  reportedTime: string;
  status: IncidentStatus;
  affectedPopulation: number;
  assignedTeamId?: string;
  assignedTeamName?: string;
  casualties?: {
    injured: number;
    deceased: number;
    rescued: number;
  };
  verified: boolean;
  priorityScore: number; // 1-100
  reportedBy: string;
  lastUpdated: string;
  tags: string[];
}

export type TeamStatus = 'available' | 'deployed' | 'standby' | 'off_duty';

export type TeamSpecialization =
  | 'Search & Rescue'
  | 'Medical Emergency'
  | 'HazMat & Industrial'
  | 'Evacuation & Transit'
  | 'Water Rescue'
  | 'Logistics & Supply';

export interface Team {
  id: string;
  name: string;
  specialization: TeamSpecialization;
  leader: string;
  memberCount: number;
  status: TeamStatus;
  assignedZone: string;
  contactNumber: string;
  activeIncidentId?: string;
  activeIncidentTitle?: string;
  location: Coordinates;
  equipment: string[];
}

export type ShelterStatus = 'open' | 'full' | 'standby' | 'closed';
export type SupplyLevel = 'adequate' | 'moderate' | 'critical';

export interface Shelter {
  id: string;
  name: string;
  location: string;
  region: string;
  coordinates: Coordinates;
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  supplyLevel: SupplyLevel;
  facilities: string[];
  contactPerson: string;
  contactPhone: string;
  openSince: string;
}

export type ResourceCategory =
  | 'medical'
  | 'rescue'
  | 'equipment'
  | 'provisions'
  | 'power_water';

export type ResourceStatus = 'stocked' | 'in_transit' | 'depleted' | 'reserved';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  totalQuantity: number;
  availableQuantity: number;
  unit: string;
  status: ResourceStatus;
  storageLocation: string;
  assignedToTeamId?: string;
  assignedToTeamName?: string;
  lastRestocked: string;
}

export type TaskStatus = 'triage' | 'en_route' | 'on_scene' | 'resolved';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  incidentId: string;
  incidentTitle: string;
  assignedToUserId?: string;
  assignedToUserName: string;
  dueDate: string;
  createdAt: string;
  location: string;
}

export type AlertSeverity = 'emergency' | 'warning' | 'advisory';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  disasterType: DisasterType;
  targetRegion: string;
  issuedAt: string;
  expiresAt: string;
  authorRole: string;
  capStatus: 'Actual' | 'Exercise' | 'Draft';
  broadcastChannels: string[];
  acknowledgedByCommander?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: Role;
    agency: string;
  };
  action: string;
  entityType: 'incident' | 'team' | 'shelter' | 'resource' | 'task' | 'alert' | 'auth' | 'system';
  entityId: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress: string;
}

export * from './ai';
