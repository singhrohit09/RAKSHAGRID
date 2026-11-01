/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Incident, Team, Shelter, Resource, Task, Alert, AuditEvent, User } from '../types';
import {
  INITIAL_INCIDENTS,
  INITIAL_TEAMS,
  INITIAL_SHELTERS,
  INITIAL_RESOURCES,
  INITIAL_TASKS,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
} from './mockData';
import { realtimeService } from './realtime/realtime.service';

const STORAGE_KEYS = {
  INCIDENTS: 'rakshagrid_incidents_v1',
  TEAMS: 'rakshagrid_teams_v1',
  SHELTERS: 'rakshagrid_shelters_v1',
  RESOURCES: 'rakshagrid_resources_v1',
  TASKS: 'rakshagrid_tasks_v1',
  ALERTS: 'rakshagrid_alerts_v1',
  AUDIT: 'rakshagrid_audit_v1',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Error reading ${key} from storage, using initial fallback`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage`, err);
  }
}

export const DataService = {
  // --- INCIDENTS ---
  getIncidents(): Incident[] {
    return getStored<Incident[]>(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
  },

  getIncidentById(id: string): Incident | undefined {
    const incidents = this.getIncidents();
    return incidents.find((inc) => inc.id === id);
  },

  createIncident(incidentData: Omit<Incident, 'id' | 'reportedTime' | 'lastUpdated'>, currentUser?: User): Incident {
    const incidents = this.getIncidents();
    const newId = `INC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const now = new Date().toISOString();

    const newIncident: Incident = {
      ...incidentData,
      id: newId,
      reportedTime: now,
      lastUpdated: now,
      priorityScore: incidentData.priorityScore || (incidentData.severity === 'critical' ? 90 : incidentData.severity === 'high' ? 75 : 50),
      verified: incidentData.verified ?? true,
      tags: incidentData.tags || [],
    };

    const updated = [newIncident, ...incidents];
    setStored(STORAGE_KEYS.INCIDENTS, updated);
    realtimeService.broadcastLocalChange('incidents', 'INSERT', newIncident);

    // Audit log
    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'CREATE_INCIDENT',
        entityType: 'incident',
        entityId: newId,
        details: `Reported new incident: "${newIncident.title}" in ${newIncident.location} (${newIncident.severity.toUpperCase()})`,
        severity: newIncident.severity === 'critical' ? 'critical' : 'info',
      });
    }

    return newIncident;
  },

  updateIncident(id: string, updates: Partial<Incident>, currentUser?: User): Incident | null {
    const incidents = this.getIncidents();
    const index = incidents.findIndex((inc) => inc.id === id);
    if (index === -1) return null;

    const oldIncident = { ...incidents[index] };
    const updatedIncident: Incident = {
      ...incidents[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    incidents[index] = updatedIncident;
    setStored(STORAGE_KEYS.INCIDENTS, incidents);
    realtimeService.broadcastLocalChange('incidents', 'UPDATE', updatedIncident, oldIncident);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'UPDATE_INCIDENT',
        entityType: 'incident',
        entityId: id,
        details: `Updated incident "${updatedIncident.title}" - Status: ${updatedIncident.status}, Severity: ${updatedIncident.severity}`,
        severity: 'info',
      });
    }

    return updatedIncident;
  },

  deleteIncident(id: string, currentUser?: User): boolean {
    const incidents = this.getIncidents();
    const target = incidents.find((i) => i.id === id);
    if (!target) return false;

    const filtered = incidents.filter((i) => i.id !== id);
    setStored(STORAGE_KEYS.INCIDENTS, filtered);
    realtimeService.broadcastLocalChange('incidents', 'DELETE', target);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'DELETE_INCIDENT',
        entityType: 'incident',
        entityId: id,
        details: `Deleted incident record: "${target.title}"`,
        severity: 'warning',
      });
    }

    return true;
  },

  // --- TEAMS ---
  getTeams(): Team[] {
    return getStored<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  },

  updateTeamStatus(teamId: string, status: Team['status'], incidentId?: string, incidentTitle?: string, currentUser?: User): Team | null {
    const teams = this.getTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index === -1) return null;

    const updatedTeam: Team = {
      ...teams[index],
      status,
      activeIncidentId: status === 'deployed' ? incidentId : undefined,
      activeIncidentTitle: status === 'deployed' ? incidentTitle : undefined,
    };

    teams[index] = updatedTeam;
    setStored(STORAGE_KEYS.TEAMS, teams);
    realtimeService.broadcastLocalChange('teams', 'UPDATE', updatedTeam);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'DISPATCH_TEAM',
        entityType: 'team',
        entityId: teamId,
        details: `Changed team "${updatedTeam.name}" status to ${status.toUpperCase()}${incidentTitle ? ` on "${incidentTitle}"` : ''}`,
        severity: status === 'deployed' ? 'warning' : 'info',
      });
    }

    return updatedTeam;
  },

  // --- SHELTERS ---
  getShelters(): Shelter[] {
    return getStored<Shelter[]>(STORAGE_KEYS.SHELTERS, INITIAL_SHELTERS);
  },

  updateShelterOccupancy(shelterId: string, occupancy: number, currentUser?: User): Shelter | null {
    const shelters = this.getShelters();
    const index = shelters.findIndex((s) => s.id === shelterId);
    if (index === -1) return null;

    const shelter = shelters[index];
    const newOccupancy = Math.max(0, Math.min(shelter.capacity, occupancy));
    const newStatus: Shelter['status'] = newOccupancy >= shelter.capacity ? 'full' : shelter.status === 'closed' ? 'closed' : 'open';

    const updatedShelter: Shelter = {
      ...shelter,
      currentOccupancy: newOccupancy,
      status: newStatus,
    };

    shelters[index] = updatedShelter;
    setStored(STORAGE_KEYS.SHELTERS, shelters);
    realtimeService.broadcastLocalChange('shelters', 'UPDATE', updatedShelter);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'UPDATE_SHELTER',
        entityType: 'shelter',
        entityId: shelterId,
        details: `Updated shelter "${shelter.name}" occupancy to ${newOccupancy}/${shelter.capacity} (${newStatus})`,
        severity: newStatus === 'full' ? 'warning' : 'info',
      });
    }

    return updatedShelter;
  },

  // --- RESOURCES ---
  getResources(): Resource[] {
    return getStored<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
  },

  allocateResource(resourceId: string, quantity: number, teamName: string, currentUser?: User): Resource | null {
    const resources = this.getResources();
    const index = resources.findIndex((r) => r.id === resourceId);
    if (index === -1) return null;

    const item = resources[index];
    const newAvailable = Math.max(0, item.availableQuantity - quantity);
    const newStatus: Resource['status'] = newAvailable === 0 ? 'depleted' : 'stocked';

    const updated: Resource = {
      ...item,
      availableQuantity: newAvailable,
      assignedToTeamName: teamName || item.assignedToTeamName,
      status: newStatus,
    };

    resources[index] = updated;
    setStored(STORAGE_KEYS.RESOURCES, resources);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'ALLOCATE_RESOURCE',
        entityType: 'resource',
        entityId: resourceId,
        details: `Allocated ${quantity} ${item.unit} of "${item.name}" to ${teamName}`,
        severity: 'info',
      });
    }

    return updated;
  },

  // --- TASKS ---
  getTasks(): Task[] {
    return getStored<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },

  createTask(taskData: Omit<Task, 'id' | 'createdAt'>, currentUser?: User): Task {
    const tasks = this.getTasks();
    const newId = `TSK-${String(Math.floor(100 + Math.random() * 900))}`;
    const newTask: Task = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setStored(STORAGE_KEYS.TASKS, updated);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'CREATE_TASK',
        entityType: 'task',
        entityId: newId,
        details: `Assigned task "${newTask.title}" to ${newTask.assignedToUserName}`,
        severity: newTask.priority === 'critical' ? 'warning' : 'info',
      });
    }

    return newTask;
  },

  updateTaskStatus(taskId: string, status: Task['status'], currentUser?: User): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const updated: Task = {
      ...tasks[index],
      status,
    };

    tasks[index] = updated;
    setStored(STORAGE_KEYS.TASKS, tasks);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'UPDATE_TASK_STATUS',
        entityType: 'task',
        entityId: taskId,
        details: `Updated task "${updated.title}" status to ${status.toUpperCase()}`,
        severity: 'info',
      });
    }

    return updated;
  },

  // --- ALERTS ---
  getAlerts(): Alert[] {
    return getStored<Alert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  },

  createAlert(alertData: Omit<Alert, 'id' | 'issuedAt'>, currentUser?: User): Alert {
    const alerts = this.getAlerts();
    const newId = `ALT-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const newAlert: Alert = {
      ...alertData,
      id: newId,
      issuedAt: new Date().toISOString(),
      acknowledgedByCommander: false,
    };

    const updated = [newAlert, ...alerts];
    setStored(STORAGE_KEYS.ALERTS, updated);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'BROADCAST_ALERT',
        entityType: 'alert',
        entityId: newId,
        details: `Broadcasted ${newAlert.severity.toUpperCase()} alert: "${newAlert.title}" targeting ${newAlert.targetRegion}`,
        severity: 'critical',
      });
    }

    return newAlert;
  },

  acknowledgeAlert(alertId: string, currentUser?: User): Alert | null {
    const alerts = this.getAlerts();
    const index = alerts.findIndex((a) => a.id === alertId);
    if (index === -1) return null;

    const updated: Alert = {
      ...alerts[index],
      acknowledgedByCommander: true,
    };

    alerts[index] = updated;
    setStored(STORAGE_KEYS.ALERTS, alerts);

    if (currentUser) {
      this.logAudit({
        actor: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          agency: currentUser.agency,
        },
        action: 'ACKNOWLEDGE_ALERT',
        entityType: 'alert',
        entityId: alertId,
        details: `Commander acknowledged alert "${updated.title}"`,
        severity: 'info',
      });
    }

    return updated;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditEvent[] {
    return getStored<AuditEvent[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },

  logAudit(event: Omit<AuditEvent, 'id' | 'timestamp' | 'ipAddress'>): AuditEvent {
    const logs = this.getAuditLogs();
    const newEvent: AuditEvent = {
      ...event,
      id: `AUD-${String(Math.floor(1000 + Math.random() * 9000))}`,
      timestamp: new Date().toISOString(),
      ipAddress: '10.24.112.' + Math.floor(2 + Math.random() * 200),
    };

    const updated = [newEvent, ...logs.slice(0, 199)]; // keep latest 200
    setStored(STORAGE_KEYS.AUDIT, updated);
    return newEvent;
  },

  // Reset to factory demo data
  resetAllDemoData(): void {
    setStored(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
    setStored(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    setStored(STORAGE_KEYS.SHELTERS, INITIAL_SHELTERS);
    setStored(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    setStored(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    setStored(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
    setStored(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  },
};
