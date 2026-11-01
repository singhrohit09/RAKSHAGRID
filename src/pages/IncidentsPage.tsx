/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Filter,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Incident, DisasterType, SeverityLevel, IncidentStatus, Team } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FormField } from '../components/common/FormField';

interface IncidentsPageProps {
  incidents: Incident[];
  teams: Team[];
  selectedIncidentId?: string | null;
  initialAction?: string | null;
  initialSeverity?: string | null;
  initialStatus?: string | null;
  initialType?: string | null;
  onCreateIncident: (data: Omit<Incident, 'id' | 'reportedTime' | 'lastUpdated'>) => Incident;
  onUpdateIncident: (id: string, updates: Partial<Incident>) => void;
  onDeleteIncident: (id: string) => void;
  onNavigateToMap: () => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  teams,
  selectedIncidentId,
  initialAction,
  initialSeverity,
  initialStatus,
  initialType,
  onCreateIncident,
  onUpdateIncident,
  onDeleteIncident,
  onNavigateToMap,
}) => {
  const { user, permissions } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [disasterTypeFilter, setDisasterTypeFilter] = useState('all');

  // Modal / Drawer states
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    disasterType: 'flood' as DisasterType,
    severity: 'high' as SeverityLevel,
    location: '',
    region: 'Eastern Command Zone',
    lat: '20.4625',
    lng: '85.8828',
    status: 'active' as IncidentStatus,
    affectedPopulation: '1000',
    assignedTeamId: '',
    tags: 'Emergency Response, Water Clearance',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync selectedIncidentId, initialAction, or filter query params
  useEffect(() => {
    if (selectedIncidentId) {
      const match = incidents.find((i) => i.id === selectedIncidentId);
      if (match) setActiveIncident(match);
    }
    if (initialAction === 'create' && permissions.canCreateIncident) {
      openCreateModal();
    }
    if (initialSeverity) {
      setSeverityFilter(initialSeverity);
    }
    if (initialStatus) {
      setStatusFilter(initialStatus);
    }
    if (initialType) {
      setDisasterTypeFilter(initialType.toLowerCase());
    }
  }, [selectedIncidentId, initialAction, initialSeverity, initialStatus, initialType, incidents, permissions.canCreateIncident]);

  // Filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          inc.title.toLowerCase().includes(q) ||
          inc.id.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.region.toLowerCase().includes(q) ||
          inc.disasterType.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false;

      // Type filter
      if (disasterTypeFilter !== 'all' && inc.disasterType !== disasterTypeFilter) return false;

      return true;
    });
  }, [incidents, searchQuery, severityFilter, statusFilter, disasterTypeFilter]);

  // Form Validation & Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = 'Incident title is mandatory.';
    if (!formData.location.trim()) errors.location = 'Specific location is required.';
    if (!formData.description.trim()) errors.description = 'Incident description is required.';

    const latNum = parseFloat(formData.lat);
    const lngNum = parseFloat(formData.lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) errors.lat = 'Valid latitude required (-90 to +90).';
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) errors.lng = 'Valid longitude required (-180 to +180).';

    const pop = parseInt(formData.affectedPopulation, 10);
    if (isNaN(pop) || pop < 0) errors.affectedPopulation = 'Affected population must be a positive integer.';

    if (!isEditing && !permissions.canCreateIncident) {
      errors.title = 'Unauthorized: Current operational role cannot record new incidents.';
    }
    if (isEditing && !permissions.canEditIncident) {
      errors.title = 'Unauthorized: Current operational role cannot modify incident records.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const selectedTeam = teams.find((t) => t.id === formData.assignedTeamId);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      disasterType: formData.disasterType,
      severity: formData.severity,
      location: formData.location.trim(),
      region: formData.region.trim(),
      coordinates: { lat: latNum, lng: lngNum },
      status: formData.status,
      affectedPopulation: parseInt(formData.affectedPopulation, 10) || 0,
      assignedTeamId: selectedTeam ? selectedTeam.id : undefined,
      assignedTeamName: selectedTeam ? selectedTeam.name : undefined,
      verified: true,
      priorityScore: formData.severity === 'critical' ? 95 : formData.severity === 'high' ? 75 : 50,
      reportedBy: user ? `${user.name} (${user.agency})` : 'Disaster Ops Center',
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (isEditing && activeIncident) {
      onUpdateIncident(activeIncident.id, payload);
      setActiveIncident({ ...activeIncident, ...payload, lastUpdated: new Date().toISOString() });
      setIsEditing(false);
      setIsCreateModalOpen(false);
    } else {
      const created = onCreateIncident(payload);
      setIsCreateModalOpen(false);
      setActiveIncident(created);
    }
  };

  const openEditModal = (inc: Incident) => {
    setFormData({
      title: inc.title,
      description: inc.description,
      disasterType: inc.disasterType,
      severity: inc.severity,
      location: inc.location,
      region: inc.region,
      lat: String(inc.coordinates.lat),
      lng: String(inc.coordinates.lng),
      status: inc.status,
      affectedPopulation: String(inc.affectedPopulation),
      assignedTeamId: inc.assignedTeamId || '',
      tags: inc.tags.join(', '),
    });
    setIsEditing(true);
    setIsCreateModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      disasterType: 'flood',
      severity: 'high',
      location: '',
      region: 'Odisha Coastal Belt',
      lat: '20.4625',
      lng: '85.8828',
      status: 'active',
      affectedPopulation: '1500',
      assignedTeamId: teams[0]?.id || '',
      tags: 'Triage In Progress, Field Deployment',
    });
    setIsEditing(false);
    setIsCreateModalOpen(true);
  };

  // Columns for DataTable
  const columns: Column<Incident>[] = [
    {
      header: 'Incident ID',
      accessorKey: 'id',
      width: '120px',
      sortable: true,
      cell: (item) => (
        <span className="font-mono font-bold text-amber-400">{item.id}</span>
      ),
    },
    {
      header: 'Title & Summary',
      sortable: true,
      cell: (item) => (
        <div className="min-w-0 pr-2">
          <div className="font-medium text-slate-100 font-sans text-xs line-clamp-1">{item.title}</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.location} · {item.region}</div>
        </div>
      ),
    },
    {
      header: 'Disaster Type',
      accessorKey: 'disasterType',
      width: '120px',
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-slate-300 uppercase text-xs">{item.disasterType}</span>
      ),
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      width: '100px',
      sortable: true,
      cell: (item) => <SeverityBadge severity={item.severity} size="sm" />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      width: '110px',
      sortable: true,
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: 'Assigned Team',
      width: '160px',
      cell: (item) => (
        <span className="text-slate-300 truncate block text-xs">
          {item.assignedTeamName || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Reported',
      accessorKey: 'reportedTime',
      align: 'right',
      width: '100px',
      sortable: true,
      cell: (item) => (
        <span className="text-slate-400 font-mono tabular-nums text-xs">
          {new Date(item.reportedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Incident Operations Registry"
        kicker="Incident Management Architecture"
        description="Comprehensive disaster event ledger with priority scoring, casualty triage, and tactical response dispatch."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Map View</span>
            </button>
            {permissions.canCreateIncident && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Incident</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-[#12171e] border border-slate-800 rounded space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, title, zone, disaster type..."
            className="flex-1 max-w-md"
          />

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Showing:</span>
            <span className="text-slate-200 font-bold tabular-nums">
              {filteredIncidents.length} of {incidents.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-slate-850">
          <FilterBar
            label="Severity"
            options={[
              { id: 'all', label: 'All' },
              { id: 'critical', label: 'Critical' },
              { id: 'high', label: 'High' },
              { id: 'medium', label: 'Medium' },
              { id: 'low', label: 'Low' },
            ]}
            selectedId={severityFilter}
            onSelect={setSeverityFilter}
          />

          <FilterBar
            label="Status"
            options={[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'investigating', label: 'Investigating' },
              { id: 'contained', label: 'Contained' },
              { id: 'resolved', label: 'Resolved' },
            ]}
            selectedId={statusFilter}
            onSelect={setStatusFilter}
          />

          <FilterBar
            label="Type"
            options={[
              { id: 'all', label: 'All Hazards' },
              { id: 'flood', label: 'Flood' },
              { id: 'cyclone', label: 'Cyclone' },
              { id: 'landslide', label: 'Landslide' },
              { id: 'industrial', label: 'Industrial' },
            ]}
            selectedId={disasterTypeFilter}
            onSelect={setDisasterTypeFilter}
          />
        </div>
      </div>

      {/* Incident Data Table */}
      <DataTable
        data={filteredIncidents}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setActiveIncident(item)}
        pageSize={8}
        emptyMessage="No disaster incidents match your active search filters."
      />

      {/* Incident Detail Inspection Drawer / Modal */}
      {activeIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl bg-[#161c24] border border-slate-750 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 bg-[#12171e] border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold font-mono text-amber-400">{activeIncident.id}</span>
                  <SeverityBadge severity={activeIncident.severity} size="sm" />
                  <StatusBadge status={activeIncident.status} size="sm" />
                </div>
                <h3 className="text-base font-bold text-slate-100 leading-snug">
                  {activeIncident.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveIncident(null)}
                aria-label="Close detail"
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Situation Description */}
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Tactical Situation Assessment
                </div>
                <p className="text-slate-300 leading-relaxed bg-[#0d1117] p-3 rounded border border-slate-850">
                  {activeIncident.description}
                </p>
              </div>

              {/* Coordinates & Zone */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                  <div className="text-[10px] text-slate-500 uppercase">Hazard Type</div>
                  <div className="text-slate-200 font-bold uppercase mt-0.5">{activeIncident.disasterType}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                  <div className="text-[10px] text-slate-500 uppercase">Priority Index</div>
                  <div className="text-amber-400 font-bold mt-0.5 tabular-nums">{activeIncident.priorityScore}/100</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                  <div className="text-[10px] text-slate-500 uppercase">Affected People</div>
                  <div className="text-slate-200 font-bold mt-0.5 tabular-nums">
                    ~{activeIncident.affectedPopulation.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-850">
                  <div className="text-[10px] text-slate-500 uppercase">Verification</div>
                  <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Geospatial and Assigned Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded bg-slate-900 border border-slate-850 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>Location & GPS Anchor</span>
                  </div>
                  <div className="text-slate-200 font-medium">{activeIncident.location}</div>
                  <div className="text-slate-400 text-[11px]">{activeIncident.region}</div>
                  <div className="text-amber-400/90 font-mono text-[11px] tabular-nums pt-1">
                    LAT: {activeIncident.coordinates.lat.toFixed(4)}° N, LNG: {activeIncident.coordinates.lng.toFixed(4)}° E
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-850 space-y-1.5">
                  <div className="font-mono text-[10px] uppercase text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Assigned Response Force</span>
                  </div>
                  <div className="text-slate-200 font-medium">
                    {activeIncident.assignedTeamName || 'No Team Dispatched Yet'}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Reported by: {activeIncident.reportedBy}
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono tabular-nums pt-1">
                    Reported: {new Date(activeIncident.reportedTime).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Casualties / Rescued Status */}
              {activeIncident.casualties && (
                <div className="p-3 rounded bg-slate-900 border border-slate-850">
                  <div className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                    Human Life Impact & Rescue Progress
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="p-2 rounded bg-slate-850">
                      <div className="text-xs text-emerald-400 font-bold tabular-nums">
                        {activeIncident.casualties.rescued}
                      </div>
                      <div className="text-[10px] text-slate-400">Rescued / Safe</div>
                    </div>
                    <div className="p-2 rounded bg-slate-850">
                      <div className="text-xs text-amber-400 font-bold tabular-nums">
                        {activeIncident.casualties.injured}
                      </div>
                      <div className="text-[10px] text-slate-400">Medical Aid Needed</div>
                    </div>
                    <div className="p-2 rounded bg-slate-850">
                      <div className="text-xs text-rose-400 font-bold tabular-nums">
                        {activeIncident.casualties.deceased}
                      </div>
                      <div className="text-[10px] text-slate-400">Fatalities</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update Quick Buttons */}
              {permissions.canEditIncident && (
                <div className="pt-2 border-t border-slate-850">
                  <div className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                    Fast Operational Status Transition
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['active', 'investigating', 'contained', 'resolved'] as IncidentStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          onUpdateIncident(activeIncident.id, { status: st });
                          setActiveIncident({ ...activeIncident, status: st });
                        }}
                        className={`px-3 py-1 text-xs font-mono rounded transition-colors uppercase ${
                          activeIncident.status === st
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-[#12171e] border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {permissions.canDeleteIncident && (
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(activeIncident.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {permissions.canEditIncident && (
                  <button
                    type="button"
                    onClick={() => openEditModal(activeIncident)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Incident</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveIncident(null)}
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Incident Modal Form */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-[#161c24] border border-slate-750 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-[#12171e] border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  {isEditing ? 'Modify Incident Ledger Record' : 'Log New Emergency Incident'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <FormField label="Incident Title" required error={formErrors.title} id="inc-title">
                <input
                  id="inc-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Flash Flood Breach at River Enbankment"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Hazard / Disaster Type" required id="inc-disaster">
                  <select
                    id="inc-disaster"
                    value={formData.disasterType}
                    onChange={(e) => setFormData({ ...formData, disasterType: e.target.value as DisasterType })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80 uppercase"
                  >
                    <option value="flood">Flood</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="landslide">Landslide</option>
                    <option value="wildfire">Wildfire</option>
                    <option value="industrial">Industrial / HazMat</option>
                    <option value="medical">Medical Epidemic</option>
                    <option value="tsunami">Tsunami</option>
                  </select>
                </FormField>

                <FormField label="Severity Level" required id="inc-severity">
                  <select
                    id="inc-severity"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as SeverityLevel })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80 uppercase"
                  >
                    <option value="critical">Critical (Life Threatening)</option>
                    <option value="high">High (Severe Impact)</option>
                    <option value="medium">Medium (Localized Threat)</option>
                    <option value="low">Low (Precautionary)</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Specific Location" required error={formErrors.location} id="inc-location">
                  <input
                    id="inc-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Sector 4 Bridge, Cuttack"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>

                <FormField label="Command Region" required id="inc-region">
                  <input
                    id="inc-region"
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Odisha Coastal Belt"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Latitude (N)" required error={formErrors.lat} id="inc-lat">
                  <input
                    id="inc-lat"
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="20.4625"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>

                <FormField label="Longitude (E)" required error={formErrors.lng} id="inc-lng">
                  <input
                    id="inc-lng"
                    type="text"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="85.8828"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Affected Population" error={formErrors.affectedPopulation} id="inc-pop">
                  <input
                    id="inc-pop"
                    type="number"
                    value={formData.affectedPopulation}
                    onChange={(e) => setFormData({ ...formData, affectedPopulation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>

                <FormField label="Assign Response Team" id="inc-team">
                  <select
                    id="inc-team"
                    value={formData.assignedTeamId}
                    onChange={(e) => setFormData({ ...formData, assignedTeamId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                  >
                    <option value="">No Team Assigned</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Situation Details" required error={formErrors.description} id="inc-desc">
                <textarea
                  id="inc-desc"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail the on-ground situation, immediate risk, hazards, and requested resources..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
                />
              </FormField>

              <FormField label="Operational Tags" hint="Comma-separated" id="inc-tags">
                <input
                  id="inc-tags"
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Boats Needed, Power Cut, Medical Emergency"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
                >
                  {isEditing ? 'Commit Changes' : 'Record Emergency Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete Incident Record"
        message="Are you sure you want to permanently remove this incident record? This operation will be logged to the immutable audit trail."
        confirmLabel="Confirm Deletion"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteIncident(deleteTargetId);
            setDeleteTargetId(null);
            if (activeIncident?.id === deleteTargetId) {
              setActiveIncident(null);
            }
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
