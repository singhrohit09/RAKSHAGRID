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
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen ? 'bg-[#F5F4EF] text-[#171B19]' : 'text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF]'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unacknowledgedCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B9433D]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E4E3DC] rounded-xl shadow-xl z-50 text-[#171B19] overflow-hidden">
          <div className="flex items-center justify-between p-3.5 border-b border-[#E4E3DC] bg-[#FAF9F5]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C18A32]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#171B19]">
                Active Emergency Alerts
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[#777D77]">
              {unacknowledgedCount} Pending
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E3DC]">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#777D77]">
                No active broadcasts or warnings.
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 transition-colors ${
                    !alert.acknowledgedByCommander ? 'bg-[#FAF9F5]' : 'hover:bg-[#F5F4EF]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} size="sm" />
                    <span className="text-[10px] font-mono text-[#777D77]">
                      {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h5 className="text-xs font-medium text-[#171B19] leading-snug line-clamp-2">
                    {alert.title}
                  </h5>
                  <p className="mt-1 text-[11px] text-[#777D77] line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#777D77] truncate max-w-[180px]">
                      {alert.targetRegion}
                    </span>
                    {!alert.acknowledgedByCommander && onAcknowledgeAlert && (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#315C46] hover:text-[#264937] transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-[#E4E3DC] bg-[#FAF9F5] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToAlerts?.();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#315C46] hover:text-[#264937] transition-colors"
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
