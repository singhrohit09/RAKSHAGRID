import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Incident } from '../types/incident';
import { ResponseTeam } from '../types/team';
import { Shelter, ShelterStatus } from '../types/shelter';
import { ResourceItem } from '../types/resource';
import { IncidentTask, TaskStatus } from '../types/task';
import { EmergencyAlert } from '../types/alert';
import { AuditLogEvent, AuditEntityType } from '../types/audit';
import { PersonaId } from '../types/role';
import { AppSettings } from '../types/settings';
import { PERSONAS, hasPermission } from '../utils/permissions';
import { api, AuthUser } from '../services/api';
import { 
  STORAGE_KEY, 
  SETTINGS_KEY, 
  DEFAULT_SETTINGS, 
  getInitialDataState, 
  RakshaDataState 
} from '../data/seedData';

export const DEFAULT_PERSONA_CREDENTIALS: Record<PersonaId, { email: string; password: string }> = {
  admin: { email: 'admin@rakshagrid.gov.in', password: 'Admin@RakshaGrid2026' },
  commander: { email: 'commander@rakshagrid.gov.in', password: 'Commander@Raksha2026' },
  responder: { email: 'responder@rakshagrid.gov.in', password: 'Responder@Raksha2026' },
  logistics: { email: 'logistics@rakshagrid.gov.in', password: 'Logistics@Raksha2026' },
  analyst: { email: 'analyst@rakshagrid.gov.in', password: 'Analyst@Raksha2026' }
};

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'emergency' | 'success';
  read: boolean;
}

export interface RakshaContextType {
  // State
  incidents: Incident[];
  teams: ResponseTeam[];
  shelters: Shelter[];
  resources: ResourceItem[];
  tasks: IncidentTask[];
  alerts: EmergencyAlert[];
  auditLogs: AuditLogEvent[];
  settings: AppSettings;
  activePersonaId: PersonaId;
  notifications: InAppNotification[];

