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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertCount: number;
}

interface NavGroup {
  name: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  activeAlertCount,
}) => {
  const { role } = useAuth();

  const navGroups: NavGroup[] = [
    {
      name: 'OVERVIEW',
      items: [
        { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      name: 'OPERATIONS',
      items: [
        { id: '/incidents', label: 'Incidents', icon: AlertOctagon },
        { id: '/map', label: 'Live Map', icon: MapPin },
        { id: '/teams', label: 'Response Teams', icon: Users },
        { id: '/tasks', label: 'Tasks', icon: CheckSquare },
      ],
    },
    {
      name: 'RESOURCES',
      items: [
        { id: '/shelters', label: 'Shelters', icon: Home },
        { id: '/resources', label: 'Resources', icon: Box },
      ],
    },
    {
      name: 'INTELLIGENCE',
      items: [
        { id: '/analytics', label: 'Analytics', icon: BarChart3 },
        { id: '/alerts', label: 'Alerts', icon: Bell, badgeCount: activeAlertCount },
        { id: '/ai-intelligence', label: 'AI Intelligence', icon: Brain },
      ],
    },
    {
      name: 'ADMINISTRATION',
      items: [
        { id: '/settings', label: 'Settings', icon: Settings },
        { id: '/audit-log', label: 'Audit Log', icon: History },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-[#E4E3DC] transition-all duration-200 flex flex-col shadow-xs ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#E4E3DC] shrink-0 bg-white">
        <button
          type="button"
          onClick={() => onNavigate('/dashboard')}
          className="flex items-center gap-2.5 text-left group overflow-hidden"
          title="RakshaGrid Disaster Intelligence"
        >
          <div className="w-8 h-8 rounded-lg bg-[#315C46] flex items-center justify-center text-white shrink-0 shadow-xs group-hover:bg-[#264937] transition-colors">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-[#171B19] truncate">
                RakshaGrid
              </span>
              <span className="text-[10px] text-[#777D77] font-medium tracking-wide truncate">
                Disaster Intelligence
              </span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF] transition-colors hidden md:flex shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.name} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-[#777D77] uppercase select-none">
                {group.name}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = currentRoute === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg transition-colors group relative ${
                    isActive
                      ? 'bg-[#E5EDE6] text-[#315C46] font-semibold'
                      : 'text-[#575D56] hover:text-[#171B19] hover:bg-[#F5F4EF]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#315C46]' : 'text-[#777D77] group-hover:text-[#171B19]'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold font-mono rounded-full bg-[#B9433D] text-white tabular-nums">
                      {item.badgeCount}
                    </span>
                  )}

                  {isCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B9433D]" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Operational Readiness Indicator Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#E4E3DC] bg-[#FAF9F5] text-xs">
          <div className="flex items-center justify-between text-[11px] text-[#777D77]">
            <span className="flex items-center gap-1.5 font-medium text-[#315C46]">
              <span className="w-2 h-2 rounded-full bg-[#315C46] animate-pulse" />
              Node Active
            </span>
            <span className="font-mono text-[10px] text-[#777D77]">UTC Synced</span>
          </div>
        </div>
      )}
    </aside>
  );
};
