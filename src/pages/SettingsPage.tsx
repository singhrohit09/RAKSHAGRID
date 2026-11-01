/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Layers,
  Database,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SettingsPageProps {
  onResetDemoData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onResetDemoData }) => {
  const { user, role, permissions } = useAuth();
  const [telemetryInterval, setTelemetryInterval] = useState('15s');
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManageSettings) return;
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const rolesMatrix: { role: Role; label: string; perms: Record<string, boolean> }[] = [
    {
      role: 'administrator',
      label: 'Administrator',
      perms: {
        'Report Incidents': true,
        'Edit Incidents': true,
        'Delete Records': true,
        'Broadcast Warnings': true,
        'Dispatch Forces': true,
        'Allocate Resources': true,
        'Manage Shelters': true,
        'System Settings': true,
        'Audit Inspection': true,
      },
    },
    {
      role: 'incident_commander',
      label: 'Incident Commander',
      perms: {
        'Report Incidents': true,
        'Edit Incidents': true,
        'Delete Records': false,
        'Broadcast Warnings': true,
        'Dispatch Forces': true,
        'Allocate Resources': true,
        'Manage Shelters': true,
        'System Settings': false,
        'Audit Inspection': true,
      },
    },
    {
      role: 'field_responder',
      label: 'Field Responder',
      perms: {
        'Report Incidents': true,
        'Edit Incidents': true,
        'Delete Records': false,
        'Broadcast Warnings': false,
        'Dispatch Forces': false,
        'Allocate Resources': false,
        'Manage Shelters': false,
        'System Settings': false,
        'Audit Inspection': false,
      },
    },
    {
      role: 'logistics_officer',
      label: 'Logistics Officer',
      perms: {
        'Report Incidents': false,
        'Edit Incidents': false,
        'Delete Records': false,
        'Broadcast Warnings': false,
        'Dispatch Forces': false,
        'Allocate Resources': true,
        'Manage Shelters': true,
        'System Settings': false,
        'Audit Inspection': false,
      },
    },
    {
      role: 'read_only_analyst',
      label: 'Read-Only Analyst',
      perms: {
        'Report Incidents': false,
        'Edit Incidents': false,
        'Delete Records': false,
        'Broadcast Warnings': false,
        'Dispatch Forces': false,
        'Allocate Resources': false,
        'Manage Shelters': false,
        'System Settings': false,
        'Audit Inspection': false,
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Agency Configuration & Operational Security"
        kicker="System Administration Node"
        description="Operational cadence configurations, telemetry polling frequencies, offline storage sync, and role access control matrix."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Terminal Version: Phase 1 Operational Foundation</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">Local Storage Mode</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="p-5 bg-[#12171e] border border-slate-800 rounded space-y-4">
            {!permissions.canManageSettings && (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/60 text-xs font-mono text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Read-Only Configuration: Modifying operational telemetry cadence and executing data resets requires Administrator role.</span>
              </div>
            )}
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-850">
              Terminal Runtime Parameters
            </h3>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                Telemetry Synchronization Cadence:
              </label>
              <select
                disabled={!permissions.canManageSettings}
                value={telemetryInterval}
                onChange={(e) => setTelemetryInterval(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80 disabled:opacity-50"
              >
                <option value="5s">Real-Time Polling (Every 5 seconds - High Battery)</option>
                <option value="15s">Standard Tactical Polling (Every 15 seconds - Recommended)</option>
                <option value="60s">Battery-Saver Emergency Mode (Every 60 seconds)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Determines situational map and alert stream re-query frequency.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-200">Local Offline Resilient Caching</div>
                  <div className="text-[11px] text-slate-500">
                    Cache active incident and shelter records in IndexedDB/LocalStorage for network dropouts.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!permissions.canManageSettings}
                  onClick={() => setOfflineSyncEnabled(!offlineSyncEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
                    offlineSyncEnabled ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-slate-950 w-4 h-4 rounded-full transition-transform ${
                      offlineSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-200">Acoustic Warning Sirens</div>
                  <div className="text-[11px] text-slate-500">
                    Play synthesized alert chime when new Critical / Emergency CAP warning is received.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!permissions.canManageSettings}
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
                    soundAlerts ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-slate-950 w-4 h-4 rounded-full transition-transform ${
                      soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Preferences Saved to Local Terminal</span>
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={!permissions.canManageSettings}
                className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Role-Based Access Control (RBAC) Matrix Reference */}
          <div className="p-5 bg-[#12171e] border border-slate-800 rounded space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-850 flex items-center justify-between">
              <span>Operational Role-Based Access Control (RBAC) Matrix</span>
              <span className="text-[10px] text-amber-400">Current Role: {role.toUpperCase()}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 text-[11px]">
                    <th className="py-2 px-2">Operational Role</th>
                    <th className="py-2 px-2 text-center">Incidents</th>
                    <th className="py-2 px-2 text-center">Delete</th>
                    <th className="py-2 px-2 text-center">Broadcast</th>
                    <th className="py-2 px-2 text-center">Forces</th>
                    <th className="py-2 px-2 text-center">Supplies</th>
                    <th className="py-2 px-2 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {rolesMatrix.map((r) => {
                    const isCurrent = r.role === role;
                    return (
                      <tr key={r.role} className={isCurrent ? 'bg-amber-500/10' : ''}>
                        <td className="py-2 px-2 font-medium text-slate-200">
                          {r.label} {isCurrent && <span className="text-amber-400 font-bold">(Active)</span>}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {r.perms['Report Incidents'] ? '✓' : '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {r.perms['Delete Records'] ? '✓' : '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {r.perms['Broadcast Warnings'] ? '✓' : '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {r.perms['Dispatch Forces'] ? '✓' : '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {r.perms['Allocate Resources'] ? '✓' : '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
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

        {/* Right Column: Phase 1 Sandbox & Demo Reset */}
        <div className="space-y-6">
          <div className="p-4 rounded border border-amber-800/60 bg-amber-950/20 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Database className="w-4 h-4" />
              <span>Phase 1 Sandbox Architecture</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              This terminal operates in verified Phase 1 Development Mode. All additions (incidents, dispatch updates, alerts, tasks) are held in resilient localStorage and survive page reloads.
            </p>
            <div className="pt-2 border-t border-amber-900/40 text-[11px] text-amber-400">
              Phase 2 Roadmap: PostgreSQL relational persistence via Cloud SQL and multi-agency cloud synchronization.
            </div>
          </div>

          <div className="p-4 rounded border border-rose-900/50 bg-[#161012] space-y-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
              <span>Factory Demo Reset</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restore initial disaster scenario data (Cyclone Ambar, Cuttack flooding, Kalimpong landslide, and pre-seeded response assets).
            </p>
            <button
              type="button"
              disabled={!permissions.canManageSettings}
              onClick={() => setConfirmResetOpen(true)}
              className="w-full mt-2 py-2 text-xs font-mono font-bold rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset All Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset Demo Dataset"
        message="This will restore all incidents, teams, shelters, tasks, resources, and alerts back to the original baseline scenario. All custom test entries will be cleared."
        confirmLabel="Reset to Initial Baseline"
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
