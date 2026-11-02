/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { Incident, Team, Shelter, Resource, Task, Alert } from '../../types';
import { WifiOff, Wifi } from 'lucide-react';

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
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeAlertCount = alerts.filter((a) => !a.acknowledgedByCommander).length;

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#171B19] flex">
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

        {/* Tactical Network Status Notification */}
        {!isOnline && (
          <div className="bg-[#FAF2E6] border-b border-[#EED7B8] px-4 py-2 flex items-center justify-between text-xs text-[#C18A32] mt-14 z-20">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-4 h-4 text-[#C18A32] animate-pulse shrink-0" />
              <span>Operating in resilient offline cache mode. Telemetry buffered locally.</span>
            </div>
            <span className="hidden sm:inline bg-white px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-[#EED7B8]">OFFLINE CACHE</span>
          </div>
        )}
        {isOnline && showReconnected && (
          <div className="bg-[#E5EDE6] border-b border-[#C8DACB] px-4 py-2 flex items-center justify-between text-xs text-[#315C46] mt-14 z-20">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-[#315C46] shrink-0" />
              <span>Connection restored. Emergency telemetry synchronized with operational grid.</span>
            </div>
            <span className="hidden sm:inline bg-white px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-[#C8DACB]">ONLINE</span>
          </div>
        )}

        {/* Viewport content */}
        <main className={`flex-1 ${!isOnline || showReconnected ? 'mt-2' : 'mt-14'} p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto`}>
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
