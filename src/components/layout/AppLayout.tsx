import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AlertTriangle, X } from 'lucide-react';
import { useRaksha } from '../../context/RakshaContext';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, updateSettings } = useRaksha();

  return (
    <div className="min-h-screen bg-charcoal text-primary flex flex-col antialiased selection:bg-emergency selection:text-white">
      {/* Top Demo Mode Operational Disclaimer Strip */}
      {!settings.demoModeNoticeDismissed && (
        <div className="bg-hazard/10 border-b border-hazard/30 px-3 py-1 text-[11px] font-mono text-hazard flex items-center justify-between select-none">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse text-hazard" />
            <span className="truncate">
              <strong>DEMO ENVIRONMENT — NOT AUTHENTICATED:</strong> Phase 1 operational prototype with simulated local data. No actual emergency alerts or telecommunications are dispatched.
            </span>
          </div>
          <button
            onClick={() => updateSettings({ demoModeNoticeDismissed: true })}
            className="p-0.5 hover:bg-hazard/20 rounded text-hazard ml-2"
            title="Dismiss banner for current session"
            aria-label="Dismiss banner"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${collapsed ? 'md:pl-16' : 'md:pl-64'}`}>
          <Header
            isSidebarOpen={mobileOpen}
            onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          />

          <main className="flex-1 p-3 md:p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

