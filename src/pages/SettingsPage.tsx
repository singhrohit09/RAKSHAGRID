/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle,
  Database,
  Lock,
  Radio,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SettingsPageProps {
  onResetDemoData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onResetDemoData }) => {
  const { role, permissions } = useAuth();
  const [telemetryInterval, setTelemetryInterval] = useState('15s');
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const rolesMatrix: { role: Role; label: string; perms: Record<string, boolean> }[] = [
    {
      role: 'administrator',
      label: 'Administrator',
      perms: {
        'Report Incidents': true,
        'Delete Records': true,
        'Broadcast Warnings': true,
        'Dispatch Forces': true,
        'Allocate Resources': true,
        'Audit Inspection': true,
      },
    },
    {
      role: 'incident_commander',
      label: 'Incident Commander',
      perms: {
        'Report Incidents': true,
        'Delete Records': false,
        'Broadcast Warnings': true,
        'Dispatch Forces': true,
        'Allocate Resources': true,
        'Audit Inspection': true,
      },
    },
    {
      role: 'field_responder',
      label: 'Field Responder',
      perms: {
        'Report Incidents': true,
        'Delete Records': false,
        'Broadcast Warnings': false,
        'Dispatch Forces': false,
        'Allocate Resources': false,
        'Audit Inspection': false,
      },
    },
    {
      role: 'logistics_officer',
      label: 'Logistics Officer',
      perms: {
        'Report Incidents': true,
        'Delete Records': false,
        'Broadcast Warnings': false,
        'Dispatch Forces': false,
        'Allocate Resources': true,
        'Audit Inspection': false,
      },
    },
    {
      role: 'read_only_analyst',
      label: 'Read-only Analyst',
      perms: {
        'Report Incidents': false,
        'Delete Records': false,
        'Broadcast Warnings': false,
        'Dispatch Forces': false,
        'Allocate Resources': false,
        'Audit Inspection': true,
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Agency Configuration & Security"
        kicker="System Administration"
        description="Operational cadence configurations, telemetry polling frequencies, offline storage sync, and role access control matrix."
        metadata={
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>RakshaGrid Operational Node v2.4</span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">Synchronized Mode Active</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="p-6 bg-white border border-[#E4E3DC] rounded-xl shadow-xs space-y-5">
            {!permissions.canManageSettings && (
              <div className="p-3 rounded-lg bg-[#FAF2E6] border border-[#EED7B8] text-xs text-[#C18A32] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C18A32] shrink-0" />
                <span>Read-Only Configuration: Modifying operational telemetry cadence requires Administrator permissions.</span>
              </div>
            )}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171B19] pb-2 border-b border-[#E4E3DC]">
              Operational Runtime Parameters
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#171B19] uppercase tracking-wider mb-1.5">
                Telemetry Synchronization Cadence:
              </label>
              <select
                disabled={!permissions.canManageSettings}
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] disabled:opacity-50"
              >
                <option value="5s">High-Frequency Polling (Every 5 seconds - Real-time)</option>
                <option value="15s">Standard Tactical Polling (Every 15 seconds - Recommended)</option>
                <option value="60s">Battery-Saver Field Mode (Every 60 seconds)</option>
              </select>
              <p className="mt-1 text-xs text-[#777D77]">
                Determines situational map and incident stream re-query frequency.
              </p>
            </div>

            <div className="pt-3 border-t border-[#E4E3DC] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#171B19]">Local Offline Resilient Caching</div>
                  <div className="text-xs text-[#777D77]">
                    Cache active incident and shelter records locally for network dropout resilience.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!permissions.canManageSettings}
                  onClick={() => setOfflineSyncEnabled(!offlineSyncEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
                    offlineSyncEnabled ? 'bg-[#315C46]' : 'bg-[#E4E3DC]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                      offlineSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#171B19]">Acoustic Warning Sirens</div>
                  <div className="text-xs text-[#777D77]">
                    Play synthesized alert chime when new Critical or Emergency CAP warnings are received.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!permissions.canManageSettings}
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
                    soundAlerts ? 'bg-[#315C46]' : 'bg-[#E4E3DC]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                      soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E3DC] flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs text-[#315C46] font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Preferences Synchronized Successfully</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={!permissions.canManageSettings}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Role-Based Access Control (RBAC) Matrix Reference */}
          <div className="p-6 bg-white border border-[#E4E3DC] rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171B19] pb-2 border-b border-[#E4E3DC] flex items-center justify-between">
              <span>Operational Access Control (RBAC) Matrix</span>
              <span className="text-xs text-[#315C46] font-mono">Current: {role.toUpperCase()}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E4E3DC] text-[#777D77] text-[11px] font-semibold uppercase">
                    <th className="py-2.5 px-2">Operational Role</th>
                    <th className="py-2.5 px-2 text-center">Incidents</th>
                    <th className="py-2.5 px-2 text-center">Delete</th>
                    <th className="py-2.5 px-2 text-center">Broadcast</th>
                    <th className="py-2.5 px-2 text-center">Forces</th>
                    <th className="py-2.5 px-2 text-center">Supplies</th>
                    <th className="py-2.5 px-2 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E3DC]">
                  {rolesMatrix.map((r) => {
                    const isCurrent = r.role === role;
                    return (
                      <tr key={r.role} className={isCurrent ? 'bg-[#E5EDE6]/40 font-semibold' : ''}>
                        <td className="py-2.5 px-2 text-[#171B19]">
                          {r.label} {isCurrent && <span className="text-[#315C46] font-bold text-[10px] ml-1">(Active)</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#315C46]">
                          {r.perms['Report Incidents'] ? '✓' : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#315C46]">
                          {r.perms['Delete Records'] ? '✓' : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#315C46]">
                          {r.perms['Broadcast Warnings'] ? '✓' : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#315C46]">
                          {r.perms['Dispatch Forces'] ? '✓' : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#315C46]">
                          {r.perms['Allocate Resources'] ? '✓' : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#315C46]">
                          {r.perms['Audit Inspection'] ? '✓' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Storage Architecture & Data Reset */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-[#E4E3DC] bg-white text-xs space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#315C46] font-bold text-xs uppercase tracking-wide">
              <Database className="w-4 h-4" />
              <span>Resilient Storage Architecture</span>
            </div>
            <p className="text-[#575D56] leading-relaxed">
              This terminal synchronizes all incident dispatches, alert broadcasts, shelter occupancies, and task completions to resilient local operational cache. Data survives network dropouts and page reloads.
            </p>
            <div className="pt-2 border-t border-[#E4E3DC] text-[11px] text-[#777D77]">
              Multi-agency telemetry stream active via encrypted command bus.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[#E8C2BF] bg-[#F9EBEA] space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[#B9433D] font-bold text-xs uppercase tracking-wide">
              <RotateCcw className="w-4 h-4" />
              <span>Baseline Scenario Reset</span>
            </div>
            <p className="text-xs text-[#575D56] leading-relaxed">
              Restore initial disaster scenario data (Cyclone Ambar, Cuttack flooding, Kalimpong landslide, and pre-seeded tactical assets).
            </p>
            <button
              type="button"
              disabled={!permissions.canManageSettings}
              onClick={() => setConfirmResetOpen(true)}
              className="w-full mt-2 py-2 px-3 text-xs font-semibold rounded-lg bg-[#B9433D] hover:bg-[#9E3530] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              Reset to Scenario Baseline
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset Scenario Dataset"
        message="This will restore all incidents, response teams, shelters, tasks, resources, and alert streams back to the original baseline scenario. Any test entries will be cleared."
        confirmLabel="Reset Baseline Data"
        isDestructive
        onConfirm={() => {
          onResetDemoData();
          setConfirmResetOpen(false);
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};
