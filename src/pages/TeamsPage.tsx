/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Users, Phone, MapPin, Wrench, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { Team, TeamStatus, Incident } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';

interface TeamsPageProps {
  teams: Team[];
  incidents: Incident[];
  onUpdateTeamStatus: (teamId: string, status: TeamStatus, incidentId?: string, incidentTitle?: string) => void;
  onNavigateToIncident: (id: string) => void;
}

export const TeamsPage: React.FC<TeamsPageProps> = ({
  teams,
  incidents,
  onUpdateTeamStatus,
  onNavigateToIncident,
}) => {
  const { permissions } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dispatch modal
  const [dispatchTargetTeam, setDispatchTargetTeam] = useState<Team | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.leader.toLowerCase().includes(q) ||
          t.specialization.toLowerCase().includes(q) ||
          t.assignedZone.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [teams, search, statusFilter]);

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTargetTeam) return;

    const inc = incidents.find((i) => i.id === selectedIncidentId);
    onUpdateTeamStatus(
      dispatchTargetTeam.id,
      'deployed',
      inc?.id,
      inc?.title
    );
    setDispatchTargetTeam(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Tactical Response Teams Directory"
        kicker="Emergency Force Allocation"
        description="Deployment readiness, skill proficiencies, operational commanders, and equipment rosters across all disaster response units."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Total Units: {teams.length}</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">
              Available: {teams.filter((t) => t.status === 'available').length}
            </span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">
              Deployed: {teams.filter((t) => t.status === 'deployed').length}
            </span>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-3.5 bg-[#12171e] border border-slate-800 rounded flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search team name, commander, specialization, zone..."
          className="flex-1 max-w-md"
        />

        <FilterBar
          label="Status"
          options={[
            { id: 'all', label: 'All Units' },
            { id: 'available', label: 'Available' },
            { id: 'deployed', label: 'Deployed' },
            { id: 'standby', label: 'Standby' },
          ]}
          selectedId={statusFilter}
          onSelect={setStatusFilter}
        />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-amber-400">{team.id}</span>
                <StatusBadge status={team.status} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-slate-100 font-sans mb-1">
                {team.name}
              </h3>

              <div className="text-xs font-mono text-amber-500/90 font-medium mb-3">
                {team.specialization}
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-850">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Leader: <strong className="text-slate-200">{team.leader}</strong> ({team.memberCount} personnel)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{team.assignedZone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono">{team.contactNumber}</span>
                </div>
              </div>

              {/* Active Incident Assignment */}
              {team.activeIncidentTitle && (
                <div className="mt-3 p-2 rounded bg-amber-950/20 border border-amber-900/40 text-[11px]">
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-0.5">
                    Currently Operating At:
                  </div>
                  <div className="text-slate-200 font-medium truncate">
                    {team.activeIncidentTitle}
                  </div>
                </div>
              )}

              {/* Equipment summary */}
              <div className="mt-3 pt-2.5 border-t border-slate-850">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  <span>Gear & Heavy Assets</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  {team.equipment.join(' · ')}
                </div>
              </div>
            </div>

            {/* Actions */}
            {permissions.canDispatchTeam && (
              <div className="mt-4 pt-3 border-t border-slate-850 flex items-center gap-2">
                {team.status === 'available' ? (
                  <button
                    type="button"
                    onClick={() => setDispatchTargetTeam(team)}
                    className="w-full py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                  >
                    Deploy to Incident
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateTeamStatus(team.id, 'available')}
                    className="w-full py-1.5 text-xs font-mono rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
                  >
                    Stand Down to Base
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dispatch Modal */}
      {dispatchTargetTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#161c24] border border-slate-750 rounded shadow-2xl p-5 text-slate-200">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 mb-1">
              Dispatch Force: {dispatchTargetTeam.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select the active disaster incident requiring mobilization of this {dispatchTargetTeam.specialization} unit.
            </p>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Target Incident Operation:
                </label>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500/80"
                >
                  {incidents
                    .filter((i) => i.status !== 'resolved')
                    .map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        [{inc.id}] {inc.title} ({inc.severity.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDispatchTargetTeam(null)}
                  className="px-3.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  Authorize Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
