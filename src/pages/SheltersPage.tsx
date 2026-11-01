/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Home, Users, MapPin, Phone, CheckCircle, AlertTriangle, Edit3 } from 'lucide-react';
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
        return <span className="font-mono text-emerald-400 text-xs">● Adequate</span>;
      case 'moderate':
        return <span className="font-mono text-amber-400 text-xs">▲ Moderate</span>;
      case 'critical':
        return <span className="font-mono text-rose-400 text-xs font-bold animate-pulse">■ Critical Shortage</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Evacuation Shelters & Relief Hubs"
        kicker="Humanitarian Logistics Infrastructure"
        description="Real-time capacity tracking, emergency bed occupancy, life-support supply inventories, and on-site facility screening."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Total Shelters: {shelters.length}</span>
            <span>·</span>
            <span className="text-sky-400 font-semibold">
              Total Safe Capacity: {shelters.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()} Evacuees
            </span>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-3.5 bg-[#12171e] border border-slate-800 rounded flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-sky-400">{shelter.id}</span>
                  <StatusBadge status={shelter.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-slate-100 font-sans mb-1 leading-snug">
                  {shelter.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{shelter.location} ({shelter.region})</span>
                </div>

                {/* Capacity Meter */}
                <div className="p-2.5 rounded bg-slate-900 border border-slate-850 mb-3">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400">Occupancy:</span>
                    <span className="font-bold text-slate-100 tabular-nums">
                      {shelter.currentOccupancy.toLocaleString()} / {shelter.capacity.toLocaleString()} ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{shelter.capacity - shelter.currentOccupancy} beds available</span>
                    <span>{shelter.currentOccupancy} checked in</span>
                  </div>
                </div>

                {/* Supply Status */}
                <div className="flex items-center justify-between text-xs font-mono py-1.5 border-t border-slate-850">
                  <span className="text-slate-400">Ration & Water Status:</span>
                  <div>{getSupplyBadge(shelter.supplyLevel)}</div>
                </div>

                {/* Facilities List */}
                <div className="mt-2.5 pt-2 border-t border-slate-850">
                  <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                    On-Site Humanitarian Facilities
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug">
                    {shelter.facilities.join(' · ')}
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-3 pt-2 border-t border-slate-850 text-xs text-slate-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {shelter.contactPerson}: <span className="font-mono text-slate-300">{shelter.contactPhone}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              {permissions.canUpdateShelter && (
                <div className="mt-4 pt-3 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShelter(shelter);
                      setNewOccupancy(shelter.currentOccupancy);
                    }}
                    className="w-full py-1.5 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Update Headcount Occupancy</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-[#161c24] border border-slate-750 rounded shadow-2xl p-5 text-slate-200">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 mb-1">
              Update Occupancy: {editingShelter.id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{editingShelter.name}</p>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Current Occupant Headcount (Max: {editingShelter.capacity}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={editingShelter.capacity}
                  value={newOccupancy}
                  onChange={(e) => setNewOccupancy(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingShelter(null)}
                  className="px-3.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
