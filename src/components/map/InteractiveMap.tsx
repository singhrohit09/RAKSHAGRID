/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident, Shelter, Team } from '../../types';
import { HazardZone, MapLayerState, GeocodeResult } from '../../types/geospatial';
import { RiverGaugeStation } from '../../services/external/hydrologyProvider';
import { SpatialAnalysisService } from '../../services/geospatial/spatialAnalysis.service';
import { InspectorSelection } from './MapInspector';

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
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Indian Subcontinent disaster operations theater
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 82.0],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer (CartoDB Dark Matter default)
    const initialTileUrl =
      tileTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      tileTheme === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(initialTileUrl, {
      attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer theme
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const newUrl =
      tileTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      tileTheme === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const newTiles = L.tileLayer(newUrl, {
      attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);
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
      // Validate coordinates
      const { lat, lng } = inc.coordinates || {};
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const isCritical = inc.severity === 'critical';
      const isHigh = inc.severity === 'high';
      const color = isCritical ? '#dc2626' : isHigh ? '#ea580c' : inc.severity === 'medium' ? '#d97706' : '#2563eb';

      // Custom HTML Marker Icon
      const iconHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isCritical
              ? `<span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
              : ''
          }
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
            !
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-incident-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'incident', data: inc });
      });

      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${inc.title}</b><br/>
          <span style="color: ${color}; text-transform: uppercase;">${inc.severity} · ${inc.disasterType}</span><br/>
          <span>${inc.location}</span>
        </div>`,
        { direction: 'top', offset: [0, -12] }
      );

      marker.addTo(layer);

      // Render Analytical Proximity Buffer if enabled and incident is Critical or High
      if (layerState.proximityBuffers && (isCritical || isHigh)) {
        const circleCoords = SpatialAnalysisService.generateProximityCircle(lat, lng, proximityRadiusKm);
        const polygon = L.polygon(circleCoords, {
          color: isCritical ? '#dc2626' : '#ea580c',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: isCritical ? '#dc2626' : '#ea580c',
          fillOpacity: 0.08,
        });

        polygon.bindTooltip(
          `<div style="font-family: monospace; font-size: 10px;">
            <b>ANALYTICAL PROXIMITY BUFFER (${proximityRadiusKm}km)</b><br/>
            <span>Incident: ${inc.id}</span>
          </div>`,
          { sticky: true }
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
      const color = isFull ? '#64748b' : '#059669';

      const iconHtml = `
        <div style="width: 22px; height: 22px; border-radius: 4px; background: ${color}; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; cursor: pointer;">
          H
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-shelter-pin',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'shelter', data: shelter });
      });

      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${shelter.name}</b><br/>
          <span style="color: #10b981;">Shelter: ${shelter.currentOccupancy}/${shelter.capacity} Beds</span><br/>
          <span>Supply: ${shelter.supplyLevel.toUpperCase()}</span>
        </div>`,
        { direction: 'top', offset: [0, -10] }
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
      const color = isAvailable ? '#0891b2' : '#be123c';

      const iconHtml = `
        <div style="width: 22px; height: 22px; border-radius: 50%; background: ${color}; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; cursor: pointer;">
          T
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-team-pin',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'team', data: team });
      });

      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${team.name}</b><br/>
          <span style="color: #06b6d4;">${team.specialization} (${team.status})</span><br/>
          <span>Leader: ${team.leader} (${team.memberCount} Responders)</span>
        </div>`,
        { direction: 'top', offset: [0, -10] }
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
      const color = isAboveDanger ? '#dc2626' : isAboveWarning ? '#d97706' : '#2563eb';

      const iconHtml = `
        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${color}; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 9px; cursor: pointer;">
          ~
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-gauge-pin',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([gauge.latitude, gauge.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectEntity({ type: 'gauge', data: gauge });
      });

      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${gauge.stationName} (${gauge.riverName})</b><br/>
          <span style="color: ${color};">Level: ${gauge.currentWaterLevelMeters}m / Danger: ${gauge.dangerLevelMeters}m</span><br/>
          <span>Basin: ${gauge.basin}</span>
        </div>`,
        { direction: 'top', offset: [0, -10] }
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
      const color = isCritical ? '#b91c1c' : '#d97706';

      const polygon = L.polygon(zone.coordinates, {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.18,
      });

      polygon.on('click', () => {
        onSelectEntity({ type: 'zone', data: zone });
      });

      polygon.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${zone.name}</b><br/>
          <span style="color: ${color};">${zone.zoneType.replace(/_/g, ' ')}</span><br/>
          <span>Source: ${zone.sourceAttribution}</span>
        </div>`,
        { sticky: true }
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
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #f59e0b; border: 2px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: black; font-weight: bold; font-size: 12px;">
        ⌖
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'custom-search-pin',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const marker = L.marker([lat, lng], { icon });
    marker.bindTooltip(
      `<div style="font-family: monospace; font-size: 11px;"><b>${searchedLocation.displayName}</b></div>`,
      { permanent: true, direction: 'top', offset: [0, -12] }
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
    <div className="relative w-full h-[620px] rounded-lg overflow-hidden border border-slate-800 bg-[#0d1117]">
      {/* Leaflet Mount Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Reset Map Center Overlay Button */}
      <div className="absolute top-3 left-3 z-[400] flex gap-2">
        <button
          type="button"
          onClick={handleResetView}
          className="bg-[#12171e]/90 hover:bg-[#1a212b] backdrop-blur text-slate-300 hover:text-amber-400 font-mono text-xs px-2.5 py-1.5 rounded border border-slate-700 shadow-md transition flex items-center gap-1.5"
        >
          <span>Recenter Theater (India)</span>
        </button>
      </div>

      {/* Coordinate Telemetry Status Bar */}
      <div className="absolute bottom-2 left-2 z-[400] bg-[#10151d]/90 backdrop-blur border border-slate-700/80 rounded px-2.5 py-1 text-[10px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
        <span>Projection: WGS84 Mercator</span>
        <span>·</span>
        {cursorCoords ? (
          <span className="text-amber-400 tabular-nums">
            Lat: {cursorCoords.lat.toFixed(4)}°N, Lng: {cursorCoords.lng.toFixed(4)}°E
          </span>
        ) : (
          <span className="text-slate-400">Hover over map for GPS fix</span>
        )}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          background: #11161d !important;
          color: #e2e8f0 !important;
          border: 1px solid #334155 !important;
          border-radius: 6px !important;
        }
        .leaflet-popup-tip {
          background: #11161d !important;
        }
        .leaflet-tooltip {
          background: #0f141c !important;
          color: #f1f5f9 !important;
          border: 1px solid #334155 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
          border-radius: 4px !important;
        }
        .leaflet-container {
          background-color: #0b0f17 !important;
        }
      `}</style>
    </div>
  );
};
