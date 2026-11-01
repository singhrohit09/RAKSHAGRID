/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { Incident, Team, Shelter, Resource, Task, Alert } from '../../types';

interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  incidents: Incident[];
  teams: Team[];
  shelters: Shelter[];
  resources: Resource[];
  tasks: Task[];
  alerts: Alert[];
  onAcknowledgeAlert: (id: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onNavigate,
  incidents,
  teams,
  shelters,
  resources,
  tasks,
  alerts,
  onAcknowledgeAlert,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeAlertCount = alerts.filter((a) => !a.acknowledgedByCommander).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeAlertCount={activeAlertCount}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        }`}
      >
        <TopBar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          alerts={alerts}
          onAcknowledgeAlert={onAcknowledgeAlert}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Viewport content */}
        <main className="flex-1 mt-14 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        incidents={incidents}
        teams={teams}
        shelters={shelters}
        resources={resources}
        tasks={tasks}
        onNavigate={onNavigate}
      />
    </div>
  );
};
