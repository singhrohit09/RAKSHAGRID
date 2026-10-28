import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '../../types/incident';
import { ResponseTeam } from '../../types/team';
import { Shelter } from '../../types/shelter';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  AlertCircle, 
  X
} from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import { formatCoordinates } from '../../utils/formatters';

interface OperationalMapProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  shelters: Shelter[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident | null) => void;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  incidents,
  teams,
  shelters,
  selectedIncidentId,
  onSelectIncident,
  defaultCenter = [28.6139, 77.2090],
  defaultZoom = 12
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Layer visibility toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRadiusZones, setShowRadiusZones] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  // Active selected record for inspect panel
  const [activeItem, setActiveItem] = useState<{
    type: 'incident' | 'team' | 'shelter';
    data: Incident | ResponseTeam | Shelter;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
        attributionControl: false
      });

      // Dark style OpenStreetMap / CartoDB tiles
      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        errorTileUrl: ''
      });

      tileLayer.on('tileerror', () => {
        // Tile loading issues shouldn't crash the map
        console.warn('Map tile failed to load. Operating in fallback vector mode.');
      });

      tileLayer.addTo(map);

      // Attribution control in corner
      L.control.attribution({
        position: 'bottomright',
        prefix: 'Leaflet | &copy; OpenStreetMap & CartoDB (Demo Mode)'
      }).addTo(map);

      // Coordinate tracking
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
      setMapError('Interactive map visualization could not initialize. Using table registry view.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultCenter, defaultZoom]);

  // Update Layers & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // 1. Render Incidents & Estimated Impact Zones
    if (showIncidents) {
      incidents.forEach((inc) => {
        const severityColors: Record<string, string> = {
          Critical: '#dc2626',
          High: '#d97706',
          Moderate: '#0284c7',
          Low: '#059669'
        };
        const color = severityColors[inc.severity] || '#d97706';

        // Estimated Radius Zone (explicitly labeled as estimate)
        if (showRadiusZones && inc.estimatedRadiusMeters && inc.status === 'Active') {
          const circle = L.circle([inc.latitude, inc.longitude], {
            radius: inc.estimatedRadiusMeters,
            color: color,
            weight: 1.5,
            dashArray: '4, 6',
            fillColor: color,
            fillOpacity: 0.12
          });
          circle.bindTooltip(`Estimated Impact Zone: ~${(inc.estimatedRadiusMeters / 1000).toFixed(1)} km (Model Prediction)`, {
            className: 'bg-charcoal text-primary border border-border text-xs font-mono p-1',
            direction: 'top'
          });
          circle.addTo(layersGroup);
        }

        // Incident Marker Custom Icon
        const iconHtml = `
          <div style="
            background: #161b22;
            border: 2px solid ${color};
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${color}88;
            cursor: pointer;
          ">
            <span style="color: ${color}; font-weight: bold; font-size: 11px; font-family: monospace;">!</span>
          </div>
        `;

        const markerIcon = L.divIcon({
          html: iconHtml,
          className: 'raksha-incident-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: markerIcon });
        marker.on('click', () => {
          setActiveItem({ type: 'incident', data: inc });
          if (onSelectIncident) onSelectIncident(inc);
        });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 180px;">
            <div style="font-weight: 700; color: #f0f3f6; margin-bottom: 4px;">${inc.title}</div>
            <div style="color: #9da7b3; font-size: 11px; margin-bottom: 6px;">${inc.locationName}</div>
            <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 10px;">
              <span style="color: ${color}; font-weight: bold;">${inc.severity}</span>
              <span style="color: #9da7b3;">${inc.status}</span>
            </div>
          </div>
        `, {
          className: 'raksha-leaflet-popup'
        });

        marker.addTo(layersGroup);
      });
    }

    // 2. Render Teams
    if (showTeams) {
      teams.forEach((t) => {
        const iconHtml = `
          <div style="
            background: #161b22;
            border: 2px solid #0284c7;
            border-radius: 6px;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
          ">
            <span style="color: #0284c7; font-weight: bold; font-size: 10px; font-family: monospace;">T</span>
          </div>
        `;

        const teamIcon = L.divIcon({
          html: iconHtml,
          className: 'raksha-team-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([t.latitude, t.longitude], { icon: teamIcon });
        marker.on('click', () => {
          setActiveItem({ type: 'team', data: t });
        });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
            <div style="font-weight: 700; color: #f0f3f6;">${t.name}</div>
            <div style="color: #9da7b3; font-size: 11px;">Status: <strong>${t.status}</strong> (${t.staffCount} staff)</div>
          </div>
        `, { className: 'raksha-leaflet-popup' });

        marker.addTo(layersGroup);
      });
    }

    // 3. Render Shelters
    if (showShelters) {
      shelters.forEach((s) => {
        const isNearCapacity = s.currentOccupancy >= s.capacity * 0.85;
        const shelterColor = s.status === 'Full' ? '#dc2626' : isNearCapacity ? '#d97706' : '#059669';

        const iconHtml = `
          <div style="
            background: #161b22;
            border: 2px solid ${shelterColor};
            border-radius: 4px;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: pointer;
          ">
            <span style="color: ${shelterColor}; font-weight: bold; font-size: 10px; font-family: monospace;">S</span>
          </div>
        `;

        const shelterIcon = L.divIcon({
          html: iconHtml,
          className: 'raksha-shelter-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([s.latitude, s.longitude], { icon: shelterIcon });
        marker.on('click', () => {
          setActiveItem({ type: 'shelter', data: s });
        });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
            <div style="font-weight: 700; color: #f0f3f6;">${s.name}</div>
            <div style="color: #9da7b3; font-size: 11px;">Occupancy: ${s.currentOccupancy} / ${s.capacity} (${s.status})</div>
          </div>
        `, { className: 'raksha-leaflet-popup' });

        marker.addTo(layersGroup);
      });
    }
  }, [incidents, teams, shelters, showIncidents, showTeams, showShelters, showRadiusZones, onSelectIncident]);

  // Handle auto-centering if selectedIncidentId is passed
  useEffect(() => {
    if (!selectedIncidentId || !mapInstanceRef.current) return;
    const target = incidents.find(i => i.id === selectedIncidentId);
    if (target) {
      mapInstanceRef.current.setView([target.latitude, target.longitude], 14, { animate: true });
      setActiveItem({ type: 'incident', data: target });
    }
  }, [selectedIncidentId, incidents]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleFitData = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: [number, number][] = [
      ...incidents.map(i => [i.latitude, i.longitude] as [number, number]),
      ...teams.map(t => [t.latitude, t.longitude] as [number, number]),
      ...shelters.map(s => [s.latitude, s.longitude] as [number, number])
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-panel border border-border rounded-lg text-center">
        <div>
          <AlertCircle className="w-8 h-8 text-hazard mx-auto mb-2" />
          <h4 className="text-sm font-bold text-primary mb-1">Map Visualization Offline</h4>
          <p className="text-xs text-primary-muted max-w-md">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] lg:h-[700px] rounded-lg overflow-hidden border border-border bg-charcoal">
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Layer Control & Stats HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 bg-panel/95 backdrop-blur-md p-1 rounded-md border border-border shadow-lg">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 font-medium transition-colors ${
              showLayerPanel ? 'bg-panel-subtle text-primary' : 'text-primary-muted hover:text-primary'
            }`}
            title="Toggle Map Layers"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          <div className="h-4 w-px bg-border mx-0.5" />

          <button
            onClick={handleFitData}
            className="p-1.5 rounded text-xs text-primary-muted hover:text-primary hover:bg-panel-subtle transition-colors"
            title="Fit to All Active Units & Incidents"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded text-xs text-primary-muted hover:text-primary hover:bg-panel-subtle transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded text-xs text-primary-muted hover:text-primary hover:bg-panel-subtle transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded Layer Panel */}
        {showLayerPanel && (
          <div className="bg-panel/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 w-56 text-xs space-y-2">
            <div className="font-bold text-primary mb-1 text-[11px] uppercase tracking-wider">
              Operational Layers
            </div>
            
            <label className="flex items-center justify-between cursor-pointer hover:text-primary text-primary-muted">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emergency" />
                Incidents ({incidents.length})
              </span>
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded border-border bg-charcoal text-emergency"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-primary text-primary-muted">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-operational-cyan" />
                Response Teams ({teams.length})
              </span>
              <input
                type="checkbox"
                checked={showTeams}
                onChange={(e) => setShowTeams(e.target.checked)}
                className="rounded border-border bg-charcoal text-operational-cyan"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-primary text-primary-muted">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-safe" />
                Shelters ({shelters.length})
              </span>
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
                className="rounded border-border bg-charcoal text-safe"
              />
            </label>

            <div className="pt-2 border-t border-border">
              <label className="flex items-center justify-between cursor-pointer hover:text-primary text-primary-muted">
                <span className="flex items-center gap-2 text-[11px]">
                  Estimated Impact Zones
                </span>
                <input
                  type="checkbox"
                  checked={showRadiusZones}
                  onChange={(e) => setShowRadiusZones(e.target.checked)}
                  className="rounded border-border bg-charcoal text-hazard"
                />
              </label>
              <p className="text-[10px] text-primary-dim mt-1">
                *Radius boundaries are modeled estimates, not survey lines.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Left: Coordinates HUD & Disclaimer */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
        <div className="bg-panel/90 backdrop-blur-sm border border-border px-2.5 py-1 rounded text-[11px] font-mono text-primary-muted flex items-center gap-2">
          <span>CURSOR:</span>
          <span className="text-primary font-semibold">
            {mouseCoords ? formatCoordinates(mouseCoords.lat, mouseCoords.lng) : 'Move cursor on map'}
          </span>
        </div>
      </div>

      {/* Selected Item Detail Drawer (Right side) */}
      {activeItem && (
        <div className="absolute top-3 right-3 bottom-12 w-80 max-w-[calc(100vw-2rem)] z-20 bg-panel border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
          <div className="p-3 border-b border-border bg-panel-card flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary-dim block">
                {activeItem.type.toUpperCase()} DETAIL INSPECTOR
              </span>
              <h4 className="text-xs font-bold text-primary truncate max-w-[200px]">
                {'title' in activeItem.data ? activeItem.data.title : activeItem.data.name}
              </h4>
            </div>
            <button
              onClick={() => setActiveItem(null)}
              className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 flex-1 overflow-y-auto custom-scrollbar text-xs space-y-3">
            {/* INCIDENT DETAILS */}
            {activeItem.type === 'incident' && (() => {
              const inc = activeItem.data as Incident;
              return (
                <>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">LOCATION</label>
                    <div className="text-primary font-medium">{inc.locationName}</div>
                    <div className="text-[11px] font-mono text-primary-muted mt-0.5">
                      {formatCoordinates(inc.latitude, inc.longitude)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">DESCRIPTION</label>
                    <p className="text-primary-muted leading-relaxed mt-0.5">{inc.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 bg-charcoal rounded border border-border font-mono text-[11px]">
                    <div>
                      <span className="text-primary-dim block">POPULATION:</span>
                      <span className="text-primary font-bold">{inc.affectedPopulation.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-primary-dim block">CASUALTIES:</span>
                      <span className="text-primary font-bold">{inc.casualties}</span>
                    </div>
                  </div>

                  {inc.assignedTeamName && (
                    <div className="p-2 rounded bg-operational-cyan/10 border border-operational-cyan/30 text-operational-cyan">
                      <span className="text-[10px] font-mono block">ASSIGNED RESPONSE UNIT</span>
                      <span className="font-semibold">{inc.assignedTeamName}</span>
                    </div>
                  )}

                  {inc.estimatedRadiusMeters && (
                    <div className="p-2 rounded bg-hazard/10 border border-hazard/30 text-hazard text-[11px]">
                      <strong>Estimated Impact Zone:</strong> {(inc.estimatedRadiusMeters / 1000).toFixed(1)} km radius. (Theoretical simulation zone)
                    </div>
                  )}
                </>
              );
            })()}

            {/* TEAM DETAILS */}
            {activeItem.type === 'team' && (() => {
              const t = activeItem.data as ResponseTeam;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-operational-cyan/20 text-operational-cyan border border-operational-cyan/40">
                      {t.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-primary-dim">{t.staffCount} PERSONNEL</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">HOME BASE</label>
                    <div className="text-primary font-medium">{t.homeBase}</div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">CURRENT ASSIGNMENT</label>
                    <p className="text-primary-muted mt-0.5">{t.currentAssignment || 'None designated.'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block mb-1">SKILLS & CAPABILITIES</label>
                    <div className="flex flex-wrap gap-1">
                      {t.skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal border border-border text-primary-muted">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 bg-charcoal rounded border border-border font-mono text-[11px]">
                    <span className="text-primary-dim block">CONTACT (SIMULATED):</span>
                    <span className="text-primary font-semibold">{t.contactCallsign} • {t.contactPhone}</span>
                  </div>
                </>
              );
            })()}

            {/* SHELTER DETAILS */}
            {activeItem.type === 'shelter' && (() => {
              const s = activeItem.data as Shelter;
              const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                      s.status === 'Full' 
                        ? 'bg-emergency/20 text-emergency border-emergency/40' 
                        : s.status === 'Near Capacity' 
                        ? 'bg-hazard/20 text-hazard border-hazard/40' 
                        : 'bg-safe/20 text-safe border-safe/40'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-primary-muted">{pct}% CAPACITY</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">ADDRESS</label>
                    <div className="text-primary font-medium">{s.address}</div>
                    <div className="text-primary-dim text-[11px]">{s.region}</div>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-primary-muted mb-1">
                      <span>OCCUPANCY: {s.currentOccupancy}</span>
                      <span>MAX: {s.capacity}</span>
                    </div>
                    <div className="w-full h-2 bg-charcoal rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full ${pct >= 100 ? 'bg-emergency' : pct >= 85 ? 'bg-hazard' : 'bg-safe'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-primary-muted text-[11px] leading-relaxed">{s.notes}</p>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
