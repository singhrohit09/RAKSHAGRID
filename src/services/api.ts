import { Incident } from '../types/incident';
import { ResponseTeam } from '../types/team';
import { Shelter } from '../types/shelter';
import { ResourceItem } from '../types/resource';
import { IncidentTask, TaskStatus } from '../types/task';
import { EmergencyAlert } from '../types/alert';
import { AuditLogEvent } from '../types/audit';
import { AppSettings } from '../types/settings';
import { PersonaId } from '../types/role';
import { GeofenceZone, SpatialEvaluationReport } from '../types/geofence';
import { 
  NormalizedWeatherReport, 
  RiverGaugeReport, 
  ExternalHazardWarning, 
  SystemHealthResponse 
} from '../types/external';
import {
  AiHealthResponse,
  AgentDescriptor,
  DisasterRiskOutput,
  IncidentPrioritizationOutput,
  ResourceAllocationOutput,
  ResponseCoordinatorOutput,
  DisasterSimulationOutput,
  ExecutionRecord,
  RecommendationRecord
} from '../types/ai';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: PersonaId;
  department?: string;
  callsign?: string;
  createdAt?: string;
}

export interface AuthResponse {
  message?: string;
  user: AuthUser;
  token?: string;
}

export interface MeResponse {
  authenticated: boolean;
  user: AuthUser;
  permissions: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  database: string;
}

class ApiService {
  private token: string | null = null;
  private isBackendAvailable: boolean | null = null;

  constructor() {
    // Attempt to load token from sessionStorage if previously saved
    this.token = sessionStorage.getItem('raksha_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('raksha_auth_token', token);
    } else {
      sessionStorage.removeItem('raksha_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('X-Requested-With', 'XMLHttpRequest');
    headers.set('X-Raksha-CSRF', '1');

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include' // Sends HttpOnly session cookies
    };

    try {
      const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Server returned HTTP ${response.status}: ${response.statusText}` };
        }
        const error = new Error(errorData.error || `HTTP error ${response.status}`);
        (error as any).status = response.status;
        (error as any).code = errorData.code;
        throw error;
      }

      this.isBackendAvailable = true;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return (await response.text()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        this.isBackendAvailable = false;
      }
      throw err;
    }
  }

  // Health
  public async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  public getBackendAvailability(): boolean | null {
    return this.isBackendAvailable;
  }

  // Auth Endpoints
  public async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async register(payload: {
    email: string;
    password: string;
    displayName: string;
    role: PersonaId;
    department?: string;
    callsign?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/auth/me');
  }

  public async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    return this.request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  public async resetPasswordWithToken(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  public async updateUserRole(userId: string, role: PersonaId): Promise<{ message: string; userId: string; newRole: string }> {
    return this.request<{ message: string; userId: string; newRole: string }>(`/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  // Incidents
  public async getIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>('/incidents');
  }

  public async getIncident(id: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}`);
  }

  public async createIncident(data: Partial<Incident>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateIncident(id: string, partial: Partial<Incident>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async deleteIncident(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/incidents/${id}`, {
      method: 'DELETE'
    });
  }

