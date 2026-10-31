import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Flame, 
  Map as MapIcon, 
  Users, 
  Home, 
  Boxes, 
  KanbanSquare, 
  AlertTriangle, 
  BarChart3, 
  History, 
  BrainCircuit,
  Settings as SettingsIcon, 
  Globe2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useRaksha } from '../../context/RakshaContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose
}) => {
  const { incidents, tasks, alerts, resources } = useRaksha();

  const activeIncidentsCount = incidents.filter(i => i.status === 'Active' || i.status === 'Reported').length;
  const criticalCount = incidents.filter(i => i.severity === 'Critical').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'In Progress' || t.status === 'Ready').length;
  const lowResourcesCount = resources.filter(r => r.status === 'Low Stock' || r.status === 'Critical' || r.status === 'Depleted').length;
  const activeAlertsCount = alerts.filter(a => a.status === 'Approved for Demo' || a.status === 'Ready for Review').length;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Operational Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: criticalCount > 0 ? `${criticalCount} crit` : undefined,
      badgeColor: 'bg-emergency/20 text-emergency border border-emergency/40'
    },
    {
      to: '/incidents',
      label: 'Incident Registry',
      shortLabel: 'Incidents',
      icon: Flame,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeColor: 'bg-hazard/20 text-hazard border border-hazard/40'
    },
    {
      to: '/map',
      label: 'Operational Map',
      shortLabel: 'Live Map',
      icon: MapIcon
    },
    {
      to: '/teams',
      label: 'Response Teams',
      shortLabel: 'Teams',
      icon: Users
    },
    {
      to: '/shelters',
      label: 'Shelter Management',
      shortLabel: 'Shelters',
      icon: Home
    },
    {
      to: '/resources',
      label: 'Resource Inventory',
      shortLabel: 'Inventory',
      icon: Boxes,
      badge: lowResourcesCount > 0 ? `${lowResourcesCount} low` : undefined,
      badgeColor: 'bg-hazard/20 text-hazard border border-hazard/40'
    },
    {
      to: '/tasks',
      label: 'Response Task Board',
      shortLabel: 'Task Board',
      icon: KanbanSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-panel-subtle text-primary-muted border border-border'
    },
    {
      to: '/alerts',
      label: 'Emergency Alerts',
      shortLabel: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-emergency/20 text-emergency border border-emergency/40'
    },
    {
      to: '/analytics',
      label: 'Operational Analytics',
      shortLabel: 'Analytics',
      icon: BarChart3
    },
    {
      to: '/ai-intelligence',
      label: 'AI Intelligence Center',
      shortLabel: 'AI Intel',
      icon: BrainCircuit,
      badge: 'AI',
      badgeColor: 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40'
    },
    {
      to: '/audit',
      label: 'Audit & Activity Log',
      shortLabel: 'Audit Log',
      icon: History
    },
    {
      to: '/settings',
      label: 'System Settings',
      shortLabel: 'Settings',
      icon: SettingsIcon
    },
    {
      to: '/public',
      label: 'Public Bulletin',
      shortLabel: 'Public',
      icon: Globe2
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-charcoal/80 z-40 md:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 bg-panel border-r border-border flex flex-col transition-all duration-200
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-border bg-panel-card">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded bg-emergency/15 border border-emergency/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-emergency" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-wider text-primary block leading-tight">
                  RAKSHA<span className="text-emergency">GRID</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-primary-dim uppercase block">
                  Disaster Intelligence
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded text-primary-dim hover:text-primary hover:bg-panel-subtle transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                className={({ isActive }) => `
                  flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors group
                  ${isActive 
                    ? 'bg-panel-subtle text-primary border-l-2 border-emergency font-semibold shadow-sm' 
                    : 'text-primary-muted hover:text-primary hover:bg-panel-elevated'}
                `}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 shrink-0 text-primary-muted group-hover:text-primary" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded shrink-0 ${item.badgeColor || 'bg-panel-card text-primary-dim border border-border'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Mode Safety Footer */}
        <div className="p-3 border-t border-border bg-charcoal/60">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-hazard uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-hazard animate-ping" />
                  DEMO MODE
                </span>
                <span className="text-[9px] font-mono text-primary-dim">v1.0-P1</span>
              </div>
              <p className="text-[10px] text-primary-dim leading-tight">
                Simulated data. Not authenticated. No real emergency alerts transmitted.
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title="DEMO MODE — NOT AUTHENTICATED">
              <span className="w-2 h-2 rounded-full bg-hazard" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

