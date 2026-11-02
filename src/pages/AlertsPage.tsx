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
  ShieldCheck,
  Clock,
  MapPin,
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
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Protocol: OASIS CAP v1.2</span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">Gateway Operational</span>
            <span>·</span>
            <span>Active Broadcasts: {alerts.length}</span>
          </div>
        }
        actions={
          permissions.canBroadcastAlert ? (
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B9433D] hover:bg-[#9E3934] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Radio className="w-3.5 h-3.5 text-white" />
              <span>Broadcast Warning</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter strip */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E4E3DC] shadow-xs">
        <span className="text-xs font-semibold text-[#777D77] px-2">Filter Severity:</span>
        {['all', 'emergency', 'warning', 'watch', 'advisory'].map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setFilterSeverity(sev)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${
              filterSeverity === sev
                ? 'bg-[#E5EDE6] text-[#315C46] font-semibold'
                : 'text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF]'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Broadcast Grid and Status */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-2xl border transition-colors shadow-xs bg-white ${
              alert.severity === 'emergency'
                ? 'border-l-4 border-l-[#B9433D] border-[#E4E3DC]'
                : alert.severity === 'warning'
                ? 'border-l-4 border-l-[#C18A32] border-[#E4E3DC]'
                : 'border-l-4 border-l-[#315C46] border-[#E4E3DC]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#171B19]">{alert.id}</span>
                  <SeverityBadge severity={alert.severity} size="sm" />
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F4EF] text-[#777D77] font-semibold uppercase border border-[#E4E3DC]">
                    {alert.disasterType}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E5EDE6] text-[#315C46] font-medium border border-[#315C46]/30">
                    CAP Status: {alert.capStatus}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#171B19]">{alert.title}</h3>
                <p className="text-xs text-[#171B19] leading-relaxed max-w-3xl">{alert.message}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#777D77] pt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#315C46]" />
                    <span>Target: {alert.targetRegion}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#777D77]" />
                    <span>Issued: {new Date(alert.issuedAt).toLocaleString()}</span>
                  </div>
                  <span>·</span>
                  <span>Expires: {new Date(alert.expiresAt).toLocaleTimeString()}</span>
                  <span>·</span>
                  <span>Author: {alert.authorRole}</span>
                </div>

                {/* Broadcast Channels */}
                <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-[#777D77] uppercase mr-1">Transmitted via:</span>
                  {alert.broadcastChannels.map((ch, idx) => (
                    <span
                      key={idx}
                      className="bg-[#F5F4EF] text-[#171B19] border border-[#E4E3DC] text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-[#315C46]" />
                      <span>{ch}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Acknowledge Button */}
              <div className="flex sm:flex-col items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E3DC] bg-[#F5F4EF] hover:bg-[#E5EDE6] text-[#315C46] text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="bg-white border border-[#E4E3DC] rounded-2xl p-8 text-center space-y-2 text-[#777D77]">
            <Radio className="w-8 h-8 text-[#315C46] mx-auto" />
            <h4 className="font-semibold text-sm text-[#171B19]">No Active Broadcasts</h4>
            <p className="text-xs max-w-sm mx-auto">There are currently no emergency warnings matching this severity level.</p>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171B19]/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E3DC] rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4E3DC] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#B9433D]" />
                <h3 className="font-bold text-base text-[#171B19]">Transmit OASIS CAP Emergency Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="text-[#777D77] hover:text-[#171B19] p-1 rounded-lg hover:bg-[#F5F4EF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <FormField label="Alert Headline / Title" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. EVACUATION DIRECTIVE: Cyclone Alert Phase 3"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl px-3.5 py-2 text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] focus:bg-white transition font-medium"
                />
              </FormField>

              <FormField label="Public Warning Text" required>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify threat details, affected zones, immediate evacuation routes, and designated shelters."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl px-3.5 py-2 text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] focus:bg-white transition"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Severity Level">
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
                    className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl px-3 py-2 text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] focus:bg-white transition font-medium"
                  >
                    <option value="emergency">Emergency (Red Threat)</option>
                    <option value="warning">Warning (Orange Threat)</option>
                    <option value="watch">Watch (Yellow Threat)</option>
                    <option value="advisory">Advisory (Informational)</option>
                  </select>
                </FormField>

                <FormField label="Disaster Category">
                  <select
                    value={formData.disasterType}
                    onChange={(e) => setFormData({ ...formData, disasterType: e.target.value as DisasterType })}
                    className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl px-3 py-2 text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] focus:bg-white transition font-medium"
                  >
                    <option value="cyclone">Cyclone / Severe Gale</option>
                    <option value="flood">Riverine / Coastal Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="landslide">Landslide / Debris Flow</option>
                    <option value="wildfire">Forest Wildfire</option>
                    <option value="industrial">Industrial Chemical Incident</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Target Region / Perimeter">
                  <input
                    type="text"
                    value={formData.targetRegion}
                    onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
                    className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl px-3.5 py-2 text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] focus:bg-white transition font-medium"
                  />
                </FormField>

                <FormField label="Validity Duration (Hours)">
                  <select
                    value={formData.expiresHours}
                    onChange={(e) => setFormData({ ...formData, expiresHours: e.target.value })}
                    className="w-full bg-[#F5F4EF] border border-[#E4E3DC] rounded-xl px-3 py-2 text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] focus:bg-white transition font-medium"
                  >
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="48">48 Hours</option>
                  </select>
                </FormField>
              </div>

              {/* Multi-Channel Distribution */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#171B19] block">
                  Broadcast Transmission Channels
                </label>
                <div className="space-y-2">
                  {availableChannels.map((ch) => {
                    const Icon = ch.icon;
                    const isChecked = formData.channels.includes(ch.id);
                    return (
                      <label
                        key={ch.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#E5EDE6] border-[#315C46]/50 text-[#171B19]'
                            : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleChannelToggle(ch.id)}
                          className="rounded border-[#E4E3DC] text-[#315C46] focus:ring-[#315C46]"
                        />
                        <Icon className={`w-4 h-4 ${isChecked ? 'text-[#315C46]' : 'text-[#777D77]'}`} />
                        <span className="text-xs font-medium">{ch.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E3DC]">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#B9433D] hover:bg-[#9E3934] text-white text-xs font-bold transition shadow-xs flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Authorize & Transmit Warning</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
