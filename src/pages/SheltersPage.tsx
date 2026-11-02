/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Home, Users, MapPin, Phone, CheckCircle, AlertTriangle, Edit3, X } from 'lucide-react';
import { Shelter, SupplyLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';

interface SheltersPageProps {
  shelters: Shelter[];
  onUpdateShelterOccupancy: (shelterId: string, occupancy: number) => void;
}

export const SheltersPage: React.FC<SheltersPageProps> = ({
  shelters,
  onUpdateShelterOccupancy,
}) => {
  const { permissions } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Occupancy modal
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [newOccupancy, setNewOccupancy] = useState<number>(0);

  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [shelters, search, statusFilter]);

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShelter) return;
    onUpdateShelterOccupancy(editingShelter.id, newOccupancy);
    setEditingShelter(null);
  };

  const getSupplyBadge = (level: SupplyLevel) => {
    switch (level) {
      case 'adequate':
        return <span className="font-mono text-[#315C46] text-xs font-semibold">● Adequate</span>;
      case 'moderate':
        return <span className="font-mono text-[#C18A32] text-xs font-semibold">▲ Moderate</span>;
      case 'critical':
        return <span className="font-mono text-[#B9433D] text-xs font-bold animate-pulse">■ Critical Shortage</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Evacuation Shelters & Relief Hubs"
        kicker="Humanitarian Logistics"
        description="Real-time capacity tracking, emergency bed occupancy, life-support supply inventories, and on-site facility screening."
        metadata={
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Total Shelters: <strong className="text-[#171B19]">{shelters.length}</strong></span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">
              Total Safe Capacity: {shelters.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()} Evacuees
            </span>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E3DC] rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search shelter name, district, facility..."
          className="flex-1 max-w-md"
        />

        <FilterBar
          label="Status"
          options={[
            { id: 'all', label: 'All Shelters' },
            { id: 'open', label: 'Open' },
            { id: 'full', label: 'At Capacity' },
            { id: 'standby', label: 'Standby' },
          ]}
          selectedId={statusFilter}
          onSelect={setStatusFilter}
        />
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShelters.map((shelter) => {
          const occupancyPct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
          const isFull = shelter.status === 'full' || occupancyPct >= 95;

          return (
            <div
              key={shelter.id}
              className="p-5 bg-white border border-[#E4E3DC] rounded-xl shadow-xs flex flex-col justify-between hover:border-[#D0CFC5] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-[#315C46]">{shelter.id}</span>
                  <StatusBadge status={shelter.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-[#171B19] mb-1 leading-snug">
                  {shelter.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-[#777D77] mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#777D77] shrink-0" />
                  <span className="truncate">{shelter.location} ({shelter.region})</span>
                </div>

                {/* Capacity Meter */}
                <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E4E3DC] mb-3">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#777D77]">Occupancy:</span>
                    <span className="font-bold text-[#171B19] tabular-nums">
                      {shelter.currentOccupancy.toLocaleString()} / {shelter.capacity.toLocaleString()} ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E4E3DC] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-[#B9433D]' : occupancyPct > 70 ? 'bg-[#C18A32]' : 'bg-[#315C46]'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#777D77]">
                    <span>{shelter.capacity - shelter.currentOccupancy} beds available</span>
                    <span>{shelter.currentOccupancy} checked in</span>
                  </div>
                </div>

                {/* Supply Status */}
                <div className="flex items-center justify-between text-xs py-2 border-t border-[#E4E3DC]">
                  <span className="text-[#777D77]">Ration & Water Status:</span>
                  <div>{getSupplyBadge(shelter.supplyLevel)}</div>
                </div>

                {/* Facilities List */}
                <div className="mt-2.5 pt-2 border-t border-[#E4E3DC]">
                  <div className="text-[10px] uppercase font-semibold text-[#777D77] mb-1">
                    On-Site Facilities
                  </div>
                  <div className="text-[11px] text-[#575D56] leading-snug">
                    {shelter.facilities.join(' · ')}
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-3 pt-2 border-t border-[#E4E3DC] text-xs text-[#777D77] flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#777D77] shrink-0" />
                  <span className="truncate">
                    {shelter.contactPerson}: <span className="font-mono text-[#171B19] font-medium">{shelter.contactPhone}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              {permissions.canUpdateShelter && (
                <div className="mt-4 pt-3 border-t border-[#E4E3DC]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShelter(shelter);
                      setNewOccupancy(shelter.currentOccupancy);
                    }}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-[#FAF9F5] hover:bg-[#F5F4EF] text-[#171B19] border border-[#E4E3DC] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#315C46]" />
                    <span>Update Occupancy</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Headcount Modal */}
      {editingShelter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white border border-[#E4E3DC] rounded-xl shadow-xl overflow-hidden p-5 text-[#171B19]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DC] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171B19]">
                Update Occupancy Headcount
              </h3>
              <button
                type="button"
                onClick={() => setEditingShelter(null)}
                className="p-1 rounded-md text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-medium text-[#777D77] mb-1">{editingShelter.name}</div>
                <div className="text-xs text-[#777D77] mb-3">
                  Max Safe Capacity: <strong className="text-[#171B19] font-mono">{editingShelter.capacity}</strong>
                </div>

                <label className="block text-xs font-semibold text-[#171B19] uppercase tracking-wider mb-1.5">
                  Current Evacuee Count:
                </label>
                <input
                  type="number"
                  min="0"
                  max={editingShelter.capacity * 2}
                  value={newOccupancy}
                  onChange={(e) => setNewOccupancy(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-sm font-mono text-[#171B19] focus:outline-none focus:border-[#315C46]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E3DC] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingShelter(null)}
                  className="px-3.5 py-1.5 text-xs text-[#777D77] hover:text-[#171B19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
                >
                  Save Headcount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
