import React, { useState } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { OperationalMap } from '../components/map/OperationalMap';
import { MapPin, Search, AlertTriangle } from 'lucide-react';
import { SeverityBadge } from '../components/common/Badge';

export const OperationalMapPage: React.FC = () => {
  const { 
    incidents, 
    teams, 
    shelters, 
    geofences, 
    spatialReport, 
    weatherReport, 
    riverGauges, 
    refreshWeather 
  } = useRaksha();

  const [activeTab, setActiveTab] = useState<'hazards' | 'geofences'>('hazards');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
  const [mapSearch, setMapSearch] = useState('');

  const activeIncidents = incidents.filter(i => i.status !== 'Closed');

  const filteredIncidents = activeIncidents.filter(inc => 
    inc.title.toLowerCase().includes(mapSearch.toLowerCase()) ||
    inc.locationName.toLowerCase().includes(mapSearch.toLowerCase()) ||
    inc.id.toLowerCase().includes(mapSearch.toLowerCase())
  );

  const filteredGeofences = geofences.filter(g =>
    g.name.toLowerCase().includes(mapSearch.toLowerCase()) ||
    g.category.toLowerCase().includes(mapSearch.toLowerCase()) ||
    g.id.toLowerCase().includes(mapSearch.toLowerCase())
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
              GIS SPATIAL ENGINE
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Geographic view of disaster hazards, geofence risk zones, field response units, and environmental telemetry.
          </p>
        </div>

        {/* Legend Quick Reference */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-panel px-3 py-1.5 rounded border border-border">
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
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-500" />
            <span className="text-primary-muted">Risk Geofence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-400" />
            <span className="text-primary-muted">River Gauge</span>
          </div>
        </div>
      </div>

      {/* Main Map Layout: Left Quick Select Drawer + Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side: Active Incident & Geofence Navigator */}
        <div className="bg-panel border border-border rounded-lg p-3 flex flex-col h-[620px] lg:h-[720px]">
          {/* Tabs: Hazards vs Geofences */}
          <div className="flex border-b border-border mb-3">
            <button
              onClick={() => setActiveTab('hazards')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === 'hazards'
                  ? 'border-operational-cyan text-operational-cyan'
                  : 'border-transparent text-primary-dim hover:text-primary'
              }`}
            >
              Hazards ({filteredIncidents.length})
            </button>
            <button
              onClick={() => setActiveTab('geofences')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === 'geofences'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-primary-dim hover:text-primary'
              }`}
            >
              Geofences ({filteredGeofences.length})
            </button>
          </div>

          <div className="mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-dim" />
              <input
                type="text"
                placeholder={activeTab === 'hazards' ? "Filter hazards on map..." : "Filter geofences..."}
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="w-full bg-charcoal border border-border rounded pl-8 pr-2.5 py-1 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {activeTab === 'hazards' ? (
              filteredIncidents.map((inc) => {
                const isSelected = inc.id === selectedIncidentId;
                const containedZones = spatialReport?.incidentZoneMap[inc.id] || [];

                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      setSelectedGeofenceId(null);
                    }}
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
                    
                    {containedZones.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-orange-400 font-mono">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Inside {containedZones.length} Risk Zone{containedZones.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {inc.assignedTeamName && (
                      <div className="text-[10px] text-operational-cyan mt-1 font-mono truncate">
                        Unit: {inc.assignedTeamName}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              filteredGeofences.map((zone) => {
                const isSelected = zone.id === selectedGeofenceId;
                const evalResult = spatialReport?.evaluations.find(e => e.zoneId === zone.id);

                return (
                  <div
                    key={zone.id}
                    onClick={() => {
                      setSelectedGeofenceId(zone.id);
                      setSelectedIncidentId(null);
                    }}
                    className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-panel-subtle border-orange-500 text-primary shadow-md'
                        : 'bg-panel-elevated/70 border-border hover:border-border-subtle text-primary-muted hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-semibold text-primary-dim">{zone.id}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        zone.severity === 'Critical' 
                          ? 'bg-emergency/20 text-emergency' 
                          : zone.severity === 'High' 
                          ? 'bg-hazard/20 text-hazard' 
                          : 'bg-operational-cyan/20 text-operational-cyan'
                      }`}>
                        {zone.severity}
                      </span>
                    </div>
                    <div className="font-bold text-primary truncate">{zone.name}</div>
                    <div className="text-[11px] text-primary-dim mt-0.5 capitalize">{zone.category} • {zone.shapeType}</div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-primary-muted pt-1 border-t border-border/50">
                      <span>Incidents: <strong className="text-emergency">{evalResult?.incidentCount ?? 0}</strong></span>
                      <span>Teams: <strong className="text-operational-cyan">{evalResult?.teamCount ?? 0}</strong></span>
                      <span>Status: <strong className="text-primary">{zone.status}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 mt-2 bg-charcoal rounded border border-border text-[10px] text-primary-dim leading-relaxed">
            <strong className="text-safe block mb-0.5">SPATIAL INTEL INTEGRATION:</strong>
            Real Open-Meteo telemetry & Ray-Casting Polygon Geofencing Engine active.
          </div>
        </div>

        {/* Map Center & Right */}
        <div className="lg:col-span-3">
          <OperationalMap
            incidents={incidents}
            teams={teams}
            shelters={shelters}
            geofences={geofences}
            spatialReport={spatialReport}
            weatherReport={weatherReport}
            riverGauges={riverGauges}
            selectedIncidentId={selectedIncidentId}
            selectedGeofenceId={selectedGeofenceId}
            onSelectIncident={(inc) => {
              setSelectedIncidentId(inc ? inc.id : null);
              if (inc) setSelectedGeofenceId(null);
            }}
            onSelectGeofence={(zone) => {
              setSelectedGeofenceId(zone ? zone.id : null);
              if (zone) setSelectedIncidentId(null);
            }}
            onRefreshWeather={refreshWeather}
          />
        </div>
      </div>
    </div>
  );
};
