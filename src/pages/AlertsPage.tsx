import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { EmergencyAlert, AlertType, AlertSeverity, AlertStatus } from '../types/alert';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Send, 
  Archive, 
  ShieldAlert, 
  BellRing
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AlertBanner } from '../components/common/AlertBanner';
import { formatDateTime } from '../utils/formatters';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';

export const AlertsPage: React.FC = () => {
  const { 
    alerts, 
    incidents, 
    activePersonaId, 
    addAlert, 
    updateAlert, 
    approveAlertForDemo, 
    archiveAlert, 
    deleteAlert 
  } = useRaksha();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<EmergencyAlert | null>(null);
  const [previewingAlert, setPreviewingAlert] = useState<EmergencyAlert | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'Warning' as AlertType,
    severity: 'Severe' as AlertSeverity,
    targetRegion: 'National Capital Riverine District (Demo Sector 4)',
    relatedIncidentId: '',
    safetyActions: 'Turn off utilities.\nEvacuate to designated shelter.\nDo not drive through standing water.',
    channels: {
      sms: false,
      cellBroadcast: false,
      siren: false,
      radio: false,
      email: false,
      publicBulletin: true
    }
  });

  const canCreate = hasPermission(activePersonaId, 'create_alerts');
  const canApprove = hasPermission(activePersonaId, 'approve_alerts');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchSearch = 
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.body.toLowerCase().includes(search.toLowerCase()) ||
        a.targetRegion.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase());

      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [alerts, search, filterStatus]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      body: '',
      type: 'Warning',
      severity: 'Severe',
      targetRegion: 'National Capital Riverine District (Demo Sector 4)',
      relatedIncidentId: incidents[0]?.id || '',
      safetyActions: 'Turn off home circuit breaker.\nProceed to highest nearby community shelter.\nAvoid contact with swift water.',
      channels: {
        sms: false,
        cellBroadcast: false,
        siren: false,
        radio: false,
        email: false,
        publicBulletin: true
      }
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (a: EmergencyAlert) => {
    setEditingAlert(a);
    setFormData({
      title: a.title,
      body: a.body,
      type: a.type,
      severity: a.severity,
      targetRegion: a.targetRegion,
      relatedIncidentId: a.relatedIncidentId || '',
      safetyActions: a.safetyActions.join('\n'),
      channels: { ...a.channels }
    });
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    const relInc = incidents.find(i => i.id === formData.relatedIncidentId);

    addAlert({
      title: formData.title.trim(),
      body: formData.body.trim(),
      type: formData.type,
      severity: formData.severity,
      targetRegion: formData.targetRegion.trim(),
      relatedIncidentId: formData.relatedIncidentId || undefined,
      relatedIncidentTitle: relInc ? relInc.title : undefined,
      safetyActions: formData.safetyActions.split('\n').map(s => s.trim()).filter(Boolean),
      channels: formData.channels
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert || !formData.title.trim() || !formData.body.trim()) return;

    const relInc = incidents.find(i => i.id === formData.relatedIncidentId);

    updateAlert(editingAlert.id, {
      title: formData.title.trim(),
      body: formData.body.trim(),
      type: formData.type,
      severity: formData.severity,
      targetRegion: formData.targetRegion.trim(),
      relatedIncidentId: formData.relatedIncidentId || undefined,
      relatedIncidentTitle: relInc ? relInc.title : undefined,
      safetyActions: formData.safetyActions.split('\n').map(s => s.trim()).filter(Boolean),
      channels: formData.channels
    });

    setEditingAlert(null);
  };

  const severityBadges: Record<AlertSeverity, string> = {
    Extreme: 'bg-emergency/20 text-emergency border border-emergency/40 font-bold',
    Severe: 'bg-hazard/20 text-hazard border border-hazard/40',
    Moderate: 'bg-operational-cyan/20 text-operational-cyan border border-operational-cyan/40',
    Minor: 'bg-safe/20 text-safe border border-safe/40'
  };

  const statusBadges: Record<AlertStatus, string> = {
    Draft: 'bg-panel-subtle text-primary-muted border-border',
    'Ready for Review': 'bg-hazard/15 text-hazard border-hazard/30',
    'Approved for Demo': 'bg-emergency/15 text-emergency border-emergency/40 font-bold animate-pulse',
    Archived: 'bg-charcoal text-primary-dim border-border'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-hazard" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              EMERGENCY ALERT COMPOSITION & DISPATCH
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-hazard/15 text-hazard border border-hazard/40 uppercase font-bold tracking-widest">
              SIMULATED WARNING SYSTEM
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Compose CAP-inspired public emergency alerts, configure channels, and simulate review workflows.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
          restricted={!canCreate}
          restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'create_alerts')}
        >
          Draft Emergency Alert
        </Button>
      </div>

      {/* Mandatory Safety Notice */}
      <AlertBanner
        type="warning"
        title="OPERATIONAL SAFETY RULE — DEMO ENVIRONMENT ONLY"
      >
        Phase 1 does NOT broadcast or transmit live alerts to cell towers, SMS gateways, sirens, or public radios. All delivery channels are UI placeholders. Approving an alert marks it as &quot;Approved for Demo&quot; within the platform and publishes it strictly to the internal public demo bulletin.
      </AlertBanner>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search alerts by title, region, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Lifecycles</option>
            <option value="Draft">Draft</option>
            <option value="Ready for Review">Ready for Review</option>
            <option value="Approved for Demo">Approved for Demo (Simulated Active)</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Alerts List Cards */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-primary-dim bg-panel border border-border rounded-lg">
            No emergency alerts found. Draft an alert to test the CAP review workflow.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-panel border border-border rounded-lg p-4 hover:border-border-subtle transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-subtle text-primary border border-border uppercase font-bold">
                      {alert.type}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${severityBadges[alert.severity]}`}>
                      {alert.severity} SEVERITY
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${statusBadges[alert.status]}`}>
                      {alert.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-primary mt-1">{alert.title}</h3>
                  <div className="text-[11px] font-mono text-primary-dim mt-0.5">
                    Target Region: <span className="text-primary-muted">{alert.targetRegion}</span> • ID: {alert.id}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Eye}
                    onClick={() => setPreviewingAlert(alert)}
                    className="text-xs"
                  >
                    CAP Preview
                  </Button>

                  {alert.status === 'Ready for Review' && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Send}
                      onClick={() => setApprovingId(alert.id)}
                      restricted={!canApprove}
                      restrictedReason="Approving emergency alerts requires Incident Commander or Administrator role."
                      className="text-xs"
                    >
                      Approve for Demo
                    </Button>
                  )}

                  {alert.status === 'Draft' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateAlert(alert.id, { status: 'Ready for Review' })}
                      className="text-xs"
                    >
                      Submit for Review
                    </Button>
                  )}

                  {alert.status === 'Approved for Demo' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Archive}
                      onClick={() => archiveAlert(alert.id)}
                      className="text-xs"
                    >
                      Archive
                    </Button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(alert)}
                    disabled={!canCreate}
                    className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle"
                    title="Edit alert text"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingId(alert.id)}
                    disabled={!canCreate}
                    className="p-1 rounded text-primary-muted hover:text-emergency hover:bg-emergency/10"
                    title="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alert Body */}
              <p className="text-xs text-primary-muted leading-relaxed bg-charcoal p-3 rounded border border-border">
                {alert.body}
              </p>

              {/* Safety Instructions */}
              {alert.safetyActions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-primary-dim uppercase tracking-wider block">
                    Recommended Public Protective Actions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-primary">
                    {alert.safetyActions.map((act, i) => (
                      <div key={i} className="flex items-start gap-1.5 p-1.5 rounded bg-panel-subtle border border-border/60 text-[11px]">
                        <span className="text-hazard font-bold font-mono">#{i + 1}</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configured Dissemination Channels (Explicitly Marked Simulated) */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-[10px] font-mono text-primary-dim">
                <span className="uppercase font-semibold">Channels (Simulated):</span>
                <span className={`px-1.5 py-0.5 rounded border ${alert.channels.publicBulletin ? 'bg-operational-cyan/15 text-operational-cyan border-operational-cyan/30' : 'bg-charcoal text-primary-dim border-border'}`}>
                  Public Bulletin (Active)
                </span>
                <span className="px-1.5 py-0.5 rounded border bg-charcoal text-primary-dim border-border" title="Simulated - Not connected in Phase 1">
                  SMS (Demo Only)
                </span>
                <span className="px-1.5 py-0.5 rounded border bg-charcoal text-primary-dim border-border" title="Simulated - Not connected in Phase 1">
                  Cell Broadcast (Demo Only)
                </span>
                <span className="px-1.5 py-0.5 rounded border bg-charcoal text-primary-dim border-border" title="Simulated - Not connected in Phase 1">
                  Siren Network (Demo Only)
                </span>

                {alert.approvedBy && (
                  <span className="ml-auto text-safe font-semibold">
                    Approved by {alert.approvedBy} at {formatDateTime(alert.approvedAt || '')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CAP FORMATTED PREVIEW MODAL */}
      <Modal
        isOpen={previewingAlert !== null}
        onClose={() => setPreviewingAlert(null)}
        title="Common Alerting Protocol (CAP) — Public Display Simulation"
        subtitle="Simulated public warning display card. No transmission occurs."
        maxWidth="lg"
      >
        {previewingAlert && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-hazard/10 border border-hazard/30 rounded text-[11px] text-hazard flex items-center gap-2 font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                <strong>SIMULATED WARNING PREVIEW:</strong> Resembles standardized CAP alert payload.
              </span>
            </div>

            {/* Simulated Phone / Public Notification Card */}
            <div className="bg-charcoal border-2 border-emergency rounded-lg p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-emergency font-extrabold uppercase tracking-wider">
                  <BellRing className="w-4 h-4 animate-bounce" />
                  EMERGENCY PUBLIC WARNING
                </div>
                <span className="text-primary-dim">{formatDateTime(previewingAlert.createdAt)}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-hazard font-bold">
                  {previewingAlert.type.toUpperCase()} • {previewingAlert.severity.toUpperCase()} PRIORITY
                </span>
                <h2 className="text-base font-extrabold text-white mt-1 leading-snug">
                  {previewingAlert.title}
                </h2>
                <div className="text-xs font-mono text-primary-muted mt-0.5">
                  Target Zone: {previewingAlert.targetRegion}
                </div>
              </div>

              <div className="p-3 bg-panel-elevated rounded border border-border text-xs text-primary leading-relaxed">
                {previewingAlert.body}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-primary-dim uppercase tracking-wider">
                  Mandatory Safety Instructions:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-xs text-primary">
                  {previewingAlert.safetyActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-[10px] text-primary-dim">
                <span>Sender: RakshaGrid Operations Command</span>
                <span className="text-safe">Status: {previewingAlert.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setPreviewingAlert(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE ALERT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Draft Emergency Alert"
        subtitle="Compose public safety advisory or evacuation order for review."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Alert Headline / Title</label>
            <input
              type="text"
              placeholder="e.g. FLASH FLOOD EVACUATION ORDER: Mayur Vihar Sector 4"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Alert Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertType })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Evacuation Order">Evacuation Order</option>
                <option value="Warning">Warning</option>
                <option value="Advisory">Advisory</option>
                <option value="Watch">Watch</option>
                <option value="All Clear">All Clear</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Extreme">Extreme</option>
                <option value="Severe">Severe</option>
                <option value="Moderate">Moderate</option>
                <option value="Minor">Minor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Target Geographic Region</label>
            <input
              type="text"
              placeholder="e.g. Mayur Vihar Sector 4 Riverfront Corridor"
              value={formData.targetRegion}
              onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Alert Body & Urgent Guidance</label>
            <textarea
              rows={3}
              placeholder="Detailed public instructions, imminent danger description, shelter staging coordinates..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Safety Protective Actions (One per line)</label>
            <textarea
              rows={3}
              value={formData.safetyActions}
              onChange={(e) => setFormData({ ...formData, safetyActions: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
            />
          </div>

          <div className="p-3 bg-charcoal rounded border border-border space-y-2">
            <span className="text-[10px] font-mono text-primary-dim uppercase tracking-wider block">
              Simulated Dissemination Channels (Phase 1 Prototype)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 text-primary">
                <input
                  type="checkbox"
                  checked={formData.channels.publicBulletin}
                  onChange={(e) => setFormData({
                    ...formData,
                    channels: { ...formData.channels, publicBulletin: e.target.checked }
                  })}
                  className="rounded border-border text-emergency"
                />
                <span>Public Emergency Bulletin (Simulated)</span>
              </label>

              <label className="flex items-center gap-2 text-primary-muted">
                <input type="checkbox" disabled checked={false} className="rounded opacity-40" />
                <span>Cell Broadcast (Not connected — demo only)</span>
              </label>

              <label className="flex items-center gap-2 text-primary-muted">
                <input type="checkbox" disabled checked={false} className="rounded opacity-40" />
                <span>SMS Alerting (Not connected — demo only)</span>
              </label>

              <label className="flex items-center gap-2 text-primary-muted">
                <input type="checkbox" disabled checked={false} className="rounded opacity-40" />
                <span>Siren Network (Not connected — demo only)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" type="submit">
              Save as Draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editingAlert !== null}
        onClose={() => setEditingAlert(null)}
        title={`Edit Alert: ${editingAlert?.id}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Headline</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Target Region</label>
            <input
              type="text"
              value={formData.targetRegion}
              onChange={(e) => setFormData({ ...formData, targetRegion: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Body Text</label>
            <textarea
              rows={3}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setEditingAlert(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Update Alert
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM APPROVAL FOR DEMO DIALOG */}
      <ConfirmDialog
        isOpen={approvingId !== null}
        onClose={() => setApprovingId(null)}
        onConfirm={() => {
          if (approvingId) {
            approveAlertForDemo(approvingId);
            setApprovingId(null);
          }
        }}
        title="Approve Alert for Simulated Display?"
        message="This will mark the warning as 'Approved for Demo' and display it in the simulated public bulletin. It will NOT transmit live cellular broadcasts, radio signals, or SMS messages."
        confirmLabel="Approve for Demo Simulation"
        variant="warning"
      />

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteAlert(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Emergency Alert?"
        message="Are you sure you want to permanently delete this alert record?"
        confirmLabel="Delete Alert"
        variant="danger"
      />
    </div>
  );
};
