import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RakshaProvider } from './context/RakshaContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { OperationalMapPage } from './pages/OperationalMapPage';
import { TeamsPage } from './pages/TeamsPage';
import { SheltersPage } from './pages/SheltersPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicBulletinPage } from './pages/PublicBulletinPage';

export const App: React.FC = () => {
  return (
    <RakshaProvider>
      <BrowserRouter>
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
            <Route path="audit" element={<AuditLogPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </RakshaProvider>
  );
};

export default App;
