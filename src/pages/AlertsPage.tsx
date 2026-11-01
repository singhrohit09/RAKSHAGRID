/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Radio,
  Plus,
  AlertTriangle,
  Check,
  Send,
  X,
  Volume2,
  Tv,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { Alert, AlertSeverity, DisasterType } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { FormField } from '../components/common/FormField';

interface AlertsPageProps {
  alerts: Alert[];
  initialAction?: string | null;
  onCreateAlert: (alert: Omit<Alert, 'id' | 'issuedAt'>) => void;
  onAcknowledgeAlert: (id: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  initialAction,
  onCreateAlert,
  onAcknowledgeAlert,
}) => {
  const { user, permissions } = useAuth();
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    if (initialAction === 'broadcast' && permissions.canBroadcastAlert) {
      setIsBroadcastOpen(true);
    }
  }, [initialAction, permissions.canBroadcastAlert]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: 'emergency' as AlertSeverity,
    disasterType: 'cyclone' as DisasterType,
    targetRegion: 'Paradip, Jagatsinghpur Coastal Districts',
    expiresHours: '24',
    capStatus: 'Actual' as 'Actual' | 'Exercise' | 'Draft',
    channels: ['Cell Broadcast (CB)', 'Public Siren Network', 'SMS Gateway'],
  });

  const availableChannels = [
    { id: 'Cell Broadcast (CB)', label: 'Cell Broadcast (CB-4370 High Priority)', icon: Smartphone },
    { id: 'Public Siren Network', label: 'Civil Defense Acoustic Siren Network', icon: Volume2 },
    { id: 'SMS Gateway', label: 'Mass SMS Push Gateway (Teleco Registry)', icon: MessageSquare },
    { id: 'All India Radio FM', label: 'All India Radio & Emergency FM Interrupt', icon: Tv },
  ];

  const handleChannelToggle = (ch: string) => {
    if (formData.channels.includes(ch)) {
      setFormData({ ...formData, channels: formData.channels.filter((c) => c !== ch) });
    } else {
      setFormData({ ...formData, channels: [...formData.channels, ch] });
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;

    const expiresAt = new Date(Date.now() + parseInt(formData.expiresHours, 10) * 3600 * 1000).toISOString();

    onCreateAlert({
      title: formData.title,
      message: formData.message,
      severity: formData.severity,
      disasterType: formData.disasterType,
      targetRegion: formData.targetRegion,
      expiresAt,
      authorRole: user ? `${user.name} (${user.agency})` : 'Disaster Command Node',
      capStatus: formData.capStatus,
      broadcastChannels: formData.channels,
    });

    setIsBroadcastOpen(false);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Emergency Warning & CAP Broadcast Node"
        kicker="Common Alerting Protocol (ITU-T X.1303)"
        description="Public safety warnings, multi-channel mass alert dispatches, evacuation directives, and siren triggers."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Protocol: OASIS CAP v1.2</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">Gateway Operational</span>
            <span>·</span>
            <span>Active Broadcasts: {alerts.length}</span>
          </div>
        }
        actions={
          permissions.canBroadcastAlert ? (
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-colors shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Broadcast Emergency Warning</span>
            </button>
          ) : undefined
        }
      />

      {/* Broadcast Grid and Status */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded border transition-colors ${
              alert.severity === 'emergency'
                ? 'border-rose-900/60 bg-[#160e11]'
                : alert.severity === 'warning'
                ? 'border-amber-900/60 bg-[#16120d]'
                : 'border-slate-800 bg-[#12171e]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">{alert.id}</span>
                <SeverityBadge severity={alert.severity} size="sm" />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 uppercase">
                  CAP: {alert.capStatus}
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {alert.disasterType}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Issued: {new Date(alert.issuedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="py-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1 leading-snug">
                {alert.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                {alert.message}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="text-slate-400">
                  Target Zone: <strong className="text-slate-200">{alert.targetRegion}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Transmitted across: {alert.broadcastChannels.join(' · ')}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!alert.acknowledgedByCommander ? (
                  <button
                    type="button"
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition-colors text-xs font-mono"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Commander Acknowledgment</span>
                  </button>
                ) : (
                  <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledged by Operational Command</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Modal Form */}
      {isBroadcastOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-[#161c24] border border-slate-750 rounded-lg shadow-2xl overflow-hidden p-5 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  Broadcast Civil Emergency Alert (CAP)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3.5">
              <FormField label="Alert Headline" required id="alt-title">
                <input
                  id="alt-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. FLASH RED: Pre-Emptive Evacuation Directive"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-rose-500/80"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="CAP Severity" required id="alt-sev">
                  <select
                    id="alt-sev"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500/80 uppercase"
                  >
                    <option value="emergency">Emergency (Take Immediate Action)</option>
                    <option value="warning">Warning (Prepare & Evacuate)</option>
                    <option value="advisory">Advisory (Public Caution)</option>
                  </select>
                </FormField>

                <FormField label="Disaster Category" required id="alt-dis">
                  <select
                    id="alt-dis"
                    value={formData.disasterType}
                    onChange={(e) => setFormData({ ...formData, disasterType: e.target.value as DisasterType })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500/80 uppercase"
                  >
                    <option value="cyclone">Cyclone</option>
                    <option value="flood">Flood</option>
                    <option value="landslide">Landslide</option>
                    <option value="industrial">Industrial / HazMat</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="medical">Medical Epidemic</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Target Geographical Perimeter" required id="alt-target">
                <input
                  id="alt-target"
                  type="text"
                  value={formData.targetRegion}
                  onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
                  placeholder="District, Municipal Wards, or Coastal Belt"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-rose-500/80"
                />
              </FormField>

              <FormField label="Public Warning Text" required id="alt-msg">
                <textarea
                  id="alt-msg"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter clear, concise instructions for citizens regarding evacuation, shelters, and danger areas..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-rose-500/80 resize-none"
                />
              </FormField>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                  Broadcast Transmission Channels:
                </label>
                <div className="space-y-1.5">
                  {availableChannels.map((ch) => {
                    const isChecked = formData.channels.includes(ch.id);
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleChannelToggle(ch.id)}
                        className={`w-full flex items-center justify-between p-2 rounded text-xs font-mono text-left transition-colors border ${
                          isChecked
                            ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{ch.label}</span>
                        </div>
                        <span className="text-[11px] font-bold">{isChecked ? 'ENABLED' : 'OFF'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono font-bold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit CAP Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
