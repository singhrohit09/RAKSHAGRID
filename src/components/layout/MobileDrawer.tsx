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
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
  activeAlertCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
  activeAlertCount,
}) => {
  const { role } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { id: '/dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
    { id: '/incidents', label: 'Incident Registry', icon: AlertOctagon },
    { id: '/map', label: 'Situational Map', icon: MapPin },
    { id: '/teams', label: 'Response Teams', icon: Users },
    { id: '/shelters', label: 'Evacuation Shelters', icon: Home },
    { id: '/resources', label: 'Resource Inventory', icon: Box },
    { id: '/tasks', label: 'Tactical Tasks', icon: CheckSquare },
    { id: '/analytics', label: 'Operations Analytics', icon: BarChart3 },
    { id: '/alerts', label: 'Alerts & Broadcast', icon: Bell, badgeCount: activeAlertCount },
    { id: '/settings', label: 'Agency Settings', icon: Settings },
    { id: '/audit-log', label: 'Operational Audit', icon: History },
  ];

  const handleSelect = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-xs md:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-72 max-w-[85%] bg-[#0d1117] border-r border-slate-800 h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 font-mono">RakshaGrid</div>
              <div className="text-[10px] text-amber-400 font-mono">DEV MODE v1.0</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badgeCount && item.badgeCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Public portal link */}
        <div className="pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => handleSelect('/?view=public')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded hover:bg-slate-850"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Public Emergency Portal</span>
          </button>
          <div className="mt-2 text-[10px] font-mono text-slate-500 px-3">
            Active: <span className="text-amber-400 capitalize">{role.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
