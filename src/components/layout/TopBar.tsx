/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Menu,
  ChevronDown,
  UserCheck,
  LogOut,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../common/NotificationCenter';
import { Alert, Role } from '../../types';

interface TopBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
  alerts: Alert[];
  onAcknowledgeAlert: (id: string) => void;
  isSidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  onNavigate,
  onOpenSearch,
  onToggleMobileMenu,
  alerts,
  onAcknowledgeAlert,
  isSidebarCollapsed,
}) => {
  const { user, role, switchRole, logout, availablePersonas, permissions } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute clean breadcrumbs
  const getBreadcrumbs = () => {
    const routeMap: Record<string, { section: string; title: string }> = {
      '/': { section: 'Public', title: 'Emergency Advisory Bulletin' },
      '/dashboard': { section: 'Overview', title: 'Incident Command Dashboard' },
      '/incidents': { section: 'Operations', title: 'Incident Registry & Triage' },
      '/map': { section: 'Operations', title: 'Situational Map & Hazards' },
      '/teams': { section: 'Operations', title: 'Response Teams & Field Units' },
      '/tasks': { section: 'Operations', title: 'Task Dispatch & Workflows' },
      '/shelters': { section: 'Resources', title: 'Evacuation Shelters' },
      '/resources': { section: 'Resources', title: 'Stockpile & Equipment' },
      '/analytics': { section: 'Intelligence', title: 'Operational Analytics' },
      '/alerts': { section: 'Intelligence', title: 'Emergency Broadcast & Alerts' },
      '/ai-intelligence': { section: 'Intelligence', title: 'AI Disaster Intelligence' },
      '/settings': { section: 'Administration', title: 'Agency Configuration' },
      '/audit-log': { section: 'Administration', title: 'Security & Audit Log' },
    };
    return routeMap[currentRoute] || { section: 'Operations', title: 'Dashboard' };
  };

  const breadcrumb = getBreadcrumbs();

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-[#E4E3DC] transition-all duration-200 flex items-center justify-between px-4 sm:px-6 shadow-2xs ${
        isSidebarCollapsed ? 'left-16' : 'left-0 md:left-60'
      }`}
    >
      {/* Left zone: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="p-1.5 rounded-md text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF] md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-[#777D77] truncate">
          <span className="font-semibold text-[#315C46] hidden sm:inline">
            {breadcrumb.section}
          </span>
          <span className="text-[#C5C4BD] hidden sm:inline">/</span>
          <span className="text-[#171B19] font-medium truncate">
            {breadcrumb.title}
          </span>
        </div>
      </div>

      {/* Right zone: Global Search, Quick Actions, Alerts, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#777D77] bg-[#F5F4EF] border border-[#E4E3DC] rounded-lg hover:border-[#D0CFC5] hover:text-[#171B19] transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#777D77]" />
          <span>Search records...</span>
          <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E4E3DC] text-[#777D77] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Quick Report Incident (permission aware) */}
        {permissions.canCreateIncident && (
          <button
            type="button"
            onClick={() => onNavigate('/incidents?action=create')}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>
        )}

        {/* Quick Broadcast Alert (commander / admin) */}
        {permissions.canBroadcastAlert && (
          <button
            type="button"
            onClick={() => onNavigate('/alerts?action=broadcast')}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#FAF2E6] hover:bg-[#F3E5D0] text-[#C18A32] border border-[#EED7B8] transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-[#C18A32]" />
            <span>Issue Alert</span>
          </button>
        )}

        {/* Notifications */}
        <NotificationCenter
          alerts={alerts}
          onAcknowledgeAlert={onAcknowledgeAlert}
          onNavigateToAlerts={() => onNavigate('/alerts')}
        />

        {/* User Persona & Role Switcher */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#E4E3DC] bg-white hover:bg-[#F5F4EF] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-[#E5EDE6] text-[#315C46] flex items-center justify-center font-mono text-xs font-bold shrink-0">
              {user ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'U'}
            </div>
            <div className="hidden md:flex flex-col min-w-0 pr-1">
              <span className="text-xs font-medium text-[#171B19] truncate max-w-[130px]">
                {user ? user.name : 'Authorized User'}
              </span>
              <span className="text-[10px] text-[#777D77] capitalize truncate">
                {role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#777D77] hidden md:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E4E3DC] rounded-xl shadow-xl z-50 text-[#171B19] overflow-hidden">
              {/* Profile Card Header */}
              <div className="p-3.5 border-b border-[#E4E3DC] bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#171B19]">{user?.name}</span>
                  <span className="text-[10px] font-mono bg-[#E5EDE6] px-1.5 py-0.5 rounded text-[#315C46] font-medium">
                    {user?.badgeNumber || 'OPERATIONAL'}
                  </span>
                </div>
                <div className="text-[11px] text-[#777D77]">{user?.agency}</div>
                <div className="text-[11px] font-mono text-[#999F99] mt-0.5">{user?.email}</div>
              </div>

              {/* Persona / Role Selector */}
              <div className="p-3 border-b border-[#E4E3DC]">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-[#777D77] mb-2 flex items-center justify-between">
                  <span>Switch Operational Role</span>
                  <span className="text-[#315C46] font-medium lowercase">fast switch</span>
                </div>
                <div className="space-y-1">
                  {availablePersonas.map((p) => {
                    const isSelected = user?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          switchRole(p.role);
                          setIsProfileOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-[#E5EDE6] text-[#315C46] font-semibold'
                            : 'text-[#171B19] hover:bg-[#F5F4EF]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="text-[10px] text-[#777D77] capitalize truncate">
                            {p.role.replace(/_/g, ' ')}
                          </div>
                        </div>
                        {isSelected && <UserCheck className="w-3.5 h-3.5 text-[#315C46] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 bg-[#FAF9F5]">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                    onNavigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#B9433D] hover:bg-[#F9EBEA] rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