  // Auth & Backend Status
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  backendConnected: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (payload: { email: string; password: string; displayName: string; role: PersonaId; department?: string; callsign?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncWithBackend: () => Promise<void>;

  // Persona
  setActivePersonaId: (id: PersonaId) => void;

  // Incident Operations
  addIncident: (data: Omit<Incident, 'id' | 'reportedAt' | 'updatedAt' | 'timeline'>) => Incident;
  updateIncident: (id: string, partial: Partial<Incident>) => boolean;
  deleteIncident: (id: string) => boolean;

  // Team Operations
  addTeam: (data: Omit<ResponseTeam, 'id' | 'updatedAt'>) => ResponseTeam;
  updateTeam: (id: string, partial: Partial<ResponseTeam>) => boolean;
  deleteTeam: (id: string) => boolean;

  // Shelter Operations
  addShelter: (data: Omit<Shelter, 'id' | 'updatedAt'>) => Shelter;
  updateShelter: (id: string, partial: Partial<Shelter>, allowOverflow?: boolean) => { success: boolean; error?: string };
  deleteShelter: (id: string) => boolean;

  // Resource Operations
  addResource: (data: Omit<ResourceItem, 'id' | 'updatedAt' | 'status'>) => ResourceItem;
  updateResource: (id: string, partial: Partial<ResourceItem>) => boolean;
  allocateResource: (id: string, amount: number, note?: string) => { success: boolean; error?: string };
  releaseResource: (id: string, amount: number, note?: string) => { success: boolean; error?: string };
  deleteResource: (id: string) => boolean;

  // Task Operations
  addTask: (data: Omit<IncidentTask, 'id' | 'createdAt' | 'updatedAt'>) => IncidentTask;
  updateTask: (id: string, partial: Partial<IncidentTask>) => boolean;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => boolean;
  deleteTask: (id: string) => boolean;

  // Alert Operations
  addAlert: (data: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => EmergencyAlert;
  updateAlert: (id: string, partial: Partial<EmergencyAlert>) => boolean;
  approveAlertForDemo: (id: string) => { success: boolean; error?: string };
  archiveAlert: (id: string) => boolean;
  deleteAlert: (id: string) => boolean;

  // Settings & Reset
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetDemoData: () => void;

  // Audit Logger
  logAudit: (action: string, entityType: AuditEntityType, entityId: string, description: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const RakshaContext = createContext<RakshaContextType | null>(null);

export const RakshaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State from LocalStorage with safe fallbacks
  const [dataState, setDataState] = useState<RakshaDataState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.incidents) && Array.isArray(parsed.teams)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved RakshaGrid state, using initial seed data.', e);
    }
    return getInitialDataState();
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse settings, using default.', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [activePersonaId, setActivePersonaId] = useState<PersonaId>('admin');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-1',
      title: 'Active Demo Exercise Active',
      message: 'Indraprashtha Sector 4 Flood & Hazmat Simulation scenario loaded.',
      timestamp: new Date().toISOString(),
      type: 'info',
      read: false
    },
    {
      id: 'notif-2',
      title: 'High Inundation Alert',
      message: 'Riverfront embankment breach (INC-2026-0101) reported active.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'emergency',
      read: false
    }
  ]);

  // Persist Data State to LocalStorage on Change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataState));
    } catch (err) {
      console.error('Failed to persist RakshaGrid data state:', err);
    }
  }, [dataState]);

  // Persist Settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to persist settings:', err);
    }
  }, [settings]);

  // Push Notification Helper
  const pushNotification = useCallback((title: string, message: string, type: InAppNotification['type'] = 'info') => {
    if (!settings.demoNotificationsEnabled) return;
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
  }, [settings.demoNotificationsEnabled]);

  // Synchronize data with live backend
  const syncWithBackend = useCallback(async () => {
    try {
      const [inc, tm, sh, res, tsk, alt, aud, st] = await Promise.all([
        api.getIncidents().catch(() => null),
        api.getTeams().catch(() => null),
        api.getShelters().catch(() => null),
        api.getResources().catch(() => null),
        api.getTasks().catch(() => null),
        api.getAlerts().catch(() => null),
        api.getAuditLogs().catch(() => null),
        api.getSettings().catch(() => null)
      ]);

      setDataState(prev => ({
        incidents: (inc && Array.isArray(inc) && inc.length > 0) ? inc : prev.incidents,
        teams: (tm && Array.isArray(tm) && tm.length > 0) ? tm : prev.teams,
        shelters: (sh && Array.isArray(sh) && sh.length > 0) ? sh : prev.shelters,
        resources: (res && Array.isArray(res) && res.length > 0) ? res : prev.resources,
        tasks: (tsk && Array.isArray(tsk) && tsk.length > 0) ? tsk : prev.tasks,
        alerts: (alt && Array.isArray(alt) && alt.length > 0) ? alt : prev.alerts,
        auditLogs: (aud && aud.data && Array.isArray(aud.data) && aud.data.length > 0) ? aud.data : prev.auditLogs
      }));

      if (st && st.data) {
        setSettings(prev => ({ ...prev, ...st.data }));
      }
    } catch (err) {
      console.warn('Backend sync error:', err);
    }
  }, []);

  // Backend Health check and initial session detection
  useEffect(() => {
    let isMounted = true;
    async function initBackend() {
      try {
        const health = await api.checkHealth();
        if (health.status === 'healthy' && isMounted) {
          setBackendConnected(true);
          try {
            const me = await api.getMe();
            if (me.authenticated && isMounted) {
              setCurrentUser(me.user);
              setIsAuthenticated(true);
              setActivePersonaId(me.user.role);
            }
          } catch {
            // Not authenticated yet
          }
          await syncWithBackend();
        }
      } catch {
        if (isMounted) {
          setBackendConnected(false);
          setIsDemoMode(true);
        }
      }
    }

    initBackend();
    return () => { isMounted = false; };
  }, [syncWithBackend]);

  // Authentication Actions
  const login = useCallback(async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      setActivePersonaId(res.user.role);
      setIsDemoMode(false);
      pushNotification('Authenticated', `Signed in as ${res.user.displayName} (${res.user.role.toUpperCase()})`, 'success');
      await syncWithBackend();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }, [pushNotification, syncWithBackend]);

  const registerUser = useCallback(async (payload: {
    email: string;
    password: string;
    displayName: string;
    role: PersonaId;
    department?: string;
    callsign?: string;
  }) => {
    try {
      const res = await api.register(payload);
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      setActivePersonaId(res.user.role);
      setIsDemoMode(false);
      pushNotification('Registration Successful', `Account created for ${res.user.displayName}`, 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }, [pushNotification]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsDemoMode(true);
    pushNotification('Signed Out', 'Operating in standalone demo simulation mode', 'info');
  }, [pushNotification]);

  const handleSetActivePersonaId = useCallback(async (id: PersonaId) => {
    setActivePersonaId(id);
    if (backendConnected && !isDemoMode) {
      const creds = DEFAULT_PERSONA_CREDENTIALS[id];
      if (creds) {
        try {
          const res = await api.login(creds.email, creds.password);
          setCurrentUser(res.user);
          setIsAuthenticated(true);
        } catch {
          // fallback to client-side switch
        }
      }
    }
  }, [backendConnected, isDemoMode]);

  // Centralized Audit Logging Helper
  const logAudit = useCallback((
    action: string,
    entityType: AuditEntityType,
    entityId: string,
    description: string
  ) => {
    const actorPersona = PERSONAS[activePersonaId];
    const newEvent: AuditLogEvent = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      actor: actorPersona ? actorPersona.name : 'Unknown User',
      actorRole: actorPersona ? actorPersona.roleLabel : 'Observer',
      action,
      entityType,
      entityId,
      description
    };

    setDataState(prev => ({
      ...prev,
      auditLogs: [newEvent, ...prev.auditLogs]
    }));
  }, [activePersonaId]);

  // ---------------- INCIDENT CRUD ----------------
  const addIncident = useCallback((
    data: Omit<Incident, 'id' | 'reportedAt' | 'updatedAt' | 'timeline'>
  ): Incident => {
    const newId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newIncident: Incident = {
      ...data,
      id: newId,
      reportedAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          timestamp: now,
          actor: PERSONAS[activePersonaId].name,
          note: `Incident registered with priority ${data.priority} and severity ${data.severity}.`,
          type: 'general'
        }
      ]
    };

    setDataState(prev => ({
      ...prev,
      incidents: [newIncident, ...prev.incidents]
    }));

    logAudit('incident_created', 'incident', newId, `Created incident: ${newIncident.title} (${newIncident.severity})`);
    pushNotification('Incident Created', `${newIncident.title} registered.`, 'warning');
    return newIncident;
  }, [activePersonaId, logAudit, pushNotification]);

  const updateIncident = useCallback((id: string, partial: Partial<Incident>): boolean => {
    let updatedTitle = '';
    const now = new Date().toISOString();

    setDataState(prev => {
      const idx = prev.incidents.findIndex(inc => inc.id === id);
      if (idx === -1) return prev;

      const existing = prev.incidents[idx];
      updatedTitle = partial.title || existing.title;
      
      const newTimeline = [...existing.timeline];
      if (partial.status && partial.status !== existing.status) {
        newTimeline.push({
          id: `TL-${Date.now()}`,
          timestamp: now,
          actor: PERSONAS[activePersonaId].name,
          note: `Status changed from ${existing.status} to ${partial.status}.`,
          type: 'status_change'
        });
      }

      if (partial.assignedTeamId && partial.assignedTeamId !== existing.assignedTeamId) {
        newTimeline.push({
          id: `TL-${Date.now()}`,
          timestamp: now,
          actor: PERSONAS[activePersonaId].name,
          note: `Response team updated: ${partial.assignedTeamName || partial.assignedTeamId}.`,
          type: 'team_assigned'
        });
      }

      const updated = {
        ...existing,
        ...partial,
        updatedAt: now,
        timeline: newTimeline
      };

      const newIncidents = [...prev.incidents];
      newIncidents[idx] = updated;
      return { ...prev, incidents: newIncidents };
    });

    logAudit('incident_updated', 'incident', id, `Updated incident: ${updatedTitle || id}`);
    return true;
  }, [activePersonaId, logAudit]);

  const deleteIncident = useCallback((id: string): boolean => {
    const existing = dataState.incidents.find(inc => inc.id === id);
    const title = existing ? existing.title : id;

    setDataState(prev => ({
      ...prev,
      incidents: prev.incidents.filter(inc => inc.id !== id)
    }));

    logAudit('incident_deleted', 'incident', id, `Deleted incident: ${title}`);
    pushNotification('Incident Removed', `Incident ${id} was deleted from registry.`, 'info');
    return true;
  }, [dataState.incidents, logAudit, pushNotification]);

  // ---------------- TEAM CRUD ----------------
  const addTeam = useCallback((
    data: Omit<ResponseTeam, 'id' | 'updatedAt'>
  ): ResponseTeam => {
    const newId = `TEAM-${data.type.toUpperCase().substring(0, 4)}-${Math.floor(10 + Math.random() * 90)}`;
    const now = new Date().toISOString();
    const newTeam: ResponseTeam = {
      ...data,
      id: newId,
      updatedAt: now
    };

    setDataState(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam]
    }));

    logAudit('team_created', 'team', newId, `Added response team: ${newTeam.name} (${newTeam.staffCount} staff)`);
    return newTeam;
  }, [logAudit]);

  const updateTeam = useCallback((id: string, partial: Partial<ResponseTeam>): boolean => {
    let teamName = '';
    setDataState(prev => {
      const idx = prev.teams.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      teamName = partial.name || prev.teams[idx].name;
      const updated = { ...prev.teams[idx], ...partial, updatedAt: new Date().toISOString() };
      const newTeams = [...prev.teams];
      newTeams[idx] = updated;
      return { ...prev, teams: newTeams };
    });

    logAudit('team_updated', 'team', id, `Updated team: ${teamName || id}`);
    return true;
  }, [logAudit]);

  const deleteTeam = useCallback((id: string): boolean => {
    const existing = dataState.teams.find(t => t.id === id);
    const name = existing ? existing.name : id;

    setDataState(prev => ({
      ...prev,
      teams: prev.teams.filter(t => t.id !== id)
    }));

    logAudit('team_deleted', 'team', id, `Removed response team: ${name}`);
    return true;
  }, [dataState.teams, logAudit]);

  // ---------------- SHELTER CRUD ----------------
  const addShelter = useCallback((
    data: Omit<Shelter, 'id' | 'updatedAt'>
  ): Shelter => {
    const newId = `SHL-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const newShelter: Shelter = {
      ...data,
      id: newId,
      updatedAt: now
    };

    setDataState(prev => ({
      ...prev,
      shelters: [...prev.shelters, newShelter]
    }));

    logAudit('shelter_created', 'shelter', newId, `Registered emergency shelter: ${newShelter.name} (Cap: ${newShelter.capacity})`);
    return newShelter;
  }, [logAudit]);

  const updateShelter = useCallback((
    id: string, 
    partial: Partial<Shelter>, 
    allowOverflow = false
  ): { success: boolean; error?: string } => {
    const existing = dataState.shelters.find(s => s.id === id);
    if (!existing) return { success: false, error: 'Shelter not found.' };

    const targetCapacity = partial.capacity !== undefined ? partial.capacity : existing.capacity;
    const targetOccupancy = partial.currentOccupancy !== undefined ? partial.currentOccupancy : existing.currentOccupancy;

    if (targetOccupancy < 0) {
      return { success: false, error: 'Occupancy count cannot be negative.' };
    }

    if (targetOccupancy > targetCapacity && !allowOverflow) {
      return { 
        success: false, 
        error: `Occupancy (${targetOccupancy}) exceeds maximum shelter capacity (${targetCapacity}). Confirmation override required.` 
      };
    }

    // Compute automatic status
    let newStatus: ShelterStatus = partial.status || existing.status;
    if (targetOccupancy >= targetCapacity) {
      newStatus = 'Full';
    } else if (targetOccupancy >= targetCapacity * 0.85) {
      newStatus = 'Near Capacity';
    } else {
      newStatus = 'Open';
    }

    setDataState(prev => {
      const idx = prev.shelters.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const updated = {
        ...prev.shelters[idx],
        ...partial,
        currentOccupancy: targetOccupancy,
        capacity: targetCapacity,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      const newShelters = [...prev.shelters];
      newShelters[idx] = updated;
      return { ...prev, shelters: newShelters };
    });

    logAudit(
      'shelter_updated',
      'shelter',
      id,
      `Updated shelter ${existing.name}: Occupancy ${targetOccupancy}/${targetCapacity} (${newStatus})`
    );
    return { success: true };
  }, [dataState.shelters, logAudit]);

  const deleteShelter = useCallback((id: string): boolean => {
    const existing = dataState.shelters.find(s => s.id === id);
    const name = existing ? existing.name : id;

    setDataState(prev => ({
      ...prev,
      shelters: prev.shelters.filter(s => s.id !== id)
    }));

    logAudit('shelter_deleted', 'shelter', id, `Removed shelter: ${name}`);
    return true;
  }, [dataState.shelters, logAudit]);

  // ---------------- RESOURCE CRUD ----------------
  const addResource = useCallback((
    data: Omit<ResourceItem, 'id' | 'updatedAt' | 'status'>
  ): ResourceItem => {
    const newId = `RES-${data.category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    
    let status: ResourceItem['status'] = 'Sufficient';
    if (data.quantityAvailable === 0) status = 'Depleted';
    else if (data.quantityAvailable <= data.minThreshold * 0.5) status = 'Critical';
    else if (data.quantityAvailable <= data.minThreshold) status = 'Low Stock';

    const newResource: ResourceItem = {
      ...data,
      id: newId,
      status,
      updatedAt: now
    };

    setDataState(prev => ({
      ...prev,
      resources: [...prev.resources, newResource]
    }));

    logAudit('resource_created', 'resource', newId, `Added resource: ${newResource.name} (${newResource.quantityAvailable} ${newResource.unit})`);
    return newResource;
  }, [logAudit]);

  const updateResource = useCallback((id: string, partial: Partial<ResourceItem>): boolean => {
    setDataState(prev => {
      const idx = prev.resources.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const existing = prev.resources[idx];
      const quantityAvailable = partial.quantityAvailable !== undefined ? partial.quantityAvailable : existing.quantityAvailable;
      const minThreshold = partial.minThreshold !== undefined ? partial.minThreshold : existing.minThreshold;

      let status = partial.status || existing.status;
      if (quantityAvailable === 0) status = 'Depleted';
      else if (quantityAvailable <= minThreshold * 0.5) status = 'Critical';
      else if (quantityAvailable <= minThreshold) status = 'Low Stock';
      else status = 'Sufficient';

      const updated = {
        ...existing,
        ...partial,
        quantityAvailable,
        status,
        updatedAt: new Date().toISOString()
      };
      const newResources = [...prev.resources];
      newResources[idx] = updated;
      return { ...prev, resources: newResources };
    });

    logAudit('resource_updated', 'resource', id, `Updated inventory item ${id}`);
    return true;
  }, [logAudit]);

  const allocateResource = useCallback((
    id: string, 
    amount: number, 
    note?: string
  ): { success: boolean; error?: string } => {
    const item = dataState.resources.find(r => r.id === id);
    if (!item) return { success: false, error: 'Resource item not found.' };

    if (amount <= 0) return { success: false, error: 'Allocation quantity must be greater than zero.' };

    if (amount > item.quantityAvailable) {
      return {
        success: false,
        error: `Insufficient available inventory. Requested: ${amount} ${item.unit}, Available: ${item.quantityAvailable} ${item.unit}. Negative stock is prevented.`
      };
    }

    const newAvailable = item.quantityAvailable - amount;
    const newAllocated = item.quantityAllocated + amount;

    let newStatus: ResourceItem['status'] = 'Sufficient';
    if (newAvailable === 0) newStatus = 'Depleted';
    else if (newAvailable <= item.minThreshold * 0.5) newStatus = 'Critical';
    else if (newAvailable <= item.minThreshold) newStatus = 'Low Stock';

    setDataState(prev => {
      const idx = prev.resources.findIndex(r => r.id === id);
      const updated = {
        ...prev.resources[idx],
        quantityAvailable: newAvailable,
        quantityAllocated: newAllocated,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      const newRes = [...prev.resources];
      newRes[idx] = updated;
      return { ...prev, resources: newRes };
    });

    logAudit(
      'resource_allocated',
      'resource',
      id,
      `Allocated ${amount} ${item.unit} of ${item.name}. Remaining available: ${newAvailable} ${item.unit}. ${note || ''}`
    );

    if (newStatus === 'Low Stock' || newStatus === 'Critical') {
      pushNotification('Low Stock Warning', `${item.name} is now at ${newStatus} level (${newAvailable} ${item.unit} remaining).`, 'warning');
    }

    return { success: true };
  }, [dataState.resources, logAudit, pushNotification]);

  const releaseResource = useCallback((
    id: string, 
    amount: number, 
    note?: string
  ): { success: boolean; error?: string } => {
    const item = dataState.resources.find(r => r.id === id);
    if (!item) return { success: false, error: 'Resource item not found.' };

    if (amount <= 0) return { success: false, error: 'Release quantity must be greater than zero.' };

    if (amount > item.quantityAllocated) {
      return {
        success: false,
        error: `Cannot release more than currently allocated. Allocated: ${item.quantityAllocated} ${item.unit}, Requested release: ${amount} ${item.unit}.`
      };
    }

    const newAvailable = item.quantityAvailable + amount;
    const newAllocated = item.quantityAllocated - amount;

    let newStatus: ResourceItem['status'] = 'Sufficient';
    if (newAvailable === 0) newStatus = 'Depleted';
    else if (newAvailable <= item.minThreshold * 0.5) newStatus = 'Critical';
    else if (newAvailable <= item.minThreshold) newStatus = 'Low Stock';

    setDataState(prev => {
      const idx = prev.resources.findIndex(r => r.id === id);
      const updated = {
        ...prev.resources[idx],
        quantityAvailable: newAvailable,
        quantityAllocated: newAllocated,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      const newRes = [...prev.resources];
      newRes[idx] = updated;
      return { ...prev, resources: newRes };
    });

    logAudit(
      'resource_released',
      'resource',
      id,
      `Released ${amount} ${item.unit} of ${item.name} back to available inventory. ${note || ''}`
    );
    return { success: true };
  }, [dataState.resources, logAudit]);

  const deleteResource = useCallback((id: string): boolean => {
    const existing = dataState.resources.find(r => r.id === id);
    const name = existing ? existing.name : id;

    setDataState(prev => ({
      ...prev,
      resources: prev.resources.filter(r => r.id !== id)
    }));

    logAudit('resource_deleted', 'resource', id, `Removed inventory record: ${name}`);
    return true;
  }, [dataState.resources, logAudit]);

  // ---------------- TASK CRUD ----------------
  const addTask = useCallback((
    data: Omit<IncidentTask, 'id' | 'createdAt' | 'updatedAt'>
  ): IncidentTask => {
    const newId = `TSK-${Math.floor(2000 + Math.random() * 8000)}`;
    const now = new Date().toISOString();
    const newTask: IncidentTask = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    setDataState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));

    logAudit('task_created', 'task', newId, `Created response task: ${newTask.title} (Priority: ${newTask.priority})`);
    return newTask;
  }, [logAudit]);

  const updateTask = useCallback((id: string, partial: Partial<IncidentTask>): boolean => {
    setDataState(prev => {
      const idx = prev.tasks.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const updated = { ...prev.tasks[idx], ...partial, updatedAt: new Date().toISOString() };
      const newTasks = [...prev.tasks];
      newTasks[idx] = updated;
      return { ...prev, tasks: newTasks };
    });

    logAudit('task_updated', 'task', id, `Updated response task ${id}`);
    return true;
  }, [logAudit]);

  const moveTaskStatus = useCallback((id: string, newStatus: TaskStatus): boolean => {
    let taskTitle = '';
    setDataState(prev => {
      const idx = prev.tasks.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      taskTitle = prev.tasks[idx].title;
      const updated = { ...prev.tasks[idx], status: newStatus, updatedAt: new Date().toISOString() };
      const newTasks = [...prev.tasks];
      newTasks[idx] = updated;
      return { ...prev, tasks: newTasks };
    });

    logAudit('task_status_changed', 'task', id, `Moved task "${taskTitle || id}" to ${newStatus}`);
    return true;
  }, [logAudit]);

  const deleteTask = useCallback((id: string): boolean => {
    const existing = dataState.tasks.find(t => t.id === id);
    const title = existing ? existing.title : id;

    setDataState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));

    logAudit('task_deleted', 'task', id, `Deleted response task: ${title}`);
    return true;
  }, [dataState.tasks, logAudit]);

  // ---------------- ALERT CRUD ----------------
  const addAlert = useCallback((
    data: Omit<EmergencyAlert, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): EmergencyAlert => {
    const newId = `ALT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const newAlert: EmergencyAlert = {
      ...data,
      id: newId,
      status: 'Draft',
      createdAt: now,
      updatedAt: now
    };

    setDataState(prev => ({
      ...prev,
      alerts: [newAlert, ...prev.alerts]
    }));

    logAudit('alert_created', 'alert', newId, `Drafted emergency alert: ${newAlert.title}`);
    return newAlert;
  }, [logAudit]);

  const updateAlert = useCallback((id: string, partial: Partial<EmergencyAlert>): boolean => {
    setDataState(prev => {
      const idx = prev.alerts.findIndex(a => a.id === id);
      if (idx === -1) return prev;
      const updated = { ...prev.alerts[idx], ...partial, updatedAt: new Date().toISOString() };
      const newAlerts = [...prev.alerts];
      newAlerts[idx] = updated;
      return { ...prev, alerts: newAlerts };
    });

    logAudit('alert_updated', 'alert', id, `Updated emergency alert ${id}`);
    return true;
  }, [logAudit]);

  const approveAlertForDemo = useCallback((id: string): { success: boolean; error?: string } => {
    if (!hasPermission(activePersonaId, 'approve_alerts')) {
      return { success: false, error: 'Insufficient permission to approve emergency alerts.' };
    }

    const alert = dataState.alerts.find(a => a.id === id);
    if (!alert) return { success: false, error: 'Alert not found.' };

    const actor = PERSONAS[activePersonaId].name;
    const now = new Date().toISOString();

    setDataState(prev => {
      const idx = prev.alerts.findIndex(a => a.id === id);
      const updated = {
        ...prev.alerts[idx],
        status: 'Approved for Demo' as const,
        approvedBy: `${actor} (${PERSONAS[activePersonaId].roleLabel})`,
        approvedAt: now,
        updatedAt: now
      };
      const newAlerts = [...prev.alerts];
      newAlerts[idx] = updated;
      return { ...prev, alerts: newAlerts };
    });

    logAudit('alert_approved', 'alert', id, `Approved demo warning: "${alert.title}" (Simulated only — no public dissemination)`);
    pushNotification('Demo Alert Approved', `"${alert.title}" approved for simulated presentation.`, 'emergency');
    return { success: true };
  }, [activePersonaId, dataState.alerts, logAudit, pushNotification]);

  const archiveAlert = useCallback((id: string): boolean => {
    setDataState(prev => {
      const idx = prev.alerts.findIndex(a => a.id === id);
      if (idx === -1) return prev;
      const updated = { ...prev.alerts[idx], status: 'Archived' as const, updatedAt: new Date().toISOString() };
      const newAlerts = [...prev.alerts];
      newAlerts[idx] = updated;
      return { ...prev, alerts: newAlerts };
    });

    logAudit('alert_archived', 'alert', id, `Archived emergency alert ${id}`);
    return true;
  }, [logAudit]);

  const deleteAlert = useCallback((id: string): boolean => {
    const existing = dataState.alerts.find(a => a.id === id);
    const title = existing ? existing.title : id;

    setDataState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== id)
    }));

    logAudit('alert_deleted', 'alert', id, `Deleted emergency alert record: ${title}`);
    return true;
  }, [dataState.alerts, logAudit]);

  // ---------------- SETTINGS & RESET ----------------
  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
    logAudit('settings_updated', 'settings', 'GLOBAL_SETTINGS', 'Updated application operational preferences.');
  }, [logAudit]);

  const resetDemoData = useCallback(() => {
    const fresh = getInitialDataState();
    setDataState(fresh);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Failed to reset localStorage state:', e);
    }

    logAudit('demo_data_reset', 'system', 'SYS-RESET', 'Reset all records to initial scenario baseline.');
    pushNotification('Demo Data Reset', 'All records have been restored to initial scenario defaults.', 'info');
  }, [logAudit, pushNotification]);

  // ---------------- NOTIFICATIONS ----------------
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(() => ({
    incidents: dataState.incidents,
    teams: dataState.teams,
    shelters: dataState.shelters,
    resources: dataState.resources,
    tasks: dataState.tasks,
    alerts: dataState.alerts,
    auditLogs: dataState.auditLogs,
    settings,
    activePersonaId,
    notifications,
    currentUser,
    isAuthenticated,
    backendConnected,
    isDemoMode,
    setIsDemoMode,
    login,
    registerUser,
    logout,
    syncWithBackend,
    setActivePersonaId: handleSetActivePersonaId,
    addIncident,
    updateIncident,
    deleteIncident,
    addTeam,
    updateTeam,
    deleteTeam,
    addShelter,
    updateShelter,
    deleteShelter,
    addResource,
    updateResource,
    allocateResource,
    releaseResource,
    deleteResource,
    addTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    addAlert,
    updateAlert,
    approveAlertForDemo,
    archiveAlert,
    deleteAlert,
    updateSettings,
    resetDemoData,
    logAudit,
    markNotificationAsRead,
    clearAllNotifications
  }), [
    dataState,
    settings,
    activePersonaId,
    notifications,
    currentUser,
    isAuthenticated,
    backendConnected,
    isDemoMode,
    setIsDemoMode,
    login,
    registerUser,
    logout,
    syncWithBackend,
    handleSetActivePersonaId,
    addIncident,
    updateIncident,
    deleteIncident,
    addTeam,
    updateTeam,
    deleteTeam,
    addShelter,
    updateShelter,
    deleteShelter,
    addResource,
    updateResource,
    allocateResource,
    releaseResource,
    deleteResource,
    addTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    addAlert,
    updateAlert,
    approveAlertForDemo,
    archiveAlert,
    deleteAlert,
    updateSettings,
    resetDemoData,
    logAudit,
    markNotificationAsRead,
    clearAllNotifications
  ]);

  return (
    <RakshaContext.Provider value={value}>
      {children}
    </RakshaContext.Provider>
  );
};

export function useRaksha(): RakshaContextType {
  const context = useContext(RakshaContext);
  if (!context) {
    throw new Error('useRaksha must be used within a RakshaProvider');
  }
  return context;
}