  public async addIncidentTimeline(id: string, actor: string, note: string, type = 'general'): Promise<{ message: string; timelineId: string }> {
    return this.request<{ message: string; timelineId: string }>(`/incidents/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify({ actor, note, type })
    });
  }

  public async escalateIncident(id: string, reason: string, newSeverity = 'Critical', newPriority = 'P1'): Promise<{ message: string; severity: string; priority: string }> {
    return this.request<{ message: string; severity: string; priority: string }>(`/incidents/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason, newSeverity, newPriority })
    });
  }

  // Teams
  public async getTeams(): Promise<ResponseTeam[]> {
    return this.request<ResponseTeam[]>('/teams');
  }

  public async createTeam(data: Partial<ResponseTeam>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateTeam(id: string, partial: Partial<ResponseTeam>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async deleteTeam(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/teams/${id}`, {
      method: 'DELETE'
    });
  }

  // Shelters
  public async getShelters(): Promise<Shelter[]> {
    return this.request<Shelter[]>('/shelters');
  }

  public async createShelter(data: Partial<Shelter>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/shelters', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateShelter(id: string, partial: Partial<Shelter>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/shelters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async updateShelterOccupancy(id: string, occupancy: number, forceOverride = false): Promise<{ message: string; shelter: Partial<Shelter> }> {
    return this.request<{ message: string; shelter: Partial<Shelter> }>(`/shelters/${id}/occupancy`, {
      method: 'PUT',
      body: JSON.stringify({ occupancy, forceOverride })
    });
  }

  public async deleteShelter(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/shelters/${id}`, {
      method: 'DELETE'
    });
  }

  // Resources
  public async getResources(): Promise<ResourceItem[]> {
    return this.request<ResourceItem[]>('/resources');
  }

  public async createResource(data: Partial<ResourceItem>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateResource(id: string, partial: Partial<ResourceItem>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async allocateResource(id: string, quantity: number, note = ''): Promise<{ message: string; resource: ResourceItem }> {
    return this.request<{ message: string; resource: ResourceItem }>(`/resources/${id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ quantity, note })
    });
  }

  public async releaseResource(id: string, quantity: number, note = ''): Promise<{ message: string; resource: ResourceItem }> {
    return this.request<{ message: string; resource: ResourceItem }>(`/resources/${id}/release`, {
      method: 'POST',
      body: JSON.stringify({ quantity, note })
    });
  }

  public async deleteResource(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/resources/${id}`, {
      method: 'DELETE'
    });
  }

  // Tasks
  public async getTasks(): Promise<IncidentTask[]> {
    return this.request<IncidentTask[]>('/tasks');
  }

  public async createTask(data: Partial<IncidentTask>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateTaskStatus(id: string, status: TaskStatus): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  public async updateTask(id: string, partial: Partial<IncidentTask>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async deleteTask(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  // Alerts
  public async getAlerts(): Promise<EmergencyAlert[]> {
    return this.request<EmergencyAlert[]>('/alerts');
  }

  public async createAlert(data: Partial<EmergencyAlert>): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateAlert(id: string, partial: Partial<EmergencyAlert>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async approveAlert(id: string): Promise<{ message: string; status: string; approvedBy: string; approvedAt: string }> {
    return this.request<{ message: string; status: string; approvedBy: string; approvedAt: string }>(`/alerts/${id}/approve`, {
      method: 'POST'
    });
  }

  public async archiveAlert(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alerts/${id}/archive`, {
      method: 'POST'
    });
  }

  public async deleteAlert(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/alerts/${id}`, {
      method: 'DELETE'
    });
  }

  // Audit
  public async getAuditLogs(): Promise<{ success: boolean; data: AuditLogEvent[] }> {
    return this.request<{ success: boolean; data: AuditLogEvent[] }>('/audit');
  }

  public async exportAuditCsv(): Promise<string> {
    return this.request<string>('/audit/export');
  }

  // Settings
  public async getSettings(): Promise<{ success: boolean; data: AppSettings }> {
    return this.request<{ success: boolean; data: AppSettings }>('/settings');
  }

  public async updateSettings(settings: AppSettings): Promise<{ success: boolean; data: AppSettings }> {
    return this.request<{ success: boolean; data: AppSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  public async resetSystem(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/settings/reset', {
      method: 'POST'
    });
  }

  // Notifications
  public async getNotifications(): Promise<{ success: boolean; data: any[] }> {
    return this.request<{ success: boolean; data: any[] }>('/notifications');
  }

  public async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  public async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT'
    });
  }

  public async dispatchNotification(payload: {
    title: string;
    message: string;
    severity?: string;
    channels?: string[];
    targetRecipient?: string;
    incidentId?: string;
    affectedRegion?: string;
  }): Promise<{ success: boolean; summary: any }> {
    return this.request<{ success: boolean; summary: any }>('/notifications/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Geofences & Spatial Analysis (Phase 3)
  public async getGeofences(): Promise<GeofenceZone[]> {
    return this.request<GeofenceZone[]>('/geofences');
  }

  public async getGeofenceEval(): Promise<{ success: boolean; report: SpatialEvaluationReport }> {
    return this.request<{ success: boolean; report: SpatialEvaluationReport }>('/geofences/eval');
  }

  public async createGeofence(zone: Partial<GeofenceZone>): Promise<{ message: string; id: string; zone: GeofenceZone }> {
    return this.request<{ message: string; id: string; zone: GeofenceZone }>('/geofences', {
      method: 'POST',
      body: JSON.stringify(zone)
    });
  }

  public async updateGeofence(id: string, partial: Partial<GeofenceZone>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/geofences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
  }

  public async deleteGeofence(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/geofences/${id}`, {
      method: 'DELETE'
    });
  }

  // External Data & Weather Telemetry (Phase 3)
  public async getLiveWeather(lat = 28.6139, lng = 77.2090): Promise<{ success: boolean; data: NormalizedWeatherReport }> {
    return this.request<{ success: boolean; data: NormalizedWeatherReport }>(`/external/weather?lat=${lat}&lng=${lng}`);
  }

  public async getRiverGauges(): Promise<{ success: boolean; data: RiverGaugeReport[] }> {
    return this.request<{ success: boolean; data: RiverGaugeReport[] }>('/external/river-gauges');
  }

  public async getExternalHazards(): Promise<{ success: boolean; data: ExternalHazardWarning[] }> {
    return this.request<{ success: boolean; data: ExternalHazardWarning[] }>('/external/hazards');
  }

  public async getSystemHealth(): Promise<SystemHealthResponse> {
    return this.request<SystemHealthResponse>('/system/health');
  }

  // Phase 4: Multi-Agent AI & Disaster Intelligence
  public async getAiHealth(): Promise<AiHealthResponse> {
    return this.request<AiHealthResponse>('/ai/health');
  }

  public async getAiAgents(): Promise<{ success: boolean; data: AgentDescriptor[] }> {
    return this.request<{ success: boolean; data: AgentDescriptor[] }>('/ai/agents');
  }

  public async getAiAgent(id: string): Promise<{ success: boolean; data: AgentDescriptor }> {
    return this.request<{ success: boolean; data: AgentDescriptor }>(`/ai/agents/${id}`);
  }

  public async runDisasterRiskAnalysis(params?: { latitude?: number; longitude?: number; radiusKm?: number; focusRegionName?: string }): Promise<{
    success: boolean;
    executionId: string;
    status: string;
    durationMs: number;
    data: DisasterRiskOutput;
  }> {
    return this.request('/ai/risk/analyze', {
      method: 'POST',
      body: JSON.stringify(params || {})
    });
  }

  public async runIncidentPrioritization(): Promise<{
    success: boolean;
    executionId: string;
    status: string;
    durationMs: number;
    data: IncidentPrioritizationOutput;
  }> {
    return this.request('/ai/incidents/prioritize', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  public async runResourceAllocation(params?: { targetIncidentId?: string }): Promise<{
    success: boolean;
    executionId: string;
    status: string;
    durationMs: number;
    data: ResourceAllocationOutput;
  }> {
    return this.request('/ai/resources/recommend', {
      method: 'POST',
      body: JSON.stringify(params || {})
    });
  }

  public async runAiCoordinator(params: { query: string; focusRegion?: string; latitude?: number; longitude?: number }): Promise<{
    success: boolean;
    executionId: string;
    status: string;
    durationMs: number;
    data: ResponseCoordinatorOutput;
  }> {
    return this.request('/ai/coordinator/run', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  public async runDisasterSimulation(params: {
    scenarioName?: string;
    rainfallIntensityMmPerHour?: number;
    riverGaugeRiseMeters?: number;
    simultaneousIncidentsCount?: number;
    disabledTeamIds?: string[];
    targetRegion?: string;
    durationHours?: number;
  }): Promise<{
    success: boolean;
    executionId: string;
    status: string;
    durationMs: number;
    data: DisasterSimulationOutput;
  }> {
    return this.request('/ai/simulation/run', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  public async getAiExecutions(params?: { page?: number; limit?: number; agentName?: string; status?: string }): Promise<{
    success: boolean;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    executions: ExecutionRecord[];
  }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.agentName) q.set('agentName', params.agentName);
    if (params?.status) q.set('status', params.status);
    return this.request(`/ai/executions?${q.toString()}`);
  }

  public async getAiExecutionById(id: string): Promise<{ success: boolean; data: ExecutionRecord }> {
    return this.request<{ success: boolean; data: ExecutionRecord }>(`/ai/executions/${id}`);
  }

  public async getAiRecommendations(params?: { status?: string; limit?: number }): Promise<{ success: boolean; data: RecommendationRecord[] }> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', params.limit.toString());
    return this.request(`/ai/recommendations?${q.toString()}`);
  }

  public async approveAiRecommendation(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/ai/recommendations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  public async rejectAiRecommendation(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/ai/recommendations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public async getAiSimulations(params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    simulations: any[];
  }> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    return this.request(`/ai/simulations?${q.toString()}`);
  }

  public async getAiSimulationById(id: string): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(`/ai/simulations/${id}`);
  }
}

export const api = new ApiService();

