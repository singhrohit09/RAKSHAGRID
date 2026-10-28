import React, { useState, useEffect } from 'react';
import { useRaksha } from '../../context/RakshaContext';
import { PersonaSelector } from './PersonaSelector';
import { 
  Bell, 
  RotateCcw, 
  Search, 
  Clock, 
  Radio, 
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { 
    settings, 
    notifications, 
    markNotificationAsRead, 
    clearAllNotifications, 
    resetDemoData,
    incidents,
    teams,
    shelters,
    backendConnected,
    isDemoMode
  } = useRaksha();

  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live operational clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !settings.use24HourFormat
      });
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      });
      setCurrentTime(`${dateStr} • ${timeStr} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.use24HourFormat]);

  // Global search lookup across incidents, teams, shelters
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    const results: { type: string; title: string; link: string }[] = [];

    incidents.forEach(inc => {
      if (inc.title.toLowerCase().includes(q) || inc.id.toLowerCase().includes(q) || inc.locationName.toLowerCase().includes(q)) {
        results.push({ type: 'Incident', title: `${inc.id}: ${inc.title}`, link: '/incidents' });
      }
    });

    teams.forEach(t => {
      if (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.skills.some(s => s.toLowerCase().includes(q))) {
        results.push({ type: 'Team', title: `${t.name} (${t.status})`, link: '/teams' });
      }
    });

    shelters.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.region.toLowerCase().includes(q)) {
        results.push({ type: 'Shelter', title: `${s.name} (${s.currentOccupancy}/${s.capacity})`, link: '/shelters' });
      }
    });

    setSearchResults(results.slice(0, 6));
    setIsSearching(true);
  }, [searchQuery, incidents, teams, shelters]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="h-14 bg-panel border-b border-border flex items-center justify-between px-3 md:px-5 sticky top-0 z-30 select-none">
        {/* Left: Mobile Toggle & Regional Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded hover:bg-panel-subtle text-primary-muted md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-primary-muted bg-panel-elevated px-2.5 py-1 rounded border border-border">
            <Radio className="w-3.5 h-3.5 text-safe animate-pulse" />
            <span className="text-primary font-semibold">{settings.operatingRegion}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-primary-dim">
            <Clock className="w-3.5 h-3.5 text-primary-muted" />
            <span>{currentTime}</span>
          </div>

          <div 
            className="hidden md:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-panel-elevated"
            title={backendConnected && !isDemoMode ? "Live PostgreSQL/SQLite relational backend connected with session authentication" : "Operating in standalone local demo simulation"}
          >
            <span className={`w-2 h-2 rounded-full ${backendConnected && !isDemoMode ? 'bg-safe animate-pulse' : 'bg-hazard'}`} />
            <span className={backendConnected && !isDemoMode ? 'text-safe font-semibold' : 'text-hazard font-semibold'}>
              {backendConnected && !isDemoMode ? 'LIVE API' : 'DEMO MODE'}
            </span>
          </div>
        </div>

        {/* Center: Quick Search */}
        <div className="relative max-w-xs md:max-w-md w-full mx-2 hidden sm:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
            <input
              type="text"
              placeholder="Search incidents, teams, shelters (e.g. INC, flood)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none focus:border-border-subtle font-sans"
            />
          </div>

          {/* Search Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-panel-elevated border border-border rounded shadow-xl py-1 z-50">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    navigate(res.link);
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-panel-subtle flex items-center justify-between text-primary-muted hover:text-primary"
                >
                  <span className="truncate">{res.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal border border-border text-primary-dim">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions, Public Link, Notifications, Persona Switcher */}
        <div className="flex items-center gap-2">
          {/* Public Bulletin Link */}
          <Link
            to="/public"
            target="_blank"
            className="hidden xl:inline-flex items-center gap-1.5 text-xs font-medium text-operational-cyan px-2.5 py-1.5 rounded hover:bg-operational-cyan/10 border border-operational-cyan/30 transition-colors"
            title="Open Public Warning Bulletin"
          >
            <span>Public Bulletin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => setIsResetOpen(true)}
            className="p-1.5 rounded text-primary-muted hover:text-hazard hover:bg-hazard/10 transition-colors"
            title="Reset All Demo Data to Baseline"
            aria-label="Reset demo data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Notifications Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle relative transition-colors"
              aria-label="View demo notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emergency animate-pulse" />
              )}
            </button>

            {/* Notifications Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-panel border border-border rounded-lg shadow-2xl py-2 z-50">
                <div className="flex items-center justify-between px-3 pb-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-primary">Demo Notifications</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-panel-subtle border border-border text-primary-muted">
                      Simulated
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] text-primary-dim hover:text-primary transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-primary-dim">
                      No active alerts or notifications.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 text-xs cursor-pointer hover:bg-panel-subtle transition-colors ${
                          !n.read ? 'bg-panel-elevated/80' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold ${n.type === 'emergency' ? 'text-emergency' : n.type === 'warning' ? 'text-hazard' : 'text-primary'}`}>
                            {n.title}
                          </span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emergency" />}
                        </div>
                        <p className="text-primary-muted text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Persona Switcher */}
          <PersonaSelector />
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={resetDemoData}
        title="Reset All Demo Data to Baseline?"
        message="This will re-initialize all incidents, response teams, shelters, resources, tasks, and audit records back to the initial scenario baseline. Any custom entries created during this session will be replaced."
        confirmLabel="Reset Demo Scenario"
        variant="danger"
      />
    </>
  );
};
