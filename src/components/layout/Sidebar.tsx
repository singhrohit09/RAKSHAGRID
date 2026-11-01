/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  AlertOctagon,
  MapPin,
  Users,
  Home,
  Box,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  History,
  Shield,
  Brain,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  activeAlertCount,
}) => {
  const { role } = useAuth();

  const navItems = [
    { id: '/dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
    { id: '/incidents', label: 'Incident Registry', icon: AlertOctagon },
    { id: '/map', label: 'Situational Map', icon: MapPin },
    { id: '/ai-intelligence', label: 'AI Disaster Intel', icon: Brain },
    { id: '/teams', label: 'Response Teams', icon: Users },
    { id: '/shelters', label: 'Evacuation Shelters', icon: Home },
    { id: '/resources', label: 'Resource Inventory', icon: Box },
    { id: '/tasks', label: 'Tactical Tasks', icon: CheckSquare },
    { id: '/analytics', label: 'Operations Analytics', icon: BarChart3 },
    { id: '/alerts', label: 'Alerts & Broadcast', icon: Bell, badgeCount: activeAlertCount },
    { id: '/settings', label: 'Agency Settings', icon: Settings },
    { id: '/audit-log', label: 'Operational Audit', icon: History },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0d1117] border-r border-slate-800 transition-all duration-200 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left group overflow-hidden"
          title="RakshaGrid"
        >
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 group-hover:border-amber-400 transition-colors">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-slate-100 uppercase font-mono truncate">
                RakshaGrid
              </span>
              <span className="text-[10px] text-slate-500 font-mono truncate">
                Disaster Ops Node
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors hidden md:flex shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Development Mode Notice Banner */}
      <div className="p-2 border-b border-slate-850 bg-amber-950/20">
        {isCollapsed ? (
          <div className="w-full text-center" title="Development Mode: Phase 1 Operational Protocol">
            <span className="text-[10px] font-mono font-bold text-amber-400">DEV</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/90 px-1">
            <span className="font-semibold tracking-wider">DEV PROTOCOL</span>
            <span className="text-[10px] text-amber-500/70">PHASE 1</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-xs font-medium rounded transition-colors group relative ${
                isActive
                  ? 'bg-slate-800/90 text-amber-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left whitespace-nowrap">
                  {item.label}
                </span>
              )}

              {item.badgeCount && item.badgeCount > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isCollapsed ? 'absolute top-1 right-1' : ''
                  } ${
                    item.id === '/alerts' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Public Bulletin Portal Link */}
      <div className="p-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => onNavigate('/?view=public')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 rounded hover:bg-slate-850/60 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Public Emergency Bulletin"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Public Emergency Portal</span>}
        </button>
      </div>

      {/* Operational Role Badge Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-[#0a0d12] text-[11px] font-mono">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-0.5">
            Active Role
          </div>
          <div className="text-amber-400 font-medium truncate capitalize">
            {role.replace(/_/g, ' ')}
          </div>
        </div>
      )}
    </aside>
  );
};
