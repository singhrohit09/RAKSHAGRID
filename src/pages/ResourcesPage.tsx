import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { ResourceItem, ResourceCategory } from '../types/resource';
import { 
  Boxes, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';
import { formatNumber } from '../utils/formatters';

export const ResourcesPage: React.FC = () => {
  const { 
    resources, 
    activePersonaId, 
    addResource, 
    updateResource, 
    allocateResource, 
    releaseResource, 
    deleteResource 
  } = useRaksha();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [allocatingResource, setAllocatingResource] = useState<ResourceItem | null>(null);
  const [releasingResource, setReleasingResource] = useState<ResourceItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Allocation & Release Input State
  const [actionAmount, setActionAmount] = useState<number>(10);
  const [actionNote, setActionNote] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'food_water' as ResourceCategory,
    quantityAvailable: 1000,
    quantityAllocated: 0,
    unit: 'units',
    storageLocation: 'Central Supply Depot',
    minThreshold: 200
  });

  const canManage = hasPermission(activePersonaId, 'manage_resources');

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch = 
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.storageLocation.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());

      const matchCategory = filterCategory === 'all' || r.category === filterCategory;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [resources, search, filterCategory, filterStatus]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      category: 'food_water',
      quantityAvailable: 500,
      quantityAllocated: 0,
      unit: 'kits',
      storageLocation: 'Central Supply Depot',
      minThreshold: 100
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (r: ResourceItem) => {
    setEditingResource(r);
    setFormData({
      name: r.name,
      category: r.category,
      quantityAvailable: r.quantityAvailable,
      quantityAllocated: r.quantityAllocated,
      unit: r.unit,
      storageLocation: r.storageLocation,
      minThreshold: r.minThreshold
    });
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addResource({
      name: formData.name.trim(),
      category: formData.category,
      quantityAvailable: Number(formData.quantityAvailable) || 0,
      quantityAllocated: Number(formData.quantityAllocated) || 0,
      unit: formData.unit.trim() || 'units',
      storageLocation: formData.storageLocation.trim() || 'Depot',
      minThreshold: Number(formData.minThreshold) || 50
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource || !formData.name.trim()) return;

    updateResource(editingResource.id, {
      name: formData.name.trim(),
      category: formData.category,
      quantityAvailable: Number(formData.quantityAvailable),
      unit: formData.unit.trim(),
      storageLocation: formData.storageLocation.trim(),
      minThreshold: Number(formData.minThreshold)
    });

    setEditingResource(null);
  };

  const handleOpenAllocate = (r: ResourceItem) => {
    setAllocatingResource(r);
    setActionAmount(Math.min(r.quantityAvailable, 10));
    setActionNote('');
    setActionError(null);
  };

  const handleOpenRelease = (r: ResourceItem) => {
    setReleasingResource(r);
    setActionAmount(Math.min(r.quantityAllocated, 10));
    setActionNote('');
    setActionError(null);
  };

  const handleExecuteAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingResource) return;

    const res = allocateResource(allocatingResource.id, actionAmount, actionNote);
    if (!res.success) {
      setActionError(res.error || 'Allocation failed.');
      return;
    }
    setAllocatingResource(null);
  };

  const handleExecuteRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!releasingResource) return;

    const res = releaseResource(releasingResource.id, actionAmount, actionNote);
    if (!res.success) {
      setActionError(res.error || 'Release failed.');
      return;
    }
    setReleasingResource(null);
  };

  const categoryLabels: Record<ResourceCategory, string> = {
    food_water: 'Food & Potable Water',
    medical: 'Medical Supplies',
    rescue_gear: 'Rescue Equipment',
    vehicles: 'Vehicles & Transport',
    temporary_shelter: 'Temporary Shelter',
    communication: 'Comms Equipment',
    protective_equipment: 'Protective Equipment (PPE)'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-hazard" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              RESOURCE INVENTORY & RELIEF LOGISTICS
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
              {resources.length} STOCK ITEMS
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Monitor disaster reserves, allocate relief assets, and prevent supply depletion.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
          restricted={!canManage}
          restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'manage_resources')}
        >
          Add Inventory Item
        </Button>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search by resource name, depot location, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="food_water">Food & Water</option>
            <option value="medical">Medical Supplies</option>
            <option value="rescue_gear">Rescue Equipment</option>
            <option value="vehicles">Vehicles</option>
            <option value="temporary_shelter">Temporary Shelter</option>
            <option value="communication">Communications</option>
            <option value="protective_equipment">Protective Equipment</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Stock Levels</option>
            <option value="Sufficient">Sufficient</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Critical">Critical</option>
            <option value="Depleted">Depleted (0 available)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel-card text-[10px] font-mono text-primary-dim uppercase border-b border-border tracking-wider">
              <tr>
                <th className="p-3">Resource Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Available</th>
                <th className="p-3">Allocated</th>
                <th className="p-3">Storage Location</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Inventory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {filteredResources.map((item) => {
                const statusStyles = {
                  Sufficient: 'bg-safe/15 text-safe border-safe/30',
                  'Low Stock': 'bg-hazard/15 text-hazard border-hazard/30',
                  Critical: 'bg-emergency/15 text-emergency border-emergency/30',
                  Depleted: 'bg-emergency/25 text-emergency border-emergency/50 font-bold'
                };

                return (
                  <tr key={item.id} className="hover:bg-panel-elevated transition-colors">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-primary text-xs">{item.name}</div>
                      <div className="text-[10px] font-mono text-primary-dim">{item.id}</div>
                    </td>

                    <td className="p-3 font-sans text-primary-muted text-[11px]">
                      {categoryLabels[item.category]}
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-primary text-sm">{formatNumber(item.quantityAvailable)}</span>{' '}
                      <span className="text-[10px] text-primary-dim font-sans">{item.unit}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-operational-cyan">{formatNumber(item.quantityAllocated)}</span>{' '}
                      <span className="text-[10px] text-primary-dim font-sans">{item.unit}</span>
                    </td>

                    <td className="p-3 font-sans text-primary-muted text-[11px]">
                      {item.storageLocation}
                    </td>

                    <td className="p-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${statusStyles[item.status]}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAllocate(item)}
                          disabled={item.quantityAvailable <= 0}
                          restricted={!canManage}
                          title="Allocate quantity to active relief task"
                          className="text-[11px] px-2 py-1"
                        >
                          <ArrowUpRight className="w-3 h-3 text-hazard mr-1" /> Allocate
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRelease(item)}
                          disabled={item.quantityAllocated <= 0}
                          restricted={!canManage}
                          title="Return allocated quantity to available depot stock"
                          className="text-[11px] px-2 py-1"
                        >
                          <ArrowDownLeft className="w-3 h-3 text-safe mr-1" /> Release
                        </Button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          disabled={!canManage}
                          className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle ml-1"
                          title="Edit resource parameters"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingId(item.id)}
                          disabled={!canManage}
                          className="p-1 rounded text-primary-muted hover:text-emergency hover:bg-emergency/10"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALLOCATE MODAL */}
      <Modal
        isOpen={allocatingResource !== null}
        onClose={() => setAllocatingResource(null)}
        title={`Allocate Inventory: ${allocatingResource?.name}`}
        subtitle={`Available: ${allocatingResource?.quantityAvailable} ${allocatingResource?.unit}`}
        maxWidth="md"
      >
        <form onSubmit={handleExecuteAllocation} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">
              Quantity to Allocate ({allocatingResource?.unit})
            </label>
            <input
              type="number"
              min="1"
              max={allocatingResource?.quantityAvailable}
              value={actionAmount}
              onChange={(e) => {
                setActionAmount(parseInt(e.target.value) || 1);
                setActionError(null);
              }}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-base text-primary focus:outline-none"
              required
            />
            <p className="text-[10px] text-primary-dim mt-1 font-mono">
              *System validates allocations to strictly prevent negative inventory.
            </p>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">
              Dispatch Destination / Mission Note
            </label>
            <input
              type="text"
              placeholder="e.g. Dispatched to Shelter SHL-NORTH-01 via Convoy 5"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          {actionError && (
            <p className="text-emergency text-[11px] font-medium">{actionError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setAllocatingResource(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="warning" type="submit">
              Confirm Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* RELEASE MODAL */}
      <Modal
        isOpen={releasingResource !== null}
        onClose={() => setReleasingResource(null)}
        title={`Release Inventory: ${releasingResource?.name}`}
        subtitle={`Currently Allocated: ${releasingResource?.quantityAllocated} ${releasingResource?.unit}`}
        maxWidth="md"
      >
        <form onSubmit={handleExecuteRelease} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">
              Quantity to Return to Available Stock ({releasingResource?.unit})
            </label>
            <input
              type="number"
              min="1"
              max={releasingResource?.quantityAllocated}
              value={actionAmount}
              onChange={(e) => {
                setActionAmount(parseInt(e.target.value) || 1);
                setActionError(null);
              }}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-base text-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">
              Release Reason / Mission Note
            </label>
            <input
              type="text"
              placeholder="e.g. Unused units returned from Sector 4 staging post"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          {actionError && (
            <p className="text-emergency text-[11px] font-medium">{actionError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setReleasingResource(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="safe" type="submit">
              Return to Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Inventory Item"
        subtitle="Register relief supplies, medical stockpiles, or emergency equipment."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Item Name</label>
            <input
              type="text"
              placeholder="e.g. Field Surgical Trauma Kits"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="food_water">Food & Water</option>
                <option value="medical">Medical Supplies</option>
                <option value="rescue_gear">Rescue Equipment</option>
                <option value="vehicles">Vehicles</option>
                <option value="temporary_shelter">Temporary Shelter</option>
                <option value="communication">Communications</option>
                <option value="protective_equipment">Protective Equipment</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Unit of Measurement</label>
              <input
                type="text"
                placeholder="kits, jerrycans, boxes, vehicles"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Initial Quantity Available</label>
              <input
                type="number"
                min="0"
                value={formData.quantityAvailable}
                onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) || 0 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Low Stock Warning Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 1 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Storage Warehouse / Depot Location</label>
            <input
              type="text"
              placeholder="e.g. Central Relief Depot Bay 3"
              value={formData.storageLocation}
              onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Register Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editingResource !== null}
        onClose={() => setEditingResource(null)}
        title={`Edit Item: ${editingResource?.name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Item Name</label>
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
              <label className="font-semibold text-primary block mb-1">Available Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.quantityAvailable}
                onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) || 0 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Low Stock Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 1 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Storage Location</label>
            <input
              type="text"
              value={formData.storageLocation}
              onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setEditingResource(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Update Resource
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
            deleteResource(deletingId);
            setDeletingId(null);
          }
        }}
        title="Remove Resource Item?"
        message="This item and its recorded quantity metrics will be deleted from the operational inventory ledger."
        confirmLabel="Remove Item"
        variant="danger"
      />
    </div>
  );
};
