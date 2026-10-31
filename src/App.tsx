import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RakshaProvider } from './context/RakshaContext';
import { AppLayout } from './components/layout/AppLayout';
import { RouteLoadingFallback } from './components/common/RouteLoadingFallback';

// Lazy-loaded route components for optimized bundle splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage').then(m => ({ default: m.IncidentsPage })));
const OperationalMapPage = lazy(() => import('./pages/OperationalMapPage').then(m => ({ default: m.OperationalMapPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const SheltersPage = lazy(() => import('./pages/SheltersPage').then(m => ({ default: m.SheltersPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then(m => ({ default: m.ResourcesPage })));
const TaskBoardPage = lazy(() => import('./pages/TaskBoardPage').then(m => ({ default: m.TaskBoardPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PublicBulletinPage = lazy(() => import('./pages/PublicBulletinPage').then(m => ({ default: m.PublicBulletinPage })));
const AiIntelligencePage = lazy(() => import('./pages/AiIntelligencePage').then(m => ({ default: m.AiIntelligencePage })));

export const App: React.FC = () => {
  return (
    <RakshaProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public Emergency Bulletin Route */}
            <Route path="/public" element={<PublicBulletinPage />} />

            {/* Core Operations Command Center Shell */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="map" element={<OperationalMapPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="shelters" element={<SheltersPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="tasks" element={<TaskBoardPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="ai-intelligence" element={<AiIntelligencePage />} />
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </RakshaProvider>
  );
};

export default App;

