/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Shield,
  AlertTriangle,
  PhoneCall,
  Activity,
  ArrowRight,
  MapPin,
  Clock,
  Radio,
  Lock,
} from 'lucide-react';
import { Incident, Alert } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';

interface PublicPortalProps {
  incidents: Incident[];
  alerts: Alert[];
  onEnterCommand: () => void;
  onNavigateToLogin: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  incidents,
  alerts,
  onEnterCommand,
  onNavigateToLogin,
}) => {
  const criticalAlerts = alerts.filter((a) => a.severity === 'emergency' || a.severity === 'warning');
  const activeIncidents = incidents.filter((i) => i.status === 'active' || i.status === 'investigating');

  const emergencyHelplines = [
    { label: 'National Disaster Response Force (NDRF)', number: '1078', desc: 'Toll-free 24x7 control room' },
    { label: 'Unified Emergency Services', number: '112', desc: 'Police, Fire, and Ambulance dispatch' },
    { label: 'State Emergency Operations Centre (SEOC)', number: '1070', desc: 'State-level disaster escalation' },
    { label: 'Coastal Hazard Warning Line (IMD)', number: '1800 220 161', desc: 'Cyclone and maritime advisories' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Top Banner */}
      <div className="bg-amber-950/60 border-b border-amber-800/60 px-4 py-2.5 text-center text-xs font-mono text-amber-300 flex items-center justify-center gap-2">
        <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
        <span>
          <strong>PUBLIC EMERGENCY BULLETIN</strong> — Live updates from Disaster Response Coordination Node
        </span>
      </div>

      {/* Navigation */}
      <header className="border-b border-slate-800 bg-[#0d1117]/90 sticky top-0 z-30 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold font-mono text-slate-100 tracking-tight">RakshaGrid</div>
              <div className="text-[11px] text-slate-400 font-mono">Disaster Intelligence & Coordinated Response</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-mono text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
            >
              Personnel Sign In
            </button>
            <button
              type="button"
              onClick={onEnterCommand}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
            >
              <span>Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Alert Strip */}
        {criticalAlerts.length > 0 && (
          <div className="p-4 sm:p-5 rounded border border-rose-800/80 bg-rose-950/30 text-rose-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-300">
                ACTIVE CIVIL EMERGENCY WARNING
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              {criticalAlerts[0].title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
              {criticalAlerts[0].message}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs font-mono text-rose-300/80">
              <span>Target Region: {criticalAlerts[0].targetRegion}</span>
              <span>·</span>
              <span>Channels: {criticalAlerts[0].broadcastChannels.join(', ')}</span>
            </div>
          </div>
        )}

        {/* 2-Column Section: Active Incidents & Verified Helplines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Incidents Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
                  Current Hazard Situation
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {activeIncidents.length} active emergency records
              </span>
            </div>

            <div className="space-y-3">
              {activeIncidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded border border-slate-800 bg-[#12171e] hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{inc.id}</span>
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(inc.reportedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 mb-1">
                    {inc.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {inc.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-850 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1 truncate max-w-[280px]">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      {inc.location} ({inc.region})
                    </span>
                    <span className="text-amber-400/90 font-medium shrink-0">
                      ~{inc.affectedPopulation.toLocaleString()} affected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Helplines & Safety Protocols */}
          <div className="space-y-6">
            {/* Helplines Card */}
            <div className="p-4 rounded border border-slate-800 bg-[#12171e]">
              <div className="flex items-center gap-2 mb-3 text-amber-400">
                <PhoneCall className="w-4 h-4" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Emergency Helplines (24x7)
                </h3>
              </div>

              <div className="space-y-3">
                {emergencyHelplines.map((line, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-850">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-200">{line.label}</span>
                      <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                        {line.number}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{line.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Safety Protocols */}
            <div className="p-4 rounded border border-slate-800 bg-[#12171e]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 mb-2.5">
                Immediate Citizen Guidelines
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>Move to designated concrete cyclone / flood shelter before wind speeds exceed 60 km/h.</li>
                <li>Keep battery-powered transistor radios tuned to All India Radio disaster bulletins.</li>
                <li>Do not wade or drive across submerged causeways or culverts.</li>
                <li>Disconnect main circuit breaker if flood waters enter residential plinth.</li>
              </ul>
            </div>

            {/* Responder CTA */}
            <div className="p-4 rounded border border-slate-750 bg-slate-900/90 text-center">
              <Lock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-200 font-mono uppercase">
                Emergency Responder Terminal
              </div>
              <p className="text-[11px] text-slate-400 mt-1 mb-3">
                Restricted operational access for commanders, relief teams, logistics officers, and analysts.
              </p>
              <button
                type="button"
                onClick={onEnterCommand}
                className="w-full py-2 text-xs font-mono font-semibold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Launch Tactical Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs font-mono text-slate-500">
        <div>RakshaGrid Operations Node · National Emergency Communication Architecture</div>
        <div className="mt-1 text-[11px] text-slate-600">Challenge: AGENTCRAFT 2026 · Phase 1 Application Foundation</div>
      </footer>
    </div>
  );
};
