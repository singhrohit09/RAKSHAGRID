/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Box, Send, MapPin, CheckCircle, AlertTriangle, ArrowRight, Layers, X } from 'lucide-react';
import { Resource, ResourceCategory, Team } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';

interface ResourcesPageProps {
  resources: Resource[];
  teams: Team[];
  onAllocateResource: (resourceId: string, quantity: number, teamName: string) => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  resources,
  teams,
  onAllocateResource,
}) => {
  const { permissions } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Allocation modal
  const [allocatingItem, setAllocatingItem] = useState<Resource | null>(null);
  const [dispatchQty, setDispatchQty] = useState<number>(1);
  const [selectedTeamName, setSelectedTeamName] = useState<string>(teams[0]?.name || '');

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.storageLocation.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [resources, search, categoryFilter]);

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingItem) return;
    onAllocateResource(allocatingItem.id, dispatchQty, selectedTeamName);
    setAllocatingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Disaster Logistics & Relief Stockpile"
        kicker="Supply Chain & Equipment"
        description="Strategic relief inventories, life-support asset allocation, field water purification, and trauma equipment dispatch."
        metadata={
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Total Catalogued Assets: <strong className="text-[#171B19]">{resources.length} SKUs</strong></span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">
              Stocked: {resources.filter((r) => r.status === 'stocked').length}
            </span>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E3DC] rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search inventory, equipment, depot location..."
          className="flex-1 max-w-md"
        />

        <FilterBar
          label="Category"
          options={[
            { id: 'all', label: 'All Items' },
            { id: 'rescue', label: 'Rescue' },
            { id: 'medical', label: 'Medical' },
            { id: 'equipment', label: 'Heavy Gear' },
            { id: 'provisions', label: 'Food Rations' },
            { id: 'power_water', label: 'Power & Water' },
          ]}
          selectedId={categoryFilter}
          onSelect={setCategoryFilter}
        />
      </div>

      {/* Resources Table / Grid */}
      <div className="border border-[#E4E3DC] rounded-xl bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E4E3DC] text-[#777D77] tracking-wider uppercase text-[11px] font-semibold">
                <th className="py-3 px-3.5">SKU ID</th>
                <th className="py-3 px-3.5">Asset Name</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Available / Total</th>
                <th className="py-3 px-3.5">Storage Depot</th>
                <th className="py-3 px-3.5">Assigned Target</th>
                <th className="py-3 px-3.5">Status</th>
                {permissions.canAllocateResources && <th className="py-3 px-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DC]">
              {filteredResources.map((item) => {
                const isLow = item.availableQuantity === 0;
                return (
                  <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-[#315C46] whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-[#171B19] max-w-[220px]">
                      {item.name}
                    </td>
                    <td className="py-3 px-3.5 uppercase text-[#777D77] font-mono text-[11px]">
                      {item.category.replace('_', ' & ')}
                    </td>
                    <td className="py-3 px-3.5 tabular-nums font-mono">
                      <span className={`font-bold ${isLow ? 'text-[#B9433D]' : 'text-[#171B19]'}`}>
                        {item.availableQuantity}
                      </span>{' '}
                      / {item.totalQuantity} <span className="text-[#777D77]">{item.unit}</span>
                    </td>
                    <td className="py-3 px-3.5 text-[#777D77] max-w-[180px] truncate">
                      {item.storageLocation}
                    </td>
                    <td className="py-3 px-3.5 text-[#171B19] max-w-[180px] truncate">
                      {item.assignedToTeamName || 'General Reserve'}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    {permissions.canAllocateResources && (
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={item.availableQuantity === 0}
                          onClick={() => {
                            setAllocatingItem(item);
                            setDispatchQty(Math.min(item.availableQuantity, 5));
                          }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#E5EDE6] text-[#315C46] hover:bg-[#315C46] hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-[#E5EDE6] disabled:hover:text-[#315C46] shadow-2xs"
                        >
                          Dispatch Stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate Stock Modal */}
      {allocatingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white border border-[#E4E3DC] rounded-xl shadow-xl p-5 text-[#171B19]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DC] mb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171B19]">
                  Dispatch Resource: {allocatingItem.id}
                </h3>
                <p className="text-xs text-[#777D77] mt-0.5">{allocatingItem.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAllocatingItem(null)}
                className="p-1 rounded-md text-[#777D77] hover:text-[#171B19] hover:bg-[#F5F4EF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E4E3DC] mb-4 text-xs">
              <span className="text-[#777D77]">Available in Reserve:</span>{' '}
              <span className="font-bold font-mono text-[#315C46]">{allocatingItem.availableQuantity}</span> {allocatingItem.unit}
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#171B19] tracking-wider mb-1.5">
                  Dispatch Quantity ({allocatingItem.unit}):
                </label>
                <input
                  type="number"
                  min={1}
                  max={allocatingItem.availableQuantity}
                  value={dispatchQty}
                  onChange={(e) => setDispatchQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs font-mono text-[#171B19] focus:outline-none focus:border-[#315C46]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#171B19] tracking-wider mb-1.5">
                  Recipient Team / Station:
                </label>
                <select
                  value={selectedTeamName}
                  onChange={(e) => setSelectedTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                  <option value="District Emergency Staging Depot">District Emergency Staging Depot</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E3DC]">
                <button
                  type="button"
                  onClick={() => setAllocatingItem(null)}
                  className="px-3.5 py-1.5 text-xs text-[#777D77] hover:text-[#171B19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
                >
                  Authorize Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
