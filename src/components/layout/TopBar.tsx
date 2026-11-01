/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  Menu,
  ChevronDown,
  UserCheck,
  LogOut,
  ShieldAlert,
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

  // Compute breadcrumb
  const getBreadcrumbs = () => {
    const routeMap: Record<string, string> = {
      '/': 'Public Emergency Bulletin',
      '/dashboard': 'Command Center / Operational Overview',
      '/incidents': 'Emergency Operations / Incident Registry',
      '/map': 'Geospatial Intelligence / Situational Map',
      '/teams': 'Resource Coordination / Response Teams',
      '/shelters': 'Humanitarian Logistics / Evacuation Shelters',
      '/resources': 'Logistics & Supply / Resource Stockpile',
      '/tasks': 'Tactical Dispatch / Field Task Board',
      '/analytics': 'Decision Support / Operations Analytics',
      '/alerts': 'Early Warning / Public Broadcast & CAP',
      '/settings': 'Configuration / Operational Protocols',
      '/audit-log': 'Compliance & Audit / Activity Trail',
    };
    return routeMap[currentRoute] || 'Operations';
  };

  const rolesList: { id: Role; label: string }[] = [
    { id: 'incident_commander', label: 'Incident Commander' },
    { id: 'administrator', label: 'Administrator' },
    { id: 'field_responder', label: 'Field Responder' },
    { id: 'logistics_officer', label: 'Logistics Officer' },
    { id: 'read_only_analyst', label: 'Read-only Analyst' },
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-14 bg-[#0d1117]/95 backdrop-blur-xs border-b border-slate-800 transition-all duration-200 flex items-center justify-between px-4 sm:px-6 ${
        isSidebarCollapsed ? 'left-16' : 'left-0 md:left-60'
      }`}
    >
      {/* Left zone: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-850 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 truncate">
          <span className="text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">
            RakshaGrid
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-200 font-medium truncate">
            {getBreadcrumbs()}
          </span>
        </div>
      </div>

      {/* Right zone: Global Search, Quick Actions, Alerts, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 hover:text-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Search registry...</span>
          <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Report Incident (permission aware) */}
        {permissions.canCreateIncident && (
          <button
            type="button"
            onClick={() => onNavigate('/incidents?action=create')}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs"
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
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Broadcast Alert</span>
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
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded border border-slate-800 bg-slate-900/60 hover:bg-slate-850 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-300 font-mono text-xs font-bold shrink-0">
              {user ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'U'}
            </div>
            <div className="hidden md:flex flex-col min-w-0 pr-1">
              <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                {user ? user.name : 'Terminal User'}
              </span>
              <span className="text-[10px] font-mono text-amber-400/90 capitalize truncate">
                {role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#161c24] border border-slate-750 rounded shadow-2xl z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Card Header */}
              <div className="p-3.5 border-b border-slate-800 bg-[#12171e]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-100">{user?.name}</span>
                  <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700 uppercase">
                    {user?.badgeNumber || 'AUTH'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{user?.agency}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">{user?.email}</div>
              </div>

              {/* Persona / Role Selector */}
              <div className="p-3 border-b border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Switch Operational Persona</span>
                  <span className="text-amber-500/80">Dev Mode</span>
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 capitalize truncate">
                            {p.role.replace(/_/g, ' ')}
                          </div>
                        </div>
                        {isSelected && <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 bg-[#12171e]">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                    onNavigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
