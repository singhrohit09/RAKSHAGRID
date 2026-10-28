import React, { useState } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { OperationalMap } from '../components/map/OperationalMap';
import { MapPin, Search } from 'lucide-react';
import { SeverityBadge } from '../components/common/Badge';

export const OperationalMapPage: React.FC = () => {
  const { incidents, teams, shelters } = useRaksha();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapSearch, setMapSearch] = useState('');

  const activeIncidents = incidents.filter(i => i.status !== 'Closed');

  const filteredIncidents = activeIncidents.filter(inc => 
    inc.title.toLowerCase().includes(mapSearch.toLowerCase()) ||
    inc.locationName.toLowerCase().includes(mapSearch.toLowerCase()) ||
    inc.id.toLowerCase().includes(mapSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-operational-cyan" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              OPERATIONAL SITUATION MAP
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-safe/10 text-safe border border-safe/30 uppercase font-bold">
              GEO-SPATIAL HUD
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Geographic view of active disaster hazards, field response units, and evacuation shelters.
          </p>
        </div>

        {/* Legend Quick Reference */}
        <div className="flex items-center gap-3 text-xs font-mono bg-panel px-3 py-1.5 rounded border border-border">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emergency" />
            <span className="text-primary-muted">Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-operational-cyan" />
            <span className="text-primary-muted">Team</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-safe" />
            <span className="text-primary-muted">Shelter</span>
          </div>
        </div>
      </div>

      {/* Main Map Layout: Left Quick Select Drawer + Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: Active Incident Quick Navigator */}
        <div className="bg-panel border border-border rounded-lg p-3 flex flex-col h-[600px] lg:h-[700px]">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Active Hazards ({filteredIncidents.length})
              </span>
              <span className="text-[10px] font-mono text-primary-dim">CLICK TO LOCATE</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-dim" />
              <input
                type="text"
                placeholder="Filter hazards on map..."
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="w-full bg-charcoal border border-border rounded pl-8 pr-2.5 py-1 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredIncidents.map((inc) => {
              const isSelected = inc.id === selectedIncidentId;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-panel-subtle border-primary text-primary shadow-md'
                      : 'bg-panel-elevated/70 border-border hover:border-border-subtle text-primary-muted hover:text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-semibold text-primary-dim">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <div className="font-bold text-primary truncate">{inc.title}</div>
                  <div className="text-[11px] text-primary-dim mt-0.5 truncate">{inc.locationName}</div>
                  
                  {inc.assignedTeamName && (
                    <div className="text-[10px] text-operational-cyan mt-1 font-mono truncate">
                      Unit: {inc.assignedTeamName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2 mt-2 bg-charcoal rounded border border-border text-[10px] text-primary-dim leading-relaxed">
            <strong className="text-hazard block mb-0.5">SIMULATION NOTICE:</strong>
            Map markers use OpenStreetMap vector tiles. GPS tracking is simulated for Phase 1.
          </div>
        </div>

        {/* Map Center & Right */}
        <div className="lg:col-span-3">
          <OperationalMap
            incidents={incidents}
            teams={teams}
            shelters={shelters}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={(inc) => setSelectedIncidentId(inc ? inc.id : null)}
          />
        </div>
      </div>
    </div>
  );
};
