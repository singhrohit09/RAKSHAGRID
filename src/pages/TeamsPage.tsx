import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { ResponseTeam, TeamStatus, TeamType } from '../types/team';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';

export const TeamsPage: React.FC = () => {
  const { teams, activePersonaId, addTeam, updateTeam, deleteTeam } = useRaksha();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ResponseTeam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'search_rescue' as TeamType,
    staffCount: 20,
    skills: 'Flood Rescue, Swift Water, First Aid',
    homeBase: '',
    status: 'Available' as TeamStatus,
    currentAssignment: '',
    contactCallsign: '',
    contactPhone: '+91 98765-DEMO',
    latitude: 28.6139,
    longitude: 77.2090
  });

  const canManageTeams = hasPermission(activePersonaId, 'manage_teams');

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchSearch = 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.homeBase.toLowerCase().includes(search.toLowerCase()) ||
        t.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));

      const matchType = filterType === 'all' || t.type === filterType;
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [teams, search, filterType, filterStatus]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: 'search_rescue',
      staffCount: 25,
      skills: 'Flood Water Rescue, Inflatable Boats, First Aid',
      homeBase: 'Central District Station',
      status: 'Available',
      currentAssignment: '',
      contactCallsign: `UNIT-${Math.floor(10 + Math.random() * 89)}`,
      contactPhone: '+91 98765-DEMO',
      latitude: 28.6250,
      longitude: 77.2250
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (t: ResponseTeam) => {
    setEditingTeam(t);
    setFormData({
      name: t.name,
      type: t.type,
      staffCount: t.staffCount,
      skills: t.skills.join(', '),
      homeBase: t.homeBase,
      status: t.status,
      currentAssignment: t.currentAssignment || '',
      contactCallsign: t.contactCallsign,
      contactPhone: t.contactPhone,
      latitude: t.latitude,
      longitude: t.longitude
    });
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addTeam({
      name: formData.name.trim(),
      type: formData.type,
      staffCount: Number(formData.staffCount) || 1,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      homeBase: formData.homeBase.trim(),
      status: formData.status,
      currentAssignment: formData.currentAssignment.trim() || undefined,
      contactCallsign: formData.contactCallsign.trim() || 'UNIT-01',
      contactPhone: formData.contactPhone.trim() || '+91 98765-DEMO',
      latitude: Number(formData.latitude) || 28.6139,
      longitude: Number(formData.longitude) || 77.2090
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !formData.name.trim()) return;

    updateTeam(editingTeam.id, {
      name: formData.name.trim(),
      type: formData.type,
      staffCount: Number(formData.staffCount) || 1,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      homeBase: formData.homeBase.trim(),
      status: formData.status,
      currentAssignment: formData.currentAssignment.trim() || undefined,
      contactCallsign: formData.contactCallsign.trim(),
      contactPhone: formData.contactPhone.trim(),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude)
    });

    setEditingTeam(null);
  };

  const handleQuickStatus = (teamId: string, newStatus: TeamStatus) => {
    updateTeam(teamId, { status: newStatus });
  };

  const typeLabels: Record<TeamType, string> = {
    search_rescue: 'Search & Rescue',
    medical: 'Medical Corps',
    fire_hazmat: 'Fire & Hazmat',
    logistics: 'Relief Logistics',
    evacuation: 'Evacuation Taskforce',
    technical: 'Technical & Comms'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-operational-cyan" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              RESPONSE TEAMS REGISTRY
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
              {teams.length} OPERATIONAL UNITS
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Monitor staffing, capabilities, current deployment, and field readiness.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
          restricted={!canManageTeams}
          restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'manage_teams')}
        >
          Add Response Team
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search teams by name, skills, base, or callsign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Disciplines</option>
            <option value="search_rescue">Search & Rescue</option>
            <option value="medical">Medical Corps</option>
            <option value="fire_hazmat">Fire & Hazmat</option>
            <option value="logistics">Relief Logistics</option>
            <option value="evacuation">Evacuation Support</option>
            <option value="technical">Technical & Comms</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Readiness States</option>
            <option value="Available">Available (Ready)</option>
            <option value="Deployed">Deployed</option>
            <option value="Busy">Busy</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Teams Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTeams.map((team) => {
          const statusColors = {
            Available: 'bg-safe/15 text-safe border-safe/30',
            Deployed: 'bg-operational-cyan/15 text-operational-cyan border-operational-cyan/30',
            Busy: 'bg-hazard/15 text-hazard border-hazard/30',
            'Off Duty': 'bg-panel-subtle text-primary-dim border-border'
          };

          return (
            <div
              key={team.id}
              className="bg-panel border border-border rounded-lg p-4 flex flex-col justify-between hover:border-border-subtle transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-primary-dim uppercase tracking-wider block">
                      {typeLabels[team.type]} • {team.id}
                    </span>
                    <h3 className="text-sm font-bold text-primary mt-0.5">{team.name}</h3>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${statusColors[team.status]}`}>
                    {team.status}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between text-primary-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary-dim" /> Staffing:
                    </span>
                    <span className="font-mono font-bold text-primary">{team.staffCount} personnel</span>
                  </div>

                  <div className="flex items-center justify-between text-primary-muted">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary-dim" /> Home Depot:
                    </span>
                    <span className="font-medium text-primary truncate max-w-[180px]">{team.homeBase}</span>
                  </div>

                  <div className="p-2 bg-charcoal rounded border border-border text-[11px]">
                    <span className="text-[10px] font-mono text-primary-dim block uppercase">Current Assignment</span>
                    <p className="text-primary-muted mt-0.5 line-clamp-2">
                      {team.currentAssignment || 'Standing by for incident command dispatch.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-primary-dim block mb-1 uppercase">Capabilities</span>
                    <div className="flex flex-wrap gap-1">
                      {team.skills.map((s, idx) => (
                        <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Quick Status Switcher & Action Buttons */}
              <div className="pt-3 mt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-primary-dim mr-1">STATE:</span>
                  {(['Available', 'Deployed', 'Busy'] as TeamStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleQuickStatus(team.id, st)}
                      disabled={!canManageTeams || team.status === st}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        team.status === st 
                          ? 'bg-panel-subtle text-primary border-primary' 
                          : 'bg-charcoal text-primary-dim border-border hover:text-primary hover:bg-panel-elevated'
                      }`}
                    >
                      {st.slice(0, 4)}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(team)}
                    disabled={!canManageTeams}
                    className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle"
                    title="Edit team details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(team.id)}
                    disabled={!canManageTeams}
                    className="p-1 rounded text-primary-muted hover:text-emergency hover:bg-emergency/10"
                    title="Remove team"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TEAM MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Response Team"
        subtitle="Add a specialized response unit, battalion, or emergency corps."
      >
        <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Team Name</label>
            <input
              type="text"
              placeholder="e.g. State Disaster Response Force — Charlie Boat Team"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Discipline Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TeamType })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="search_rescue">Search & Rescue</option>
                <option value="medical">Medical Corps</option>
                <option value="fire_hazmat">Fire & Hazmat</option>
                <option value="logistics">Relief Logistics</option>
                <option value="evacuation">Evacuation Taskforce</option>
                <option value="technical">Technical & Comms</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Staffing Count</label>
              <input
                type="number"
                min="1"
                value={formData.staffCount}
                onChange={(e) => setFormData({ ...formData, staffCount: parseInt(e.target.value) || 1 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Skills & Capabilities (comma-separated)</label>
            <input
              type="text"
              placeholder="Swift water rescue, Inflatable boats, Triage"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Home Depot / Station</label>
              <input
                type="text"
                placeholder="Indraprashtha Sector 4 Depot"
                value={formData.homeBase}
                onChange={(e) => setFormData({ ...formData, homeBase: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Readiness Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamStatus })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Available">Available (Ready)</option>
                <option value="Deployed">Deployed</option>
                <option value="Busy">Busy</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Current Assignment</label>
            <input
              type="text"
              placeholder="e.g. Staged at Yamuna River revetment"
              value={formData.currentAssignment}
              onChange={(e) => setFormData({ ...formData, currentAssignment: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Register Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TEAM MODAL */}
      <Modal
        isOpen={editingTeam !== null}
        onClose={() => setEditingTeam(null)}
        title={`Edit Response Team: ${editingTeam?.name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Team Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Readiness Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamStatus })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="Deployed">Deployed</option>
                <option value="Busy">Busy</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Staffing Count</label>
              <input
                type="number"
                min="1"
                value={formData.staffCount}
                onChange={(e) => setFormData({ ...formData, staffCount: parseInt(e.target.value) || 1 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Current Assignment</label>
            <input
              type="text"
              value={formData.currentAssignment}
              onChange={(e) => setFormData({ ...formData, currentAssignment: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Skills & Capabilities</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setEditingTeam(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Update Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteTeam(deletingId);
            setDeletingId(null);
          }
        }}
        title="Remove Response Team?"
        message="This team will be deleted from the operational roster. Make sure no critical active incident tasks depend on this unit."
        confirmLabel="Remove Team"
        variant="danger"
      />
    </div>
  );
};
