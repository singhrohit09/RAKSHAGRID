/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Shelter, Team } from '../../types';
import { HazardZone, MapLayerState, GeocodeResult } from '../../types/geospatial';
import { RiverGaugeStation } from '../../services/external/hydrologyProvider';
import { SpatialAnalysisService } from '../../services/geospatial/spatialAnalysis.service';
import { InspectorSelection } from './MapInspector';
import { RotateCcw, MapPin, Layers, Crosshair } from 'lucide-react';

// Ensure standard Leaflet marker assets resolve properly in Vite / bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  incidents: Incident[];
  shelters: Shelter[];
  teams: Team[];
  gauges: RiverGaugeStation[];
  hazardZones: HazardZone[];
  layerState: MapLayerState;
  proximityRadiusKm: number;
  tileTheme: 'dark' | 'standard';
  selectedEntity: InspectorSelection;
  onSelectEntity: (selection: InspectorSelection) => void;
  searchedLocation: GeocodeResult | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  incidents,
  shelters,
  teams,
  gauges,
  hazardZones,
  layerState,
  proximityRadiusKm,
  tileTheme,
  selectedEntity,
  onSelectEntity,
  searchedLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Layer groups
  const incidentLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const shelterLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const teamLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const gaugeLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const hazardLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const bufferLayerGroup = useRef<L.LayerGroup>(L.layerGroup());
  const searchLayerGroup = useRef<L.LayerGroup>(L.layerGroup());

  // Mouse coordinate tracker
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Indian Subcontinent disaster operations theater
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 82.0],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add zoom control top right with clean styling
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer selection:
    // OpenStreetMap standard is primary and robust; CartoDB provides dark option
    const standardUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const tileUrl = tileTheme === 'dark' ? darkUrl : standardUrl;
    const attribution =
      tileTheme === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    });

    // Fallback if dark tiles fail to load
    tiles.on('tileerror', () => {
      if (tiles.getContainer()) {
        tiles.setUrl(standardUrl);
      }
    });

    tiles.addTo(map);
    tileLayerRef.current = tiles;

    // Attach layer groups
    incidentLayerGroup.current.addTo(map);
    shelterLayerGroup.current.addTo(map);
    teamLayerGroup.current.addTo(map);
    gaugeLayerGroup.current.addTo(map);
    hazardLayerGroup.current.addTo(map);
    bufferLayerGroup.current.addTo(map);
    searchLayerGroup.current.addTo(map);

    // Mouse move coordinate tracker
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Math.round(e.latlng.lat * 10000) / 10000,
        lng: Math.round(e.latlng.lng * 10000) / 10000,
      });
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Critical Map Visibility Fix: Force size invalidation across rendering phases
    const timeouts = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 250),
      setTimeout(() => map.invalidateSize(), 600),
      setTimeout(() => map.invalidateSize(), 1200),
    ];

    // ResizeObserver ensures map resizes properly when columns or containers flex
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(mapContainerRef.current);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      if (observer) {
        observer.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer theme
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const standardUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const newUrl = tileTheme === 'dark' ? darkUrl : standardUrl;

    const attribution =
      tileTheme === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const newTiles = L.tileLayer(newUrl, {
      attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    });

    newTiles.on('tileerror', () => {
      newTiles.setUrl(standardUrl);
    });

    newTiles.addTo(map);
    tileLayerRef.current = newTiles;
  }, [tileTheme]);

  // Update Incident Markers & Analytical Buffers
  useEffect(() => {
    const layer = incidentLayerGroup.current;
    const bufferLayer = bufferLayerGroup.current;
    layer.clearLayers();
    bufferLayer.clearLayers();

    if (!layerState.incidents) return;

    incidents.forEach((inc) => {
      const { lat, lng } = inc.coordinates || {};
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const isCritical = inc.severity === 'critical';
      const isHigh = inc.severity === 'high';
      const color = isCritical ? '#B9433D' : isHigh ? '#C18A32' : inc.severity === 'medium' ? '#C18A32' : '#315C46';

      // Professional Human-Centered Pin
      const iconHtml = `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isCritical
              ? `<span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
              : ''
          }
          <div style="width: 26px; height: 26px; border-radius: 50%; background: ${color}; border: 2.5px solid #FFFFFF; box-shadow: 0 3px 8px rgba(23, 27, 25, 0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 11px;">
            !
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-incident-pin',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'incident', data: inc });
      });

      marker.bindTooltip(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: 700; color: #171B19;">${inc.title}</div>
          <div style="color: ${color}; font-weight: 600; text-transform: uppercase; font-size: 10px; margin-top: 2px;">
            ${inc.severity} · ${inc.disasterType}
          </div>
          <div style="color: #777D77; font-size: 11px; margin-top: 2px;">${inc.location}</div>
        </div>`,
        { direction: 'top', offset: [0, -14], className: 'rg-custom-tooltip' }
      );

      marker.addTo(layer);

      // Render Analytical Proximity Buffer if enabled and incident is Critical or High
      if (layerState.proximityBuffers && (isCritical || isHigh)) {
        const circleCoords = SpatialAnalysisService.generateProximityCircle(lat, lng, proximityRadiusKm);
        const polygon = L.polygon(circleCoords, {
          color: isCritical ? '#B9433D' : '#C18A32',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: isCritical ? '#B9433D' : '#C18A32',
          fillOpacity: 0.1,
        });

        polygon.bindTooltip(
          `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px;">
            <div style="font-weight: 700; color: #171B19;">Safety Perimeter: ${proximityRadiusKm} km</div>
            <div style="color: #777D77; font-size: 10px;">Incident: ${inc.title}</div>
          </div>`,
          { sticky: true, className: 'rg-custom-tooltip' }
        );

        polygon.addTo(bufferLayer);
      }
    });
  }, [incidents, layerState.incidents, layerState.proximityBuffers, proximityRadiusKm, onSelectEntity]);

  // Update Shelter Markers
  useEffect(() => {
    const layer = shelterLayerGroup.current;
    layer.clearLayers();
    if (!layerState.shelters) return;

    shelters.forEach((shelter) => {
      const { lat, lng } = shelter.coordinates || {};
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      const isFull = shelter.status === 'full';
      const color = isFull ? '#777D77' : '#315C46';

      const iconHtml = `
        <div style="width: 24px; height: 24px; border-radius: 6px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 3px 6px rgba(23, 27, 25, 0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 11px; cursor: pointer;">
          H
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-shelter-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'shelter', data: shelter });
      });

      marker.bindTooltip(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: 700; color: #171B19;">${shelter.name}</div>
          <div style="color: #315C46; font-weight: 600; font-size: 11px;">
            Occupancy: ${shelter.currentOccupancy} / ${shelter.capacity}
          </div>
          <div style="color: #777D77; font-size: 10px;">Supplies: ${shelter.supplyLevel.toUpperCase()}</div>
        </div>`,
        { direction: 'top', offset: [0, -12], className: 'rg-custom-tooltip' }
      );

      marker.addTo(layer);
    });
  }, [shelters, layerState.shelters, onSelectEntity]);

  // Update Response Team Markers
  useEffect(() => {
    const layer = teamLayerGroup.current;
    layer.clearLayers();
    if (!layerState.teams) return;

    teams.forEach((team) => {
      const { lat, lng } = team.location || {};
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      const isAvailable = team.status === 'available';
      const color = isAvailable ? '#315C46' : '#C18A32';

      const iconHtml = `
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 3px 6px rgba(23, 27, 25, 0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 11px; cursor: pointer;">
          T
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-team-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'team', data: team });
      });

      marker.bindTooltip(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: 700; color: #171B19;">${team.name}</div>
          <div style="color: #315C46; font-weight: 600; font-size: 11px;">${team.specialization} (${team.status})</div>
          <div style="color: #777D77; font-size: 10px;">Commander: ${team.leader} (${team.memberCount} Responders)</div>
        </div>`,
        { direction: 'top', offset: [0, -12], className: 'rg-custom-tooltip' }
      );

      marker.addTo(layer);
    });
  }, [teams, layerState.teams, onSelectEntity]);

  // Update Hydrology River Gauge Markers
  useEffect(() => {
    const layer = gaugeLayerGroup.current;
    layer.clearLayers();
    if (!layerState.hydrologyGauges) return;

    gauges.forEach((gauge) => {
      const isAboveDanger = gauge.currentWaterLevelMeters >= gauge.dangerLevelMeters;
      const isAboveWarning = gauge.currentWaterLevelMeters >= gauge.warningLevelMeters;
      const color = isAboveDanger ? '#B9433D' : isAboveWarning ? '#C18A32' : '#315C46';

      const iconHtml = `
        <div style="width: 22px; height: 22px; border-radius: 50%; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 3px 6px rgba(23, 27, 25, 0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 10px; cursor: pointer;">
          ~
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-gauge-pin',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([gauge.latitude, gauge.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'gauge', data: gauge });
      });

      marker.bindTooltip(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: 700; color: #171B19;">${gauge.stationName} (${gauge.riverName})</div>
          <div style="color: ${color}; font-weight: 600; font-size: 11px;">Level: ${gauge.currentWaterLevelMeters}m / Danger: ${gauge.dangerLevelMeters}m</div>
          <div style="color: #777D77; font-size: 10px;">Basin: ${gauge.basin}</div>
        </div>`,
        { direction: 'top', offset: [0, -12], className: 'rg-custom-tooltip' }
      );

      marker.addTo(layer);
    });
  }, [gauges, layerState.hydrologyGauges, onSelectEntity]);

  // Update Verified Hazard Polygons
  useEffect(() => {
    const layer = hazardLayerGroup.current;
    layer.clearLayers();
    if (!layerState.hazardZones) return;

    hazardZones.forEach((zone) => {
      const isCritical = zone.severity === 'critical';
      const color = isCritical ? '#B9433D' : '#C18A32';

      const polygon = L.polygon(zone.coordinates, {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.16,
      });

      polygon.on('click', () => {
        onSelectEntity({ type: 'zone', data: zone });
      });

      polygon.bindTooltip(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: 700; color: #171B19;">${zone.name}</div>
          <div style="color: ${color}; font-weight: 600; text-transform: uppercase; font-size: 10px;">${zone.zoneType.replace(/_/g, ' ')}</div>
          <div style="color: #777D77; font-size: 10px;">Source: ${zone.sourceAttribution}</div>
        </div>`,
        { sticky: true, className: 'rg-custom-tooltip' }
      );

      polygon.addTo(layer);
    });
  }, [hazardZones, layerState.hazardZones, onSelectEntity]);

  // Handle Search Location Pin
  useEffect(() => {
    const layer = searchLayerGroup.current;
    layer.clearLayers();
    if (!searchedLocation || !mapInstanceRef.current) return;

    const { lat, lng } = searchedLocation.coordinates;
    const iconHtml = `
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #C18A32; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 8px rgba(23, 27, 25, 0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">
        ⌖
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'custom-search-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lat, lng], { icon });
    marker.bindTooltip(
      `<div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; color: #171B19;">
        ${searchedLocation.displayName}
      </div>`,
      { permanent: true, direction: 'top', offset: [0, -14], className: 'rg-custom-tooltip' }
    );
    marker.addTo(layer);

    mapInstanceRef.current.flyTo([lat, lng], 10, { animate: true, duration: 1 });
  }, [searchedLocation]);

  // Pan to selected entity
  useEffect(() => {
    if (!selectedEntity || !mapInstanceRef.current) return;

    let coords: [number, number] | null = null;
    if (selectedEntity.type === 'incident') {
      coords = [selectedEntity.data.coordinates.lat, selectedEntity.data.coordinates.lng];
    } else if (selectedEntity.type === 'shelter') {
      coords = [selectedEntity.data.coordinates.lat, selectedEntity.data.coordinates.lng];
    } else if (selectedEntity.type === 'team') {
      coords = [selectedEntity.data.location.lat, selectedEntity.data.location.lng];
    } else if (selectedEntity.type === 'gauge') {
      coords = [selectedEntity.data.latitude, selectedEntity.data.longitude];
    }

    if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
      mapInstanceRef.current.panTo(coords, { animate: true, duration: 0.8 });
    }
  }, [selectedEntity]);

  // Reset View Handler
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.5, 82.0], 5, { animate: true, duration: 1 });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#E4E3DC] bg-white shadow-xs">
      {/* Leaflet Mount Element with explicit inline styling to prevent layout collapse */}
      <div
        ref={mapContainerRef}
        id="rakshagrid-leaflet-container"
        className="w-full z-0"
        style={{ height: '620px', minHeight: '520px', width: '100%', display: 'block' }}
      />

      {/* Recenter Map Button */}
      <div className="absolute top-3.5 left-3.5 z-[400] flex gap-2">
        <button
          type="button"
          onClick={handleResetView}
          className="bg-white/95 hover:bg-white text-[#171B19] hover:text-[#315C46] text-xs font-semibold px-3 py-2 rounded-lg border border-[#E4E3DC] shadow-sm transition flex items-center gap-1.5"
          title="Recenter Map View"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#315C46]" />
          <span>Reset Theater View</span>
        </button>
      </div>

      {/* Coordinate Telemetry Status Bar */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs border border-[#E4E3DC] rounded-lg px-3 py-1.5 text-xs text-[#171B19] flex items-center gap-2.5 shadow-sm pointer-events-none">
        <div className="flex items-center gap-1.5 font-medium">
          <Crosshair className="w-3.5 h-3.5 text-[#315C46]" />
          <span>WGS84 EPSG:3857</span>
        </div>
        <span className="text-[#E4E3DC]">|</span>
        {cursorCoords ? (
          <span className="font-mono text-[#315C46] font-semibold tabular-nums">
            Lat {cursorCoords.lat.toFixed(4)}°N · Lng {cursorCoords.lng.toFixed(4)}°E
          </span>
        ) : (
          <span className="text-[#777D77]">Hover map for GPS fix</span>
        )}
      </div>

      {/* Custom Leaflet Styling */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2.1);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          background: #FFFFFF !important;
          color: #171B19 !important;
          border: 1px solid #E4E3DC !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(23, 27, 25, 0.1), 0 8px 10px -6px rgba(23, 27, 25, 0.05) !important;
        }
        .leaflet-popup-tip {
          background: #FFFFFF !important;
        }
        .rg-custom-tooltip {
          background: #FFFFFF !important;
          color: #171B19 !important;
          border: 1px solid #E4E3DC !important;
          box-shadow: 0 4px 12px rgba(23, 27, 25, 0.08) !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #E4E3DC !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 6px rgba(23, 27, 25, 0.06) !important;
        }
        .leaflet-control-zoom a {
          background-color: #FFFFFF !important;
          color: #171B19 !important;
          border-bottom: 1px solid #E4E3DC !important;
          font-weight: bold !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #F5F4EF !important;
          color: #315C46 !important;
        }
        .leaflet-container {
          background-color: #F5F4EF !important;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
        }
      `}</style>
    </div>
  );
};
