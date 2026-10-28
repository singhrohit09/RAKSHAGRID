import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { Shelter } from '../types/shelter';
import { 
  Home, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Accessibility, 
  Droplets, 
  Zap, 
  UtensilsCrossed, 
  ShieldAlert
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';
import { formatNumber } from '../utils/formatters';

export const SheltersPage: React.FC = () => {
  const { shelters, activePersonaId, addShelter, updateShelter, deleteShelter } = useRaksha();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [updatingOccupancyShelter, setUpdatingOccupancyShelter] = useState<Shelter | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick occupancy update state
  const [newOccupancyVal, setNewOccupancyVal] = useState<number>(0);
  const [allowOverflowOverride, setAllowOverflowOverride] = useState<boolean>(false);
  const [occupancyError, setOccupancyError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    region: 'North Basin Riverine Zone',
    latitude: 28.6250,
    longitude: 77.2150,
    capacity: 1000,
    currentOccupancy: 0,
    contactPerson: '',
    contactPhone: '+91 98111-DEMO',
    notes: '',
    facilities: {
      water: true,
      medical: true,
      electricity: true,
      food: true,
      wheelchairAccess: true,
      sanitation: true,
      childCare: false
    }
  });

  const canManageShelters = hasPermission(activePersonaId, 'manage_shelters');

  const regions = useMemo(() => {
    return Array.from(new Set(shelters.map(s => s.region)));
  }, [shelters]);

  const filteredShelters = useMemo(() => {
    return shelters.filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase()) ||
        s.region.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());

      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchRegion = filterRegion === 'all' || s.region === filterRegion;

      return matchSearch && matchStatus && matchRegion;
    });
  }, [shelters, search, filterStatus, filterRegion]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      address: '',
      region: 'North Basin Riverine Zone',
      latitude: 28.6250,
      longitude: 77.2150,
      capacity: 1000,
      currentOccupancy: 0,
      contactPerson: 'Evacuation Coordinator',
      contactPhone: '+91 98111-DEMO',
      notes: 'Designated demo emergency shelter facility.',
      facilities: {
        water: true,
        medical: true,
        electricity: true,
        food: true,
        wheelchairAccess: true,
        sanitation: true,
        childCare: false
      }
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (s: Shelter) => {
    setEditingShelter(s);
    setFormData({
      name: s.name,
      address: s.address,
      region: s.region,
      latitude: s.latitude,
      longitude: s.longitude,
      capacity: s.capacity,
      currentOccupancy: s.currentOccupancy,
      contactPerson: s.contactPerson,
      contactPhone: s.contactPhone,
      notes: s.notes,
      facilities: { ...s.facilities }
    });
  };

  const handleOpenOccupancyUpdate = (s: Shelter) => {
    setUpdatingOccupancyShelter(s);
    setNewOccupancyVal(s.currentOccupancy);
    setAllowOverflowOverride(false);
    setOccupancyError(null);
  };

  const handleSaveOccupancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOccupancyShelter) return;

    const res = updateShelter(
      updatingOccupancyShelter.id,
      { currentOccupancy: Number(newOccupancyVal) },
      allowOverflowOverride
    );

    if (!res.success) {
      setOccupancyError(res.error || 'Failed to update occupancy.');
      return;
    }

    setUpdatingOccupancyShelter(null);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addShelter({
      name: formData.name.trim(),
      address: formData.address.trim(),
      region: formData.region,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      capacity: Number(formData.capacity) || 100,
      currentOccupancy: Number(formData.currentOccupancy) || 0,
      status: 'Open',
      facilities: formData.facilities,
      contactPerson: formData.contactPerson.trim(),
      contactPhone: formData.contactPhone.trim(),
      notes: formData.notes.trim()
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShelter || !formData.name.trim()) return;

    updateShelter(editingShelter.id, {
      name: formData.name.trim(),
      address: formData.address.trim(),
      region: formData.region,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      capacity: Number(formData.capacity) || 100,
      facilities: formData.facilities,
      contactPerson: formData.contactPerson.trim(),
      contactPhone: formData.contactPhone.trim(),
      notes: formData.notes.trim()
    });

    setEditingShelter(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-safe" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              SHELTER MANAGEMENT
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
              {shelters.length} EVACUATION SITES
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Track shelter capacity, bed availability, facilities, and intake operations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
          restricted={!canManageShelters}
          restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'manage_shelters')}
        >
          Register Shelter
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search by shelter name, region, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Near Capacity">Near Capacity (&ge;85%)</option>
            <option value="Full">Full (100%)</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Shelter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredShelters.map((shelter) => {
          const occupancyRate = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
          const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);

          const statusStyles = {
            Full: 'bg-emergency/15 text-emergency border-emergency/40',
            'Near Capacity': 'bg-hazard/15 text-hazard border-hazard/40',
            Open: 'bg-safe/15 text-safe border-safe/40',
            Closed: 'bg-panel-subtle text-primary-dim border-border'
          };

          return (
            <div
              key={shelter.id}
              className="bg-panel border border-border rounded-lg p-4 flex flex-col justify-between hover:border-border-subtle transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-primary-dim uppercase tracking-wider block">
                      {shelter.id} • {shelter.region}
                    </span>
                    <h3 className="text-sm font-bold text-primary mt-0.5">{shelter.name}</h3>
                    <p className="text-xs text-primary-muted mt-0.5">{shelter.address}</p>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${statusStyles[shelter.status]}`}>
                    {shelter.status}
                  </span>
                </div>

                {/* Capacity Meter */}
                <div className="my-3 p-3 bg-charcoal rounded border border-border">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-primary-dim">OCCUPANCY:</span>
                    <span className="font-bold text-primary">
                      {formatNumber(shelter.currentOccupancy)} / {formatNumber(shelter.capacity)} ({occupancyRate}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-panel-elevated rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-300 ${
                        occupancyRate >= 100 ? 'bg-emergency' : occupancyRate >= 85 ? 'bg-hazard' : 'bg-safe'
                      }`}
                      style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-primary-muted">
                    <span>Available Capacity:</span>
                    <span className={`font-bold ${availableBeds === 0 ? 'text-emergency' : 'text-safe'}`}>
                      {formatNumber(availableBeds)} beds
                    </span>
                  </div>
                </div>

                {/* Facilities Checklist Badges */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono text-primary-dim block uppercase">Verified Facilities</span>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {shelter.facilities.water && (
                      <span className="px-1.5 py-0.5 rounded bg-panel-subtle text-primary border border-border flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-operational-cyan" /> Water
                      </span>
                    )}
                    {shelter.facilities.medical && (
                      <span className="px-1.5 py-0.5 rounded bg-panel-subtle text-primary border border-border flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-safe" /> Medical
                      </span>
                    )}
                    {shelter.facilities.electricity && (
                      <span className="px-1.5 py-0.5 rounded bg-panel-subtle text-primary border border-border flex items-center gap-1">
                        <Zap className="w-3 h-3 text-hazard" /> Power
                      </span>
                    )}
                    {shelter.facilities.food && (
                      <span className="px-1.5 py-0.5 rounded bg-panel-subtle text-primary border border-border flex items-center gap-1">
                        <UtensilsCrossed className="w-3 h-3 text-primary-muted" /> Food
                      </span>
                    )}
                    {shelter.facilities.wheelchairAccess && (
                      <span className="px-1.5 py-0.5 rounded bg-panel-subtle text-primary border border-border flex items-center gap-1">
                        <Accessibility className="w-3 h-3 text-operational-cyan" /> Accessible
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-primary-dim mt-3 line-clamp-2 leading-relaxed">
                  {shelter.notes}
                </p>
              </div>

              {/* Card Actions */}
              <div className="pt-3 mt-4 border-t border-border flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenOccupancyUpdate(shelter)}
                  restricted={!canManageShelters}
                  restrictedReason="Updating shelter occupancy requires Logistics Officer or Administrator role."
                >
                  Update Count
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(shelter)}
                    disabled={!canManageShelters}
                    className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle"
                    title="Edit shelter details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(shelter.id)}
                    disabled={!canManageShelters}
                    className="p-1 rounded text-primary-muted hover:text-emergency hover:bg-emergency/10"
                    title="Remove shelter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK OCCUPANCY UPDATE MODAL WITH CAPACITY VALIDATION */}
      <Modal
        isOpen={updatingOccupancyShelter !== null}
        onClose={() => setUpdatingOccupancyShelter(null)}
        title={`Update Occupancy: ${updatingOccupancyShelter?.name}`}
        subtitle={`Current Capacity: ${updatingOccupancyShelter?.capacity} beds`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveOccupancy} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">
              Current Headcount / Occupancy
            </label>
            <input
              type="number"
              min="0"
              value={newOccupancyVal}
              onChange={(e) => {
                setNewOccupancyVal(parseInt(e.target.value) || 0);
                setOccupancyError(null);
              }}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary text-base focus:outline-none"
              required
            />
          </div>

          {updatingOccupancyShelter && newOccupancyVal > updatingOccupancyShelter.capacity && (
            <div className="p-3 bg-emergency-bg border border-emergency/40 rounded space-y-2">
              <div className="flex items-start gap-2 text-emergency">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">
                  OVERFLOW WARNING: Occupancy ({newOccupancyVal}) exceeds maximum capacity ({updatingOccupancyShelter.capacity}).
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-primary">
                <input
                  type="checkbox"
                  checked={allowOverflowOverride}
                  onChange={(e) => setAllowOverflowOverride(e.target.checked)}
                  className="rounded border-border text-emergency"
                />
                <span className="text-[11px] font-medium">
                  Confirm Emergency Overflow Override (Deploy auxiliary floor bedding)
                </span>
              </label>
            </div>
          )}

          {occupancyError && (
            <p className="text-emergency text-[11px] font-medium">{occupancyError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setUpdatingOccupancyShelter(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Save Headcount
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE SHELTER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Evacuation Shelter"
        subtitle="Add a certified school, stadium, or community center for emergency housing."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Shelter Name</label>
            <input
              type="text"
              placeholder="e.g. Sector 18 Community Sports Complex"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Address / Street</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-primary block mb-1">Operational Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Bed Capacity</label>
              <input
                type="number"
                min="10"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
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

          <div>
            <label className="font-semibold text-primary block mb-1">Available Facilities</label>
            <div className="grid grid-cols-3 gap-2 p-2 bg-charcoal rounded border border-border">
              {Object.keys(formData.facilities).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer capitalize">
                  <input
                    type="checkbox"
                    checked={(formData.facilities as any)[key]}
                    onChange={(e) => setFormData({
                      ...formData,
                      facilities: { ...formData.facilities, [key]: e.target.checked }
                    })}
                    className="rounded border-border text-safe"
                  />
                  <span className="text-primary-muted">{key.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Operational Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Register Shelter
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SHELTER MODAL */}
      <Modal
        isOpen={editingShelter !== null}
        onClose={() => setEditingShelter(null)}
        title={`Edit Shelter: ${editingShelter?.name}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Shelter Name</label>
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
              <label className="font-semibold text-primary block mb-1">Total Capacity</label>
              <input
                type="number"
                min="10"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-primary block mb-1">Operational Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Operational Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setEditingShelter(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Update Shelter
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
            deleteShelter(deletingId);
            setDeletingId(null);
          }
        }}
        title="Remove Shelter from Registry?"
        message="This will delete the shelter record and its capacity metrics. Ensure all housed evacuees are transferred prior to decommission."
        confirmLabel="Remove Shelter"
        variant="danger"
      />
    </div>
  );
};
