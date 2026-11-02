/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Users, Phone, MapPin, Wrench, AlertCircle, CheckCircle, ShieldCheck, X } from 'lucide-react';
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
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Total Units: <strong className="text-[#171B19]">{teams.length}</strong></span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">
              Available: {teams.filter((t) => t.status === 'available').length}
            </span>
            <span>·</span>
            <span className="text-[#C18A32] font-semibold">
              Deployed: {teams.filter((t) => t.status === 'deployed').length}
            </span>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E3DC] rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
            className="p-5 bg-white border border-[#E4E3DC] rounded-xl shadow-xs flex flex-col justify-between hover:border-[#D0CFC5] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-[#315C46]">{team.id}</span>
                <StatusBadge status={team.status} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-[#171B19] mb-1">
                {team.name}
              </h3>

              <div className="text-xs font-medium text-[#315C46] mb-3">
                {team.specialization}
              </div>

              <div className="space-y-2 text-xs text-[#777D77] pt-2.5 border-t border-[#E4E3DC]">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#777D77] shrink-0" />
                  <span>
                    Leader: <strong className="text-[#171B19]">{team.leader}</strong> ({team.memberCount} personnel)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#777D77] shrink-0" />
                  <span className="truncate">{team.assignedZone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#777D77] shrink-0" />
                  <span className="font-mono text-[#171B19] font-medium">{team.contactNumber}</span>
                </div>
              </div>

              {/* Active Incident Assignment */}
              {team.activeIncidentTitle && (
                <div className="mt-3 p-3 rounded-lg bg-[#FAF9F5] border border-[#E4E3DC] text-xs">
                  <div className="text-[10px] uppercase text-[#315C46] font-bold mb-0.5">
                    Currently Operating At:
                  </div>
                  <div className="text-[#171B19] font-medium truncate">
                    {team.activeIncidentTitle}
                  </div>
                </div>
              )}

              {/* Equipment summary */}
              <div className="mt-3 pt-2.5 border-t border-[#E4E3DC]">
                <div className="text-[10px] uppercase font-semibold text-[#777D77] mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-[#777D77]" />
                  <span>Equipment & Gear</span>
                </div>
                <div className="text-[11px] text-[#575D56] leading-snug">
                  {team.equipment.join(' · ')}
                </div>
              </div>
            </div>

            {/* Actions */}
            {permissions.canDispatchTeam && (
              <div className="mt-4 pt-3 border-t border-[#E4E3DC] flex items-center gap-2">
                {team.status === 'available' ? (
                  <button
                    type="button"
                    onClick={() => setDispatchTargetTeam(team)}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
                  >
                    Deploy to Incident
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateTeamStatus(team.id, 'available')}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EF] text-[#171B19] border border-[#E4E3DC] transition-colors shadow-2xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-[#E4E3DC] rounded-xl shadow-xl p-5 text-[#171B19]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DC] mb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171B19]">
                  Deploy Unit: {dispatchTargetTeam.name}
                </h3>
                <p className="text-xs text-[#777D77] mt-0.5">{dispatchTargetTeam.specialization}</p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchTargetTeam(null)}
                className="p-1 rounded-md text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#171B19] tracking-wider mb-1.5">
                  Target Emergency Incident:
                </label>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      [{inc.severity.toUpperCase()}] {inc.id}: {inc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E3DC]">
                <button
                  type="button"
                  onClick={() => setDispatchTargetTeam(null)}
                  className="px-3.5 py-1.5 text-xs text-[#777D77] hover:text-[#171B19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
                >
                  Confirm Field Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
