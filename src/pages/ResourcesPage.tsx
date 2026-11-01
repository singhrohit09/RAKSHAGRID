/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Box, Send, MapPin, CheckCircle, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
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
        kicker="Material & Supply Supply Chain"
        description="Strategic relief inventories, life-support asset allocation, field water purification, and trauma equipment dispatch."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Total Catalogued Assets: {resources.length} SKUs</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">
              Stocked: {resources.filter((r) => r.status === 'stocked').length}
            </span>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-3.5 bg-[#12171e] border border-slate-800 rounded flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
      <div className="border border-slate-800 rounded bg-[#12171e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0d1117] border-b border-slate-800 text-slate-400 tracking-wider uppercase text-[11px]">
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
            <tbody className="divide-y divide-slate-850">
              {filteredResources.map((item) => {
                const isLow = item.availableQuantity === 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-amber-400 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="py-3 px-3.5 font-sans font-medium text-slate-100 max-w-[220px]">
                      {item.name}
                    </td>
                    <td className="py-3 px-3.5 uppercase text-slate-400">
                      {item.category.replace('_', ' & ')}
                    </td>
                    <td className="py-3 px-3.5 tabular-nums">
                      <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-100'}`}>
                        {item.availableQuantity}
                      </span>{' '}
                      / {item.totalQuantity} <span className="text-slate-500">{item.unit}</span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 max-w-[180px] truncate">
                      {item.storageLocation}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300 max-w-[180px] truncate">
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
                          className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-colors disabled:opacity-30 disabled:hover:bg-amber-500/20 disabled:hover:text-amber-300"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#161c24] border border-slate-750 rounded shadow-2xl p-5 text-slate-200">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 mb-1">
              Dispatch Resource: {allocatingItem.id}
            </h3>
            <p className="text-xs text-slate-300 mb-3 font-semibold">{allocatingItem.name}</p>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-850 mb-4 font-mono text-xs">
              <span className="text-slate-400">Available in Reserve:</span>{' '}
              <span className="font-bold text-amber-400">{allocatingItem.availableQuantity}</span> {allocatingItem.unit}
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Dispatch Quantity ({allocatingItem.unit}):
                </label>
                <input
                  type="number"
                  min={1}
                  max={allocatingItem.availableQuantity}
                  value={dispatchQty}
                  onChange={(e) => setDispatchQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Recipient Team / Station:
                </label>
                <select
                  value={selectedTeamName}
                  onChange={(e) => setSelectedTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500/80"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                  <option value="District Emergency Staging Depot">District Emergency Staging Depot</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAllocatingItem(null)}
                  className="px-3.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
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
