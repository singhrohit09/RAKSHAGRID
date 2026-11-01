/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataService } from './services/dataService';
import { Incident, Team, Shelter, Resource, Task, Alert, AuditEvent, TeamStatus, TaskStatus } from './types';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Dynamic route code-splitting for high-performance lazy module loading
const PublicPortal = lazy(() => import('./pages/PublicPortal').then((m) => ({ default: m.PublicPortal })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage').then((m) => ({ default: m.IncidentsPage })));
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then((m) => ({ default: m.TeamsPage })));
const SheltersPage = lazy(() => import('./pages/SheltersPage').then((m) => ({ default: m.SheltersPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })));
const AIIntelligencePage = lazy(() => import('./pages/AIIntelligencePage').then((m) => ({ default: m.AIIntelligencePage })));

const TacticalRouteLoader = () => (
  <div className="min-h-[420px] flex flex-col items-center justify-center p-8 text-center" role="status" aria-label="Loading operational module">
    <div className="w-10 h-10 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-xs font-mono uppercase tracking-widest text-[#8b949e]">
      Decrypting & Initializing Subsystem...
    </p>
  </div>
);

function MainApp() {
  const { user, isAuthenticated } = useAuth();

  // Navigation route state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    return path || '/';
  });

  const [routeQuery, setRouteQuery] = useState<{ id?: string; action?: string; severity?: string; status?: string; type?: string; view?: string; reason?: string }>(() => {
    const params = new URLSearchParams(window.location.search);
    const queryObj: Record<string, string> = {};
    params.forEach((val, key) => {
      queryObj[key] = val;
    });
    return queryObj;
  });

  // Operational State initialized from DataService
  const [incidents, setIncidents] = useState<Incident[]>(() => DataService.getIncidents());
  const [teams, setTeams] = useState<Team[]>(() => DataService.getTeams());
  const [shelters, setShelters] = useState<Shelter[]>(() => DataService.getShelters());
  const [resources, setResources] = useState<Resource[]>(() => DataService.getResources());
  const [tasks, setTasks] = useState<Task[]>(() => DataService.getTasks());
  const [alerts, setAlerts] = useState<Alert[]>(() => DataService.getAlerts());
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => DataService.getAuditLogs());

  // URL sync handler
  const navigateTo = (pathAndQuery: string) => {
    const [path, queryStr] = pathAndQuery.split('?');
    const params = new URLSearchParams(queryStr || '');
    const queryObj: Record<string, string> = {};
    params.forEach((val, key) => {
      queryObj[key] = val;
    });

    setCurrentRoute(path);
    setRouteQuery(queryObj);

    window.history.pushState({}, '', pathAndQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      const params = new URLSearchParams(window.location.search);
      const queryObj: Record<string, string> = {};
      params.forEach((val, key) => {
        queryObj[key] = val;
      });
      setCurrentRoute(path);
      setRouteQuery(queryObj);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handlers for Data Mutations
  const handleCreateIncident = (data: Omit<Incident, 'id' | 'reportedTime' | 'lastUpdated'>): Incident => {
    const created = DataService.createIncident(data, user || undefined);
    setIncidents(DataService.getIncidents());
    setAuditLogs(DataService.getAuditLogs());
    return created;
  };

  const handleUpdateIncident = (id: string, updates: Partial<Incident>) => {
    DataService.updateIncident(id, updates, user || undefined);
    setIncidents(DataService.getIncidents());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleDeleteIncident = (id: string) => {
    DataService.deleteIncident(id, user || undefined);
    setIncidents(DataService.getIncidents());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleUpdateTeamStatus = (teamId: string, status: TeamStatus, incidentId?: string, incidentTitle?: string) => {
    DataService.updateTeamStatus(teamId, status, incidentId, incidentTitle, user || undefined);
    setTeams(DataService.getTeams());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleUpdateShelterOccupancy = (shelterId: string, occupancy: number) => {
    DataService.updateShelterOccupancy(shelterId, occupancy, user || undefined);
    setShelters(DataService.getShelters());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleAllocateResource = (resourceId: string, quantity: number, teamName: string) => {
    DataService.allocateResource(resourceId, quantity, teamName, user || undefined);
    setResources(DataService.getResources());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    DataService.createTask(taskData, user || undefined);
    setTasks(DataService.getTasks());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    DataService.updateTaskStatus(taskId, status, user || undefined);
    setTasks(DataService.getTasks());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleCreateAlert = (alertData: Omit<Alert, 'id' | 'issuedAt'>) => {
    DataService.createAlert(alertData, user || undefined);
    setAlerts(DataService.getAlerts());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleAcknowledgeAlert = (id: string) => {
    DataService.acknowledgeAlert(id, user || undefined);
    setAlerts(DataService.getAlerts());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleResetDemoData = () => {
    DataService.resetAllDemoData();
    setIncidents(DataService.getIncidents());
    setTeams(DataService.getTeams());
    setShelters(DataService.getShelters());
    setResources(DataService.getResources());
    setTasks(DataService.getTasks());
    setAlerts(DataService.getAlerts());
    setAuditLogs(DataService.getAuditLogs());
  };

  const handleRefreshData = () => {
    setIncidents(DataService.getIncidents());
    setTeams(DataService.getTeams());
    setShelters(DataService.getShelters());
    setResources(DataService.getResources());
    setTasks(DataService.getTasks());
    setAlerts(DataService.getAlerts());
    setAuditLogs(DataService.getAuditLogs());
  };

  // Route Rendering Logic
  // 1. Root route: if authenticated and not specifically viewing public portal, show dashboard
  if (currentRoute === '/') {
    if (isAuthenticated && routeQuery.view !== 'public') {
      return (
        <AppLayout
          currentRoute="/dashboard"
          onNavigate={navigateTo}
          incidents={incidents}
          teams={teams}
          shelters={shelters}
          resources={resources}
          tasks={tasks}
          alerts={alerts}
          onAcknowledgeAlert={handleAcknowledgeAlert}
        >
          <ErrorBoundary fallbackTitle="Operations Dashboard Failure">
            <Suspense fallback={<TacticalRouteLoader />}>
              <DashboardPage
                incidents={incidents}
                teams={teams}
                shelters={shelters}
                resources={resources}
                tasks={tasks}
                alerts={alerts}
                auditLogs={auditLogs}
                onNavigate={navigateTo}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onRefreshData={handleRefreshData}
              />
            </Suspense>
          </ErrorBoundary>
        </AppLayout>
      );
    }
    return (
      <ErrorBoundary fallbackTitle="Public Portal Subsystem Error">
        <Suspense fallback={<TacticalRouteLoader />}>
          <PublicPortal
            incidents={incidents}
            alerts={alerts}
            onEnterCommand={() => navigateTo('/dashboard')}
            onNavigateToLogin={() => navigateTo('/login')}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 2. Login Page
  if (currentRoute === '/login') {
    return (
      <ErrorBoundary fallbackTitle="Authentication Subsystem Error">
        <Suspense fallback={<TacticalRouteLoader />}>
          <LoginPage
            onSuccess={() => navigateTo('/dashboard')}
            onNavigateToRegister={() => navigateTo('/register')}
            onNavigateToPublic={() => navigateTo('/?view=public')}
            redirectReason={routeQuery.reason}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 3. Register Page
  if (currentRoute === '/register') {
    return (
      <ErrorBoundary fallbackTitle="Registration Subsystem Error">
        <Suspense fallback={<TacticalRouteLoader />}>
          <RegisterPage
            onSuccess={() => navigateTo('/dashboard')}
            onNavigateToLogin={() => navigateTo('/login')}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 4. Protected Route Guard for Unauthenticated Users
  const protectedRoutes = [
    '/dashboard',
    '/incidents',
    '/map',
    '/ai-intelligence',
    '/teams',
    '/shelters',
    '/resources',
    '/tasks',
    '/analytics',
    '/alerts',
    '/settings',
    '/audit-log',
  ];

  if (!isAuthenticated && protectedRoutes.includes(currentRoute)) {
    return (
      <ErrorBoundary fallbackTitle="Authentication Required">
        <Suspense fallback={<TacticalRouteLoader />}>
          <LoginPage
            onSuccess={() => navigateTo(currentRoute)}
            onNavigateToRegister={() => navigateTo('/register')}
            onNavigateToPublic={() => navigateTo('/?view=public')}
            redirectReason="Authentication required: Please sign in with an authorized agency account to access operational emergency systems."
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 5. Authenticated Operational Application Shell
  return (
    <AppLayout
      currentRoute={currentRoute}
      onNavigate={navigateTo}
      incidents={incidents}
      teams={teams}
      shelters={shelters}
      resources={resources}
      tasks={tasks}
      alerts={alerts}
      onAcknowledgeAlert={handleAcknowledgeAlert}
    >
      <ErrorBoundary>
        <Suspense fallback={<TacticalRouteLoader />}>
      {currentRoute === '/dashboard' && (
        <DashboardPage
          incidents={incidents}
          teams={teams}
          shelters={shelters}
          resources={resources}
          tasks={tasks}
          alerts={alerts}
          auditLogs={auditLogs}
          onNavigate={navigateTo}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onRefreshData={handleRefreshData}
        />
      )}

      {currentRoute === '/incidents' && (
        <IncidentsPage
          incidents={incidents}
          teams={teams}
          selectedIncidentId={routeQuery.id}
          initialAction={routeQuery.action}
          initialSeverity={routeQuery.severity}
          initialStatus={routeQuery.status}
          initialType={routeQuery.type}
          onCreateIncident={handleCreateIncident}
          onUpdateIncident={handleUpdateIncident}
          onDeleteIncident={handleDeleteIncident}
          onNavigateToMap={() => navigateTo('/map')}
        />
      )}

      {currentRoute === '/map' && (
        <MapPage
          incidents={incidents}
          shelters={shelters}
          teams={teams}
          onNavigateToIncident={(id) => navigateTo(`/incidents?id=${id}`)}
          onNavigateToTeam={(id) => navigateTo(`/teams?id=${id}`)}
        />
      )}

      {currentRoute === '/ai-intelligence' && (
        <AIIntelligencePage
          incidents={incidents}
          teams={teams}
          shelters={shelters}
          resources={resources}
          tasks={tasks}
          alerts={alerts}
          auditLogs={auditLogs}
          onUpdateIncident={handleUpdateIncident}
          onBroadcastAlert={handleCreateAlert}
          onAddAuditLog={(action, entityType, entityId, details) => {
            DataService.logCustomEvent(action, entityType, entityId, details, user || undefined);
            setAuditLogs(DataService.getAuditLogs());
          }}
          onNavigate={navigateTo}
        />
      )}

      {currentRoute === '/teams' && (
        <TeamsPage
          teams={teams}
          incidents={incidents}
          onUpdateTeamStatus={handleUpdateTeamStatus}
          onNavigateToIncident={(id) => navigateTo(`/incidents?id=${id}`)}
        />
      )}

      {currentRoute === '/shelters' && (
        <SheltersPage
          shelters={shelters}
          onUpdateShelterOccupancy={handleUpdateShelterOccupancy}
        />
      )}

      {currentRoute === '/resources' && (
        <ResourcesPage
          resources={resources}
          teams={teams}
          onAllocateResource={handleAllocateResource}
        />
      )}

      {currentRoute === '/tasks' && (
        <TasksPage
          tasks={tasks}
          incidents={incidents}
          onCreateTask={handleCreateTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      )}

      {currentRoute === '/analytics' && (
        <AnalyticsPage
          incidents={incidents}
          shelters={shelters}
          resources={resources}
        />
      )}

      {currentRoute === '/alerts' && (
        <AlertsPage
          alerts={alerts}
          initialAction={routeQuery.action}
          onCreateAlert={handleCreateAlert}
          onAcknowledgeAlert={handleAcknowledgeAlert}
        />
      )}

      {currentRoute === '/settings' && (
        <SettingsPage onResetDemoData={handleResetDemoData} />
      )}

      {currentRoute === '/audit-log' && (
        <AuditLogPage auditLogs={auditLogs} />
      )}
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
