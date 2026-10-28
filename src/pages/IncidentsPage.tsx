import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { Incident, IncidentSeverity, IncidentStatus, IncidentPriority, DisasterCategory, IncidentSource } from '../types/incident';
import { 
  Flame, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  ArrowUpDown
} from 'lucide-react';
import { SeverityBadge, StatusBadge, PriorityBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCoordinates, formatDateTime, formatRelativeTime, formatCategory } from '../utils/formatters';
import { validateIncidentForm } from '../utils/validators';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';

export const IncidentsPage: React.FC = () => {
  const { 
    incidents, 
    teams, 
    activePersonaId, 
    addIncident, 
    updateIncident, 
    deleteIncident 
  } = useRaksha();

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'reportedAt' | 'priority' | 'severity'>('reportedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'flood' as DisasterCategory,
    severity: 'High' as IncidentSeverity,
    status: 'Reported' as IncidentStatus,
    priority: 'P2' as IncidentPriority,
    locationName: '',
    latitude: 28.6139,
    longitude: 77.2090,
    assignedTeamId: '',
    affectedPopulation: 0,
    casualties: 0,
    source: 'Manual Report' as IncidentSource,
    estimatedRadiusMeters: 1000
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Timeline note input for viewing drawer
  const [newTimelineNote, setNewTimelineNote] = useState('');

  // Permissions
  const canCreate = hasPermission(activePersonaId, 'create_incidents');
  const canEdit = hasPermission(activePersonaId, 'edit_incidents');
  const canDelete = hasPermission(activePersonaId, 'delete_incidents');
  const canClose = hasPermission(activePersonaId, 'close_incidents');

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchSearch = 
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.id.toLowerCase().includes(search.toLowerCase()) ||
        inc.locationName.toLowerCase().includes(search.toLowerCase());

      const matchSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
      const matchStatus = filterStatus === 'all' || inc.status === filterStatus;
      const matchCategory = filterCategory === 'all' || inc.category === filterCategory;

      return matchSearch && matchSeverity && matchStatus && matchCategory;
    }).sort((a, b) => {
      let comp = 0;
      if (sortBy === 'reportedAt') {
        comp = new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
      } else if (sortBy === 'priority') {
        const order = { P1: 1, P2: 2, P3: 3, P4: 4 };
        comp = order[a.priority] - order[b.priority];
      } else if (sortBy === 'severity') {
        const order = { Critical: 1, High: 2, Moderate: 3, Low: 4 };
        comp = order[a.severity] - order[b.severity];
      }
      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [incidents, search, filterSeverity, filterStatus, filterCategory, sortBy, sortOrder]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      category: 'flood',
      severity: 'High',
      status: 'Reported',
      priority: 'P2',
      locationName: '',
      latitude: 28.6139,
      longitude: 77.2090,
      assignedTeamId: '',
      affectedPopulation: 0,
      casualties: 0,
      source: 'Manual Report',
      estimatedRadiusMeters: 1000
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (inc: Incident) => {
    setEditingIncident(inc);
    setFormData({
      title: inc.title,
      description: inc.description,
      category: inc.category,
      severity: inc.severity,
      status: inc.status,
      priority: inc.priority,
      locationName: inc.locationName,
      latitude: inc.latitude,
      longitude: inc.longitude,
      assignedTeamId: inc.assignedTeamId || '',
      affectedPopulation: inc.affectedPopulation,
      casualties: inc.casualties,
      source: inc.source,
      estimatedRadiusMeters: inc.estimatedRadiusMeters || 1000
    });
    setFormErrors({});
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateIncidentForm({
      title: formData.title,
      category: formData.category,
      severity: formData.severity,
      locationName: formData.locationName,
      latitude: formData.latitude,
      longitude: formData.longitude,
      affectedPopulation: formData.affectedPopulation
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const assignedTeam = teams.find(t => t.id === formData.assignedTeamId);

    addIncident({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      severity: formData.severity,
      status: formData.status,
      priority: formData.priority,
      locationName: formData.locationName,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      assignedTeamId: formData.assignedTeamId || undefined,
      assignedTeamName: assignedTeam ? assignedTeam.name : undefined,
      affectedPopulation: Number(formData.affectedPopulation),
      casualties: Number(formData.casualties),
      source: formData.source,
      estimatedRadiusMeters: Number(formData.estimatedRadiusMeters)
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;

    const validation = validateIncidentForm({
      title: formData.title,
      category: formData.category,
      severity: formData.severity,
      locationName: formData.locationName,
      latitude: formData.latitude,
      longitude: formData.longitude,
      affectedPopulation: formData.affectedPopulation
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const assignedTeam = teams.find(t => t.id === formData.assignedTeamId);

    updateIncident(editingIncident.id, {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      severity: formData.severity,
      status: formData.status,
      priority: formData.priority,
      locationName: formData.locationName,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      assignedTeamId: formData.assignedTeamId || undefined,
      assignedTeamName: assignedTeam ? assignedTeam.name : undefined,
      affectedPopulation: Number(formData.affectedPopulation),
      casualties: Number(formData.casualties),
      source: formData.source,
      estimatedRadiusMeters: Number(formData.estimatedRadiusMeters)
    });

    // Update viewing drawer if open
    if (viewingIncident && viewingIncident.id === editingIncident.id) {
      setViewingIncident(prev => prev ? {
        ...prev,
        ...formData,
        assignedTeamName: assignedTeam ? assignedTeam.name : undefined
      } : null);
    }

    setEditingIncident(null);
  };

  const handleQuickStatusChange = (id: string, newStatus: IncidentStatus) => {
    updateIncident(id, { status: newStatus });
    if (viewingIncident && viewingIncident.id === id) {
      setViewingIncident(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleAddTimelineNote = () => {
    if (!viewingIncident || !newTimelineNote.trim()) return;
    const now = new Date().toISOString();
    const newEntry = {
      id: `TL-${Date.now()}`,
      timestamp: now,
      actor: activePersonaId.toUpperCase(),
      note: newTimelineNote.trim(),
      type: 'general' as const
    };

    updateIncident(viewingIncident.id, {
      timeline: [...viewingIncident.timeline, newEntry]
    });

    setViewingIncident({
      ...viewingIncident,
      timeline: [...viewingIncident.timeline, newEntry]
    });

    setNewTimelineNote('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-emergency" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              INCIDENT REGISTRY
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
              {filteredIncidents.length} OF {incidents.length} RECORDS
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Log, triage, track, and coordinate active disaster incidents across the district.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
          restricted={!canCreate}
          restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'create_incidents')}
        >
          Register Incident
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search by title, ID, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none focus:border-border-subtle"
          />
        </div>

        {/* Severity Filter */}
        <div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Verified">Verified</option>
            <option value="Active">Active</option>
            <option value="Contained">Contained</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="flood">Flood</option>
            <option value="flash_flood">Flash Flood</option>
            <option value="heavy_rainfall">Heavy Rainfall</option>
            <option value="cyclone">Cyclone</option>
            <option value="earthquake">Earthquake</option>
            <option value="landslide">Landslide</option>
            <option value="wildfire">Wildfire</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 bg-charcoal border border-border rounded px-2 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="reportedAt">Time</option>
            <option value="priority">Priority</option>
            <option value="severity">Severity</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded bg-charcoal border border-border text-primary-muted hover:text-primary"
            title={`Toggle sort order (${sortOrder.toUpperCase()})`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel-card text-[10px] font-mono text-primary-dim uppercase border-b border-border tracking-wider">
              <tr>
                <th className="p-3">Incident ID & Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Team</th>
                <th className="p-3">Reported</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-primary-dim font-sans">
                    No matching incidents found. Adjust filters or register a new incident.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-panel-elevated transition-colors group"
                  >
                    <td className="p-3">
                      <div className="font-bold text-primary font-sans text-xs group-hover:text-emergency transition-colors cursor-pointer" onClick={() => setViewingIncident(inc)}>
                        {inc.title}
                      </div>
                      <div className="text-[10px] text-primary-dim flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-primary-muted">{inc.id}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{inc.locationName}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="text-[11px] font-sans text-primary-muted">
                        {formatCategory(inc.category)}
                      </span>
                    </td>

                    <td className="p-3">
                      <PriorityBadge priority={inc.priority} />
                    </td>

                    <td className="p-3">
                      <SeverityBadge severity={inc.severity} />
                    </td>

                    <td className="p-3">
                      <StatusBadge status={inc.status} />
                    </td>

                    <td className="p-3">
                      <span className="text-[11px] font-sans text-primary-muted truncate block max-w-[150px]">
                        {inc.assignedTeamName || <span className="text-primary-dim italic">Unassigned</span>}
                      </span>
                    </td>

                    <td className="p-3 text-primary-dim text-[11px]">
                      {formatRelativeTime(inc.reportedAt)}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          onClick={() => setViewingIncident(inc)}
                          className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle"
                          title="Inspect incident details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          disabled={!canEdit}
                          className={`p-1 rounded ${canEdit ? 'text-primary-muted hover:text-primary hover:bg-panel-subtle' : 'opacity-30 cursor-not-allowed'}`}
                          title={canEdit ? 'Edit incident' : 'Editing restricted'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(inc.id)}
                          disabled={!canDelete}
                          className={`p-1 rounded ${canDelete ? 'text-primary-muted hover:text-emergency hover:bg-emergency/10' : 'opacity-30 cursor-not-allowed'}`}
                          title={canDelete ? 'Delete incident' : 'Deleting restricted'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INCIDENT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Emergency Incident"
        subtitle="Submit a verified or incoming field incident to the district operations registry."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">
              Incident Title <span className="text-emergency">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flash Flood Inundation & Culvert Breach — Sector 4"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full bg-charcoal border rounded px-3 py-2 text-primary focus:outline-none ${formErrors.title ? 'border-emergency' : 'border-border'}`}
            />
            {formErrors.title && <p className="text-emergency text-[11px] mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Disaster Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as DisasterCategory })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="flood">Flood</option>
                <option value="flash_flood">Flash Flood</option>
                <option value="heavy_rainfall">Heavy Rainfall</option>
                <option value="cyclone">Cyclone</option>
                <option value="earthquake">Earthquake</option>
                <option value="landslide">Landslide</option>
                <option value="wildfire">Wildfire</option>
                <option value="industrial">Industrial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Severity Classification</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentSeverity })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Tactical Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as IncidentPriority })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="P1">P1 - Highest Emergency</option>
                <option value="P2">P2 - Severe Hazard</option>
                <option value="P3">P3 - Moderate Alert</option>
                <option value="P4">P4 - Low / Monitored</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Provide field context, current hazard progression, immediate life safety threats..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          {/* Location & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="font-semibold text-primary block mb-1">
                Location Name <span className="text-emergency">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ring Road Junction Reach"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                className={`w-full bg-charcoal border rounded px-3 py-2 text-primary focus:outline-none ${formErrors.locationName ? 'border-emergency' : 'border-border'}`}
              />
              {formErrors.locationName && <p className="text-emergency text-[11px] mt-1">{formErrors.locationName}</p>}
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">
                Latitude (-90 to 90) <span className="text-emergency">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className={`w-full bg-charcoal border rounded px-3 py-2 font-mono text-primary focus:outline-none ${formErrors.latitude ? 'border-emergency' : 'border-border'}`}
              />
              {formErrors.latitude && <p className="text-emergency text-[11px] mt-1">{formErrors.latitude}</p>}
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">
                Longitude (-180 to 180) <span className="text-emergency">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className={`w-full bg-charcoal border rounded px-3 py-2 font-mono text-primary focus:outline-none ${formErrors.longitude ? 'border-emergency' : 'border-border'}`}
              />
              {formErrors.longitude && <p className="text-emergency text-[11px] mt-1">{formErrors.longitude}</p>}
            </div>
          </div>

          {/* Estimates & Assignments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Assign Response Team</label>
              <select
                value={formData.assignedTeamId}
                onChange={(e) => setFormData({ ...formData, assignedTeamId: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="">None (Unassigned)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Affected Population Est.</label>
              <input
                type="number"
                min="0"
                value={formData.affectedPopulation}
                onChange={(e) => setFormData({ ...formData, affectedPopulation: parseInt(e.target.value) || 0 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Casualty / Injury Est.</label>
              <input
                type="number"
                min="0"
                value={formData.casualties}
                onChange={(e) => setFormData({ ...formData, casualties: parseInt(e.target.value) || 0 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" type="submit">
              Register Incident
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT INCIDENT MODAL */}
      <Modal
        isOpen={editingIncident !== null}
        onClose={() => setEditingIncident(null)}
        title={`Edit Incident: ${editingIncident?.id}`}
        subtitle="Update severity, status transition, coordinates, or team assignment."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Incident Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Disaster Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as DisasterCategory })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="flood">Flood</option>
                <option value="flash_flood">Flash Flood</option>
                <option value="heavy_rainfall">Heavy Rainfall</option>
                <option value="cyclone">Cyclone</option>
                <option value="earthquake">Earthquake</option>
                <option value="landslide">Landslide</option>
                <option value="wildfire">Wildfire</option>
                <option value="industrial">Industrial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Severity Classification</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentSeverity })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Lifecycle Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as IncidentStatus })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="Active">Active</option>
                <option value="Contained">Contained</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed" disabled={!canClose}>
                  Closed {!canClose ? '(Restricted)' : ''}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Location Name</label>
              <input
                type="text"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Assigned Response Team</label>
              <select
                value={formData.assignedTeamId}
                onChange={(e) => setFormData({ ...formData, assignedTeamId: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="">None (Unassigned)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Affected Population</label>
              <input
                type="number"
                min="0"
                value={formData.affectedPopulation}
                onChange={(e) => setFormData({ ...formData, affectedPopulation: parseInt(e.target.value) || 0 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Estimated Radius (m)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={formData.estimatedRadiusMeters}
                onChange={(e) => setFormData({ ...formData, estimatedRadiusMeters: parseInt(e.target.value) || 1000 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setEditingIncident(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW INCIDENT DRAWER / MODAL */}
      <Modal
        isOpen={viewingIncident !== null}
        onClose={() => setViewingIncident(null)}
        title={viewingIncident ? `${viewingIncident.id} — ${viewingIncident.title}` : ''}
        subtitle={viewingIncident?.locationName}
        maxWidth="2xl"
      >
        {viewingIncident && (
          <div className="space-y-4 text-xs">
            {/* Top Badges & Status Transitions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-panel-subtle rounded border border-border">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={viewingIncident.severity} />
                <StatusBadge status={viewingIncident.status} />
                <PriorityBadge priority={viewingIncident.priority} />
              </div>

              {/* Status Transition Quick Buttons */}
              <div className="flex items-center gap-1">
                {viewingIncident.status === 'Reported' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickStatusChange(viewingIncident.id, 'Verified')}
                    restricted={!canEdit}
                  >
                    Verify
                  </Button>
                )}
                {viewingIncident.status === 'Verified' && (
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() => handleQuickStatusChange(viewingIncident.id, 'Active')}
                    restricted={!canEdit}
                  >
                    Activate
                  </Button>
                )}
                {viewingIncident.status === 'Active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickStatusChange(viewingIncident.id, 'Contained')}
                    restricted={!canEdit}
                  >
                    Mark Contained
                  </Button>
                )}
                {viewingIncident.status === 'Contained' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickStatusChange(viewingIncident.id, 'Resolved')}
                    restricted={!canEdit}
                  >
                    Mark Resolved
                  </Button>
                )}
                {viewingIncident.status !== 'Closed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickStatusChange(viewingIncident.id, 'Closed')}
                    restricted={!canClose}
                    restrictedReason="Closing incidents requires Commander or Administrator role."
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary-dim block">
                DESCRIPTION & THREAT CONTEXT
              </span>
              <p className="text-primary-muted leading-relaxed mt-1 bg-charcoal p-3 rounded border border-border">
                {viewingIncident.description}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2.5 bg-panel-card rounded border border-border">
                <span className="text-primary-dim block text-[10px]">COORDINATES</span>
                <span className="text-primary font-semibold">
                  {formatCoordinates(viewingIncident.latitude, viewingIncident.longitude)}
                </span>
              </div>
              <div className="p-2.5 bg-panel-card rounded border border-border">
                <span className="text-primary-dim block text-[10px]">AFFECTED POPULATION</span>
                <span className="text-primary font-bold">
                  {viewingIncident.affectedPopulation.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-panel-card rounded border border-border">
                <span className="text-primary-dim block text-[10px]">CASUALTIES / INJURED</span>
                <span className="text-primary font-bold">
                  {viewingIncident.casualties}
                </span>
              </div>
              <div className="p-2.5 bg-panel-card rounded border border-border">
                <span className="text-primary-dim block text-[10px]">SOURCE TYPE</span>
                <span className="text-primary font-semibold">
                  {viewingIncident.source}
                </span>
              </div>
            </div>

            {/* Assigned Unit */}
            <div className="p-3 rounded bg-panel-card border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-primary-dim block">ASSIGNED RESPONSE UNIT</span>
                <span className="text-sm font-semibold text-primary">
                  {viewingIncident.assignedTeamName || 'No unit assigned currently.'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setViewingIncident(null);
                  handleOpenEdit(viewingIncident);
                }}
                restricted={!canEdit}
              >
                Change Assignment
              </Button>
            </div>

            {/* Timeline & Activity History */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary-dim block mb-2">
                OPERATIONAL TIMELINE & FIELD LOG ({viewingIncident.timeline.length} EVENTS)
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-charcoal rounded border border-border">
                {viewingIncident.timeline.map((entry) => (
                  <div key={entry.id} className="text-[11px] p-2 rounded bg-panel-subtle border border-border/60">
                    <div className="flex items-center justify-between text-primary-dim font-mono text-[10px] mb-1">
                      <span className="font-semibold text-primary">{entry.actor}</span>
                      <span>{formatDateTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-primary-muted">{entry.note}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              {canEdit && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add operational status note or field update..."
                    value={newTimelineNote}
                    onChange={(e) => setNewTimelineNote(e.target.value)}
                    className="flex-1 bg-charcoal border border-border rounded px-3 py-1.5 text-xs text-primary focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineNote()}
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddTimelineNote}>
                    Post Note
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <Button size="sm" variant="primary" onClick={() => setViewingIncident(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteIncident(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Incident Record?"
        message="Are you sure you want to permanently delete this incident? All recorded timelines and operational coordinates will be removed from the registry."
        confirmLabel="Delete Record"
        variant="danger"
      />
    </div>
  );
};
