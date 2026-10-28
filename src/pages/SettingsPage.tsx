import React, { useState } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Save, 
  MapPin, 
  Bell, 
  Clock, 
  Radio, 
  Check, 
  Database
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetDemoData, activePersonaId } = useRaksha();

  const [formState, setFormState] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const canChangeSettings = hasPermission(activePersonaId, 'change_settings');
  const canResetData = hasPermission(activePersonaId, 'reset_demo_data');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary-muted" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              SYSTEM CONFIGURATION & OPERATIONAL PREFERENCES
            </h1>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Configure regional jurisdiction, operational time display, default map views, and simulated feeds.
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-mono text-safe bg-safe/10 border border-safe/30 px-2.5 py-1 rounded flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> Preferences Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Application Identity */}
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-bold uppercase tracking-wider text-primary">
            <Radio className="w-4 h-4 text-hazard" />
            Operational Center & Jurisdiction
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-primary block mb-1">Emergency Operations Center (EOC) Name</label>
              <input
                type="text"
                value={formState.operationsCenterName}
                onChange={(e) => setFormState({ ...formState, operationsCenterName: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Designated District / Sector</label>
              <input
                type="text"
                value={formState.operatingRegion}
                onChange={(e) => setFormState({ ...formState, operatingRegion: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Display & Time Formatting */}
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-bold uppercase tracking-wider text-primary">
            <Clock className="w-4 h-4 text-operational-cyan" />
            Operational Time & Format
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-primary block mb-1">Time Zone Specification</label>
              <select
                value={formState.timeZone}
                onChange={(e) => setFormState({ ...formState, timeZone: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST • UTC+05:30)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Military 24-Hour Time Format</label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-primary">
                  <input
                    type="radio"
                    name="use24Hour"
                    checked={formState.use24HourFormat}
                    onChange={() => setFormState({ ...formState, use24HourFormat: true })}
                    className="text-primary"
                  />
                  <span>24-Hour (14:30:00)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-primary">
                  <input
                    type="radio"
                    name="use24Hour"
                    checked={!formState.use24HourFormat}
                    onChange={() => setFormState({ ...formState, use24HourFormat: false })}
                    className="text-primary"
                  />
                  <span>12-Hour AM/PM</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Default Map View */}
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-bold uppercase tracking-wider text-primary">
            <MapPin className="w-4 h-4 text-safe" />
            Default Map View & Staging Coordinates
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-primary block mb-1">Default Center Latitude</label>
              <input
                type="number"
                step="any"
                value={formState.mapDefaultLat}
                onChange={(e) => setFormState({ ...formState, mapDefaultLat: parseFloat(e.target.value) || 28.6139 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Default Center Longitude</label>
              <input
                type="number"
                step="any"
                value={formState.mapDefaultLng}
                onChange={(e) => setFormState({ ...formState, mapDefaultLng: parseFloat(e.target.value) || 77.2090 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Default Zoom Level</label>
              <input
                type="number"
                min="5"
                max="18"
                value={formState.mapDefaultZoom}
                onChange={(e) => setFormState({ ...formState, mapDefaultZoom: parseInt(e.target.value) || 12 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Notification Preferences */}
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-bold uppercase tracking-wider text-primary">
            <Bell className="w-4 h-4 text-hazard" />
            In-App Notification Preferences
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-primary">
              <input
                type="checkbox"
                checked={formState.demoNotificationsEnabled}
                onChange={(e) => setFormState({ ...formState, demoNotificationsEnabled: e.target.checked })}
                className="rounded border-border text-emergency"
              />
              <span>Enable In-App Notification Center Toasts</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-primary">
              <input
                type="checkbox"
                checked={formState.soundAlertsEnabled}
                onChange={(e) => setFormState({ ...formState, soundAlertsEnabled: e.target.checked })}
                className="rounded border-border text-emergency"
              />
              <span>Enable Operational Audio Alert Chimes (Simulated)</span>
            </label>
          </div>
        </div>

        {/* Section 5: Integration Feeds Monitor (Clear Phase 1 Simulated Status) */}
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-bold uppercase tracking-wider text-primary">
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-operational-cyan" />
              External Service Feeds Status
            </span>
            <span className="text-[10px] font-mono text-hazard">PHASE 1 SIMULATED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-charcoal rounded border border-border flex items-center justify-between">
              <div>
                <span className="text-primary font-bold block">IMD Doppler Weather Radar Feed</span>
                <span className="text-[10px] text-primary-dim">Precipitation & cyclone tracking</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-safe/15 text-safe border border-safe/30">
                SIMULATED
              </span>
            </div>

            <div className="p-2.5 bg-charcoal rounded border border-border flex items-center justify-between">
              <div>
                <span className="text-primary font-bold block">National Seismological Network</span>
                <span className="text-[10px] text-primary-dim">Richter magnitude telemetry</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-safe/15 text-safe border border-safe/30">
                SIMULATED
              </span>
            </div>

            <div className="p-2.5 bg-charcoal rounded border border-border flex items-center justify-between">
              <div>
                <span className="text-primary font-bold block">Municipal Siren Gateway</span>
                <span className="text-[10px] text-primary-dim">Acoustic emergency sirens</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-hazard/15 text-hazard border border-hazard/30">
                OFFLINE IN DEMO
              </span>
            </div>

            <div className="p-2.5 bg-charcoal rounded border border-border flex items-center justify-between">
              <div>
                <span className="text-primary font-bold block">CAP Telecommunication Gateway</span>
                <span className="text-[10px] text-primary-dim">Cell Broadcast & SMS routing</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-hazard/15 text-hazard border border-hazard/30">
                OFFLINE IN DEMO
              </span>
            </div>
          </div>
          <p className="text-[10px] text-primary-dim">
            *External gateways will be attached in Phase 3 after production security authorization.
          </p>
        </div>

        {/* Section 6: Data Reset & Purge */}
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-bold uppercase tracking-wider text-emergency">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emergency" />
              Demo Data Management & Factory Reset
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div>
              <p className="text-primary font-semibold">Restore Baseline Disaster Scenario</p>
              <p className="text-primary-muted text-[11px] mt-0.5">
                Resets all incidents, teams, shelters, resources, tasks, and audit logs back to the default Indraprashtha Sector 4 scenario.
              </p>
            </div>

            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={RotateCcw}
              onClick={() => setIsResetOpen(true)}
              restricted={!canResetData}
              restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'reset_demo_data')}
            >
              Reset All Demo Data
            </Button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            restricted={!canChangeSettings}
            restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'change_settings')}
          >
            Save Operational Preferences
          </Button>
        </div>
      </form>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={resetDemoData}
        title="Confirm Factory Reset of Demo Records?"
        message="This will overwrite local changes across all modules and restore initial prototype fixtures."
        confirmLabel="Reset All Records"
        variant="danger"
      />
    </div>
  );
};
