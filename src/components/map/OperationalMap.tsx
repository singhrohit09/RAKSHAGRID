import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '../../types/incident';
import { ResponseTeam } from '../../types/team';
import { Shelter } from '../../types/shelter';
import { GeofenceZone, SpatialEvaluationReport } from '../../types/geofence';
import { NormalizedWeatherReport, RiverGaugeReport } from '../../types/external';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  AlertCircle, 
  X,
  ShieldAlert,
  CloudRain,
  Wind,
  Droplets,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import { formatCoordinates } from '../../utils/formatters';

interface OperationalMapProps {
  incidents: Incident[];
  teams: ResponseTeam[];
  shelters: Shelter[];
  geofences?: GeofenceZone[];
  spatialReport?: SpatialEvaluationReport | null;
  weatherReport?: NormalizedWeatherReport | null;
  riverGauges?: RiverGaugeReport[];
  selectedIncidentId?: string | null;
  selectedGeofenceId?: string | null;
  onSelectIncident?: (incident: Incident | null) => void;
  onSelectGeofence?: (geofence: GeofenceZone | null) => void;
  onRefreshWeather?: () => void;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  incidents,
  teams,
  shelters,
  geofences = [],
  spatialReport = null,
  weatherReport = null,
  riverGauges = [],
  selectedIncidentId,
  selectedGeofenceId,
  onSelectIncident,
  onSelectGeofence,
  onRefreshWeather,
  defaultCenter = [28.6139, 77.2090],
  defaultZoom = 12
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);

  // Layer visibility toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRiverGauges, setShowRiverGauges] = useState(true);
  const [showRadiusZones, setShowRadiusZones] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showWeatherHud, setShowWeatherHud] = useState(true);

  // Active selected record for inspect panel
  const [activeItem, setActiveItem] = useState<{
    type: 'incident' | 'team' | 'shelter' | 'geofence' | 'riverGauge';
    data: Incident | ResponseTeam | Shelter | GeofenceZone | RiverGaugeReport;
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
        console.warn('Map tile failed to load. Operating in fallback vector mode.');
      });

      tileLayer.addTo(map);

      // Attribution control in corner
      L.control.attribution({
        position: 'bottomright',
        prefix: 'Leaflet | &copy; OpenStreetMap & CartoDB | Weather: Open-Meteo'
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

    // 0. Render Geofence Risk Zones (Phase 3 Spatial Intelligence)
    if (showGeofences && geofences.length > 0) {
      geofences.forEach((zone) => {
        const severityColors: Record<string, string> = {
          Critical: '#ef4444',
          High: '#f97316',
          Medium: '#eab308',
          Low: '#3b82f6'
        };
        const color = severityColors[zone.severity] || '#ef4444';
        const evalResult = spatialReport?.evaluations.find(e => e.zoneId === zone.id);

        let shapeLayer: L.Polygon | L.Circle | null = null;

        if (zone.shapeType === 'circle') {
          const lat = zone.centerLatitude || (zone.coordinates[0] ? zone.coordinates[0][0] : 28.6139);
          const lng = zone.centerLongitude || (zone.coordinates[0] ? zone.coordinates[0][1] : 77.2090);
          const radius = zone.radiusMeters || 1500;

          shapeLayer = L.circle([lat, lng], {
            radius: radius,
            color: color,
            fillColor: color,
            fillOpacity: zone.status === 'Active' ? 0.22 : 0.08,
            weight: zone.status === 'Active' ? 2 : 1,
            dashArray: zone.status === 'Monitoring' ? '6, 6' : undefined
          });
        } else if (zone.shapeType === 'polygon' && zone.coordinates.length >= 3) {
          shapeLayer = L.polygon(zone.coordinates, {
            color: color,
            fillColor: color,
            fillOpacity: zone.status === 'Active' ? 0.22 : 0.08,
            weight: zone.status === 'Active' ? 2 : 1,
            dashArray: zone.status === 'Monitoring' ? '6, 6' : undefined
          });
        }

        if (shapeLayer) {
          shapeLayer.on('click', () => {
            setActiveItem({ type: 'geofence', data: zone });
            if (onSelectGeofence) onSelectGeofence(zone);
          });

          shapeLayer.bindTooltip(`
            <div style="font-family: monospace; font-size: 11px;">
              <strong>${zone.name}</strong> [${zone.severity.toUpperCase()} RISK]<br/>
              Status: ${zone.status} • Incidents: ${evalResult?.incidentCount ?? 0}
            </div>
          `, { direction: 'top', className: 'raksha-leaflet-tooltip' });

          shapeLayer.addTo(layersGroup);
        }
      });
    }

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

        // Check if incident is contained in any active geofences
        const containedZones = spatialReport?.incidentZoneMap[inc.id] || [];
        const isGeofenced = containedZones.length > 0;

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
            width: ${isGeofenced ? '32px' : '28px'};
            height: ${isGeofenced ? '32px' : '28px'};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 ${isGeofenced ? '14px #ef4444' : '10px ' + color + '88'};
            cursor: pointer;
            position: relative;
          ">
            <span style="color: ${color}; font-weight: bold; font-size: 11px; font-family: monospace;">!</span>
            ${isGeofenced ? '<span style="position: absolute; top: -3px; right: -3px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 1px solid white;"></span>' : ''}
          </div>
        `;

        const markerIcon = L.divIcon({
          html: iconHtml,
          className: 'raksha-incident-icon',
          iconSize: isGeofenced ? [32, 32] : [28, 28],
          iconAnchor: isGeofenced ? [16, 16] : [14, 14]
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
            ${isGeofenced ? `<div style="margin-top: 6px; font-size: 10px; color: #ef4444; font-weight: bold;">⚠️ CONTAINED IN GEOFENCE RISK ZONE</div>` : ''}
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
        const isOverflow = s.currentOccupancy > s.capacity;
        const shelterColor = isOverflow ? '#ef4444' : s.status === 'Full' ? '#dc2626' : isNearCapacity ? '#d97706' : '#059669';

        const containedInZone = spatialReport?.shelterZoneMap[s.id] || [];
        const hasRiskZoneWarning = containedInZone.length > 0;

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
            position: relative;
          ">
            <span style="color: ${shelterColor}; font-weight: bold; font-size: 10px; font-family: monospace;">S</span>
            ${hasRiskZoneWarning ? '<span style="position: absolute; top: -3px; right: -3px; width: 7px; height: 7px; background: #f97316; border-radius: 50%;"></span>' : ''}
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
            ${hasRiskZoneWarning ? '<div style="color: #f97316; font-size: 10px; margin-top: 4px;">⚠️ Located in active geofenced zone</div>' : ''}
          </div>
        `, { className: 'raksha-leaflet-popup' });

        marker.addTo(layersGroup);
      });
    }

    // 4. Render River Gauges (Hydrological Telemetry)
    if (showRiverGauges && riverGauges.length > 0) {
      riverGauges.forEach((gauge) => {
        const stageColors: Record<string, string> = {
          inundation: '#ef4444',
          severe: '#dc2626',
          warning: '#f97316',
          watch: '#eab308',
          normal: '#0ea5e9'
        };
        const color = stageColors[gauge.floodStage] || '#0ea5e9';

        const iconHtml = `
          <div style="
            background: #0b1320;
            border: 2px solid ${color};
            border-radius: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 8px ${color}88;
            cursor: pointer;
          ">
            <span style="color: ${color}; font-weight: bold; font-size: 10px; font-family: monospace;">~</span>
          </div>
        `;

        const gaugeIcon = L.divIcon({
          html: iconHtml,
          className: 'raksha-gauge-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([gauge.latitude, gauge.longitude], { icon: gaugeIcon });
        marker.on('click', () => {
          setActiveItem({ type: 'riverGauge', data: gauge });
        });

        marker.bindPopup(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;">
            <div style="font-weight: 700; color: #f0f3f6;">${gauge.riverName} - ${gauge.locationName}</div>
            <div style="color: #9da7b3; font-size: 11px; margin-top: 2px;">
              Water Level: <strong>${gauge.waterLevelMeters} m</strong> (Danger: ${gauge.dangerLevelMeters} m)<br/>
              Discharge: <strong>${gauge.dischargeM3s} m³/s</strong> (${gauge.trend})
            </div>
            <div style="margin-top: 4px; font-family: monospace; font-size: 10px; color: ${color}; font-weight: bold;">
              STAGE: ${gauge.floodStage.toUpperCase()}
            </div>
          </div>
        `, { className: 'raksha-leaflet-popup' });

        marker.addTo(layersGroup);
      });
    }

  }, [
    incidents, 
    teams, 
    shelters, 
    geofences, 
    spatialReport, 
    riverGauges, 
    showIncidents, 
    showTeams, 
    showShelters, 
    showGeofences, 
    showRiverGauges, 
    showRadiusZones, 
    onSelectIncident, 
    onSelectGeofence
  ]);

  // Handle auto-centering if selectedIncidentId is passed
  useEffect(() => {
    if (!selectedIncidentId || !mapInstanceRef.current) return;
    const target = incidents.find(i => i.id === selectedIncidentId);
    if (target) {
      mapInstanceRef.current.setView([target.latitude, target.longitude], 14, { animate: true });
      setActiveItem({ type: 'incident', data: target });
    }
  }, [selectedIncidentId, incidents]);

  // Handle auto-centering if selectedGeofenceId is passed
  useEffect(() => {
    if (!selectedGeofenceId || !mapInstanceRef.current) return;
    const target = geofences.find(g => g.id === selectedGeofenceId);
    if (target) {
      const lat = target.centerLatitude || (target.coordinates[0] ? target.coordinates[0][0] : 28.6139);
      const lng = target.centerLongitude || (target.coordinates[0] ? target.coordinates[0][1] : 77.2090);
      mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
      setActiveItem({ type: 'geofence', data: target });
    }
  }, [selectedGeofenceId, geofences]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleFitData = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: [number, number][] = [
      ...incidents.map(i => [i.latitude, i.longitude] as [number, number]),
      ...teams.map(t => [t.latitude, t.longitude] as [number, number]),
      ...shelters.map(s => [s.latitude, s.longitude] as [number, number]),
      ...geofences.flatMap(g => g.coordinates)
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  const handleTriggerWeatherRefresh = async () => {
    if (!onRefreshWeather) return;
    setIsRefreshingWeather(true);
    try {
      await onRefreshWeather();
    } finally {
      setTimeout(() => setIsRefreshingWeather(false), 500);
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
    <div className="relative w-full h-[620px] lg:h-[720px] rounded-lg overflow-hidden border border-border bg-charcoal">
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
            title="Fit to All Active Units & Zones"
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
          <div className="bg-panel/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 w-60 text-xs space-y-2">
            <div className="font-bold text-primary mb-1 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Operational Layers</span>
              <span className="text-[10px] font-mono text-primary-dim">GIS ENGINE</span>
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

            {/* Geofences Layer */}
            <label className="flex items-center justify-between cursor-pointer hover:text-primary text-primary-muted">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-emergency" />
                Risk Geofences ({geofences.length})
              </span>
              <input
                type="checkbox"
                checked={showGeofences}
                onChange={(e) => setShowGeofences(e.target.checked)}
                className="rounded border-border bg-charcoal text-emergency"
              />
            </label>

            {/* River Gauges Layer */}
            <label className="flex items-center justify-between cursor-pointer hover:text-primary text-primary-muted">
              <span className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Hydrology Gauges ({riverGauges.length})
              </span>
              <input
                type="checkbox"
                checked={showRiverGauges}
                onChange={(e) => setShowRiverGauges(e.target.checked)}
                className="rounded border-border bg-charcoal text-blue-400"
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

      {/* Top Right: Live Weather & Environmental HUD */}
      {weatherReport && showWeatherHud && (
        <div className="absolute top-3 right-3 z-10 hidden sm:flex flex-col items-end gap-1.5">
          <div className="bg-panel/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-2.5 text-xs w-64">
            <div className="flex items-center justify-between pb-1.5 border-b border-border mb-2">
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-operational-cyan" />
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
                  Environmental HUD
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                  weatherReport.isLive 
                    ? 'bg-safe/20 text-safe border border-safe/40' 
                    : 'bg-hazard/20 text-hazard border border-hazard/40'
                }`}>
                  {weatherReport.isLive ? 'LIVE' : 'SIMULATED'}
                </span>
                {onRefreshWeather && (
                  <button
                    onClick={handleTriggerWeatherRefresh}
                    disabled={isRefreshingWeather}
                    className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle transition-colors"
                    title="Refresh Weather Telemetry"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingWeather ? 'animate-spin text-operational-cyan' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => setShowWeatherHud(false)}
                  className="p-0.5 rounded text-primary-dim hover:text-primary"
                  title="Hide HUD"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <div>
                <div className="text-base font-extrabold text-primary font-mono">
                  {weatherReport.temperatureC.toFixed(1)}°C
                </div>
                <div className="text-[10px] text-primary-muted capitalize">
                  {weatherReport.weatherDescription}
                </div>
              </div>
              <div className="text-right text-[10px] font-mono text-primary-muted space-y-0.5">
                <div className="flex items-center justify-end gap-1">
                  <Wind className="w-3 h-3 text-primary-dim" />
                  <span>{weatherReport.windSpeedKmh.toFixed(0)} km/h</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Droplets className="w-3 h-3 text-primary-dim" />
                  <span>{weatherReport.relativeHumidity}% RH</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-primary-dim pt-1.5 border-t border-border flex items-center justify-between">
              <span className="truncate max-w-[140px]" title={weatherReport.sourceAttribution}>
                Source: {weatherReport.sourceAttribution}
              </span>
              <span className="text-[9px]">
                {weatherReport.precipitationMm > 0 ? `${weatherReport.precipitationMm} mm rain` : 'No rain'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left: Coordinates HUD & Spatial Status */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
        <div className="bg-panel/90 backdrop-blur-sm border border-border px-2.5 py-1 rounded text-[11px] font-mono text-primary-muted flex items-center gap-2">
          <span>CURSOR:</span>
          <span className="text-primary font-semibold">
            {mouseCoords ? formatCoordinates(mouseCoords.lat, mouseCoords.lng) : 'Move cursor on map'}
          </span>
          {spatialReport && (
            <>
              <div className="h-3 w-px bg-border mx-1" />
              <span className="text-operational-cyan font-semibold">
                ZONES: {spatialReport.activeZones} ACTIVE
              </span>
            </>
          )}
        </div>
      </div>

      {/* Selected Item Detail Drawer (Right side) */}
      {activeItem && (
        <div className="absolute top-3 right-3 bottom-12 w-84 max-w-[calc(100vw-2rem)] z-20 bg-panel border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
          <div className="p-3 border-b border-border bg-panel-card flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary-dim block">
                {activeItem.type.toUpperCase()} DETAIL INSPECTOR
              </span>
              <h4 className="text-xs font-bold text-primary truncate max-w-[200px]">
                {'title' in activeItem.data
                  ? activeItem.data.title
                  : 'name' in activeItem.data
                  ? activeItem.data.name
                  : `${activeItem.data.riverName} (${activeItem.data.locationName})`}
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
              const containedZones = spatialReport?.incidentZoneMap[inc.id] || [];

              return (
                <>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>

                  {containedZones.length > 0 && (
                    <div className="p-2.5 rounded bg-emergency/15 border border-emergency/40 text-emergency">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>ACTIVE GEOFENCE CONTAINMENT</span>
                      </div>
                      <p className="text-[10px] leading-tight text-primary-muted">
                        Incident is inside {containedZones.length} hazard risk zone{containedZones.length > 1 ? 's' : ''}:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {containedZones.map(zid => {
                          const z = geofences.find(g => g.id === zid);
                          return (
                            <span key={zid} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emergency/20 text-emergency font-bold">
                              {z ? z.name : zid}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

            {/* GEOFENCE ZONE DETAILS (Phase 3) */}
            {activeItem.type === 'geofence' && (() => {
              const zone = activeItem.data as GeofenceZone;
              const evalResult = spatialReport?.evaluations.find(e => e.zoneId === zone.id);

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                      zone.severity === 'Critical' 
                        ? 'bg-emergency/20 text-emergency border-emergency/40' 
                        : zone.severity === 'High'
                        ? 'bg-hazard/20 text-hazard border-hazard/40'
                        : 'bg-operational-cyan/20 text-operational-cyan border-operational-cyan/40'
                    }`}>
                      {zone.severity} RISK
                    </span>
                    <span className="text-[10px] font-mono text-primary-dim uppercase">
                      {zone.shapeType} • {zone.status}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">CATEGORY</label>
                    <div className="text-primary font-bold uppercase">{zone.category}</div>
                  </div>

                  {zone.description && (
                    <div>
                      <label className="text-[10px] font-mono text-primary-dim block">PERIMETER BRIEF</label>
                      <p className="text-primary-muted leading-relaxed mt-0.5">{zone.description}</p>
                    </div>
                  )}

                  {/* Containment Counters */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-charcoal rounded border border-border text-center font-mono">
                    <div>
                      <span className="text-[9px] text-primary-dim block">INCIDENTS</span>
                      <span className="text-sm font-extrabold text-emergency">
                        {evalResult?.incidentCount ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-primary-dim block">TEAMS</span>
                      <span className="text-sm font-extrabold text-operational-cyan">
                        {evalResult?.teamCount ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-primary-dim block">SHELTERS</span>
                      <span className="text-sm font-extrabold text-safe">
                        {evalResult?.shelterCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {evalResult && evalResult.containedIncidents.length > 0 && (
                    <div>
                      <label className="text-[10px] font-mono text-primary-dim block mb-1">
                        CONTAINED INCIDENT IDENTIFIERS
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {evalResult.containedIncidents.map(incId => (
                          <span key={incId} className="text-[10px] font-mono px-2 py-0.5 bg-panel-subtle rounded border border-border text-primary">
                            {incId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2 bg-panel-subtle rounded border border-border text-[10px] font-mono text-primary-dim">
                    <span className="block">SHAPE: {zone.shapeType.toUpperCase()}</span>
                    {zone.radiusMeters && <span className="block">RADIUS: {zone.radiusMeters} METERS</span>}
                    <span className="block">POINTS: {zone.coordinates.length} COORDINATES</span>
                  </div>
                </>
              );
            })()}

            {/* RIVER GAUGE DETAILS (Phase 3) */}
            {activeItem.type === 'riverGauge' && (() => {
              const gauge = activeItem.data as RiverGaugeReport;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      {gauge.floodStage.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-primary-dim uppercase">
                      TREND: {gauge.trend}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-primary-dim block">STATION & RIVER</label>
                    <div className="text-primary font-bold">{gauge.riverName}</div>
                    <div className="text-primary-muted text-[11px]">{gauge.locationName} ({gauge.stationId})</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 bg-charcoal rounded border border-border font-mono text-[11px]">
                    <div>
                      <span className="text-primary-dim block">WATER LEVEL:</span>
                      <span className="text-primary font-bold">{gauge.waterLevelMeters} m</span>
                    </div>
                    <div>
                      <span className="text-primary-dim block">DANGER LEVEL:</span>
                      <span className="text-hazard font-bold">{gauge.dangerLevelMeters} m</span>
                    </div>
                    <div>
                      <span className="text-primary-dim block">DISCHARGE:</span>
                      <span className="text-primary font-bold">{gauge.dischargeM3s} m³/s</span>
                    </div>
                    <div>
                      <span className="text-primary-dim block">SOURCE:</span>
                      <span className="text-primary-muted text-[10px]">{gauge.source}</span>
                    </div>
                  </div>
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
              const containedZones = spatialReport?.shelterZoneMap[s.id] || [];

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

                  {containedZones.length > 0 && (
                    <div className="p-2 rounded bg-hazard/15 border border-hazard/40 text-hazard text-[11px]">
                      ⚠️ <strong>GEOFENCE ALERT:</strong> Located inside {containedZones.length} designated risk zone(s).
                    </div>
                  )}

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
