/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { Alert } from '../../types';
import { SeverityBadge } from './SeverityBadge';

interface NotificationCenterProps {
  alerts: Alert[];
  onAcknowledgeAlert?: (id: string) => void;
  onNavigateToAlerts?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  alerts,
  onAcknowledgeAlert,
  onNavigateToAlerts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledgedByCommander).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Alert notifications: ${unacknowledgedCount} unacknowledged`}
        className={`relative p-2 rounded transition-colors ${
          isOpen ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unacknowledgedCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161c24] border border-slate-750 rounded shadow-2xl z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-[#12171e]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
                Active Tactical Alerts
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              {unacknowledgedCount} Pending Ack
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No active broadcasts or warnings.
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 transition-colors ${
                    !alert.acknowledgedByCommander ? 'bg-slate-900/60' : 'hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} size="sm" />
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h5 className="text-xs font-medium text-slate-100 leading-snug line-clamp-2">
                    {alert.title}
                  </h5>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                      {alert.targetRegion}
                    </span>
                    {!alert.acknowledgedByCommander && onAcknowledgeAlert && (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Ack</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-slate-800 bg-[#12171e] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToAlerts?.();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Open Emergency Alerts Center</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
