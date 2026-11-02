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
  X,
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
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

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
  activeAlertCount,
}) => {
  if (!isOpen) return null;

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

  const handleSelect = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs md:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-72 max-w-[85%] bg-white border-r border-[#E4E3DC] h-full flex flex-col p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#315C46] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#171B19]">RakshaGrid</div>
              <div className="text-[10px] text-[#777D77] font-medium">Disaster Intelligence</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded-md text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.name} className="space-y-1">
              <div className="px-3 pt-1 pb-1 text-[10px] font-semibold tracking-wider text-[#777D77] uppercase select-none">
                {group.name}
              </div>
              {group.items.map((item) => {
                const isActive = currentRoute === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#E5EDE6] text-[#315C46] font-semibold'
                        : 'text-[#575D56] hover:text-[#171B19] hover:bg-[#F5F4EF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#315C46]' : 'text-[#777D77]'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold font-mono rounded-full bg-[#B9433D] text-white tabular-nums">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Public Portal Switcher */}
        <div className="pt-3 border-t border-[#E4E3DC]">
          <button
            type="button"
            onClick={() => handleSelect('/')}
            className="w-full py-2 px-3 rounded-lg border border-[#E4E3DC] bg-[#FAF9F5] text-xs font-medium text-[#171B19] hover:bg-[#F5F4EF] text-center"
          >
            Public Emergency Bulletin
          </button>
        </div>
      </div>
    </div>
  );
};
