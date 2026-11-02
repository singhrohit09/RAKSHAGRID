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
    <div className="min-h-screen bg-[#F5F4EF] text-[#171B19]">
      {/* Top Advisory Strip */}
      <div className="bg-[#FAF2E6] border-b border-[#EED7B8] px-4 py-2.5 text-center text-xs text-[#C18A32] flex items-center justify-center gap-2">
        <Radio className="w-3.5 h-3.5 text-[#C18A32] animate-pulse shrink-0" />
        <span>
          <strong>PUBLIC EMERGENCY ADVISORY</strong> — Live synchronized bulletins from Disaster Coordination Center
        </span>
      </div>

      {/* Navigation */}
      <header className="border-b border-[#E4E3DC] bg-white/95 sticky top-0 z-30 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#315C46] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#171B19] tracking-tight">RakshaGrid</div>
              <div className="text-xs text-[#777D77]">Disaster Intelligence & Coordinated Response</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-medium text-[#777D77] hover:text-[#171B19] px-3 py-1.5 rounded-lg hover:bg-[#F5F4EF] transition-colors"
            >
              Personnel Sign In
            </button>
            <button
              type="button"
              onClick={onEnterCommand}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
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
          <div className="p-5 rounded-xl border border-[#E8C2BF] bg-[#F9EBEA] text-[#171B19] shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#B9433D] animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-[#B9433D]">
                CIVIL EMERGENCY ADVISORY
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#171B19] leading-snug">
              {criticalAlerts[0].title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#575D56] leading-relaxed max-w-4xl">
              {criticalAlerts[0].message}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[#777D77]">
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
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E3DC]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#315C46]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171B19]">
                  Current Hazard Situation
                </h3>
              </div>
              <span className="text-xs text-[#777D77]">
                {activeIncidents.length} active emergency incidents
              </span>
            </div>

            <div className="space-y-3">
              {activeIncidents.slice(0, 4).map((inc) => (
                <div
                  key={inc.id}
                  className="p-5 rounded-xl border border-[#E4E3DC] bg-white hover:border-[#D0CFC5] transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#315C46]">{inc.id}</span>
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </div>
                    <span className="text-xs text-[#777D77] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#777D77]" />
                      {new Date(inc.reportedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#171B19] mb-1">
                    {inc.title}
                  </h4>
                  <p className="text-xs text-[#777D77] leading-relaxed line-clamp-2">
                    {inc.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#E4E3DC] flex items-center justify-between text-xs text-[#777D77]">
                    <span className="flex items-center gap-1 truncate max-w-[280px]">
                      <MapPin className="w-3 h-3 text-[#777D77] shrink-0" />
                      {inc.location} ({inc.region})
                    </span>
                    <span className="text-[#315C46] font-semibold shrink-0">
                      ~{inc.affectedPopulation.toLocaleString()} citizens in zone
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Helplines & Safety Protocols */}
          <div className="space-y-6">
            {/* Helplines Card */}
            <div className="p-5 rounded-xl border border-[#E4E3DC] bg-white shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-[#315C46]">
                <PhoneCall className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171B19]">
                  Emergency Helplines (24x7)
                </h3>
              </div>

              <div className="space-y-3">
                {emergencyHelplines.map((line, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E4E3DC]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-[#171B19]">{line.label}</span>
                      <span className="text-sm font-bold font-mono text-[#315C46] tabular-nums">
                        {line.number}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#777D77] mt-0.5">{line.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Safety Protocols */}
            <div className="p-5 rounded-xl border border-[#E4E3DC] bg-white shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171B19] mb-2.5">
                Immediate Citizen Guidelines
              </h3>
              <ul className="text-xs text-[#575D56] space-y-2 list-disc list-inside leading-relaxed">
                <li>Move to designated concrete cyclone or flood shelters before wind speeds exceed 60 km/h.</li>
                <li>Keep battery-powered transistor radios tuned to All India Radio disaster bulletins.</li>
                <li>Do not attempt to cross submerged causeways or culverts.</li>
                <li>Disconnect main circuit breaker if flood waters enter residential plinths.</li>
              </ul>
            </div>

            {/* Responder CTA */}
            <div className="p-5 rounded-xl border border-[#E4E3DC] bg-[#FAF9F5] text-center shadow-xs">
              <Lock className="w-5 h-5 text-[#315C46] mx-auto mb-2" />
              <div className="text-xs font-bold text-[#171B19] uppercase tracking-wide">
                Emergency Response Command
              </div>
              <p className="text-xs text-[#777D77] mt-1 mb-3 leading-relaxed">
                Restricted operational access for commanders, relief teams, logistics officers, and analysts.
              </p>
              <button
                type="button"
                onClick={onEnterCommand}
                className="w-full py-2.5 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
              >
                Launch Command Center
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E4E3DC] py-6 px-4 text-center text-xs text-[#777D77] bg-white">
        <div>RakshaGrid Operations Node · National Emergency Communication Architecture</div>
        <div className="mt-1 text-[11px] text-[#999F99]">Disaster Intelligence. Coordinated Response. Safer Communities.</div>
      </footer>
    </div>
  );
};
