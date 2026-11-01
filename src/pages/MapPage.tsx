/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Crosshair,
  AlertTriangle,
  Home,
  Users,
  Compass,
  Maximize2,
  ChevronRight,
  ExternalLink,
  Wifi,
  WifiOff,
  Radio,
  Clock,
  Filter,
} from 'lucide-react';
import { Incident, Shelter, Team } from '../types';
import { MapLayerState, GeocodeResult } from '../types/geospatial';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { MapControls } from '../components/map/MapControls';
import { MapLegend } from '../components/map/MapLegend';
import { MapSearch } from '../components/map/MapSearch';
import { MapInspector, InspectorSelection } from '../components/map/MapInspector';
import { HydrologyProvider } from '../services/external/hydrologyProvider';
import { SpatialAnalysisService } from '../services/geospatial/spatialAnalysis.service';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';

interface MapPageProps {
  incidents: Incident[];
  shelters: Shelter[];
  teams: Team[];
  onNavigateToIncident: (id: string) => void;
  onNavigateToTeam: (id: string) => void;
}

export const MapPage: React.FC<MapPageProps> = ({
  incidents,
  shelters,
  teams,
  onNavigateToIncident,
  onNavigateToTeam,
}) => {
  // Realtime update subscription
  const { status: realtimeStatus } = useRealtimeUpdates();

  // Layer toggles state
  const [layerState, setLayerState] = useState<MapLayerState>({
    incidents: true,
    shelters: true,
    teams: true,
    hazardZones: true,
    proximityBuffers: true,
    weatherOverlay: true,
    hydrologyGauges: true,
  });

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedDisasterType, setSelectedDisasterType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [proximityRadiusKm, setProximityRadiusKm] = useState(25);
  const [tileTheme, setTileTheme] = useState<'dark' | 'standard'>('dark');

  // Selected GIS Entity
  const [selectedEntity, setSelectedEntity] = useState<InspectorSelection>(() => {
    return incidents[0] ? { type: 'incident', data: incidents[0] } : null;
  });

  // Searched location state
  const [searchedLocation, setSearchedLocation] = useState<GeocodeResult | null>(null);

  // Mobile drawer tab selection
  const [mobileTab, setMobileTab] = useState<'map' | 'inspector' | 'controls'>('map');

  const toggleLayer = (layerKey: keyof MapLayerState) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
      if (selectedDisasterType !== 'all' && inc.disasterType !== selectedDisasterType) return false;
      if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;
      return true;
    });
  }, [incidents, selectedSeverity, selectedDisasterType, selectedStatus]);

  // Verified Data Sources
  const riverGauges = useMemo(() => HydrologyProvider.getAllGaugeStations(), []);
  const hazardZones = useMemo(() => SpatialAnalysisService.getVerifiedHazardZones(), []);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <ResponsivePageHeader
        title="Live Geospatial Intelligence & GIS Monitoring"
        kicker="Situational Grid · Phase 3 Operational Architecture"
        description="Real-time multi-echelon disaster map integrating OpenStreetMap cartography, Open-Meteo atmospheric telemetry, Copernicus GloFAS river discharge, and Turf.js spatial analysis."
        metadata={
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'CONNECTED'
                    ? 'bg-emerald-500 animate-pulse'
                    : realtimeStatus === 'RECONNECTING'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300">Realtime Mesh: {realtimeStatus}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Radio className="w-3 h-3 text-sky-400" />
              <span>GloFAS Flood & River Telemetry: Live</span>
            </div>
            <span>·</span>
            <span>Projection: WGS84 EPSG:3857</span>
          </div>
        }
      />

      {/* Top Search & Location Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#11161d] p-3 rounded-lg border border-slate-800">
        <MapSearch
          onSelectLocation={(loc) => {
            setSearchedLocation(loc);
            setMobileTab('map');
          }}
        />

        {/* Mobile Tab Selector */}
        <div className="flex lg:hidden bg-slate-900 p-1 rounded border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-1.5 px-3 rounded transition ${
              mobileTab === 'map' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Tactical Map
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('inspector')}
            className={`flex-1 py-1.5 px-3 rounded transition ${
              mobileTab === 'inspector' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Inspector
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('controls')}
            className={`flex-1 py-1.5 px-3 rounded transition ${
              mobileTab === 'controls' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Layers
          </button>
        </div>

        {/* Quick Map Stat Counters */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            <span className="text-rose-400 font-bold tabular-nums">{filteredIncidents.length}</span> Incidents
          </div>
          <div>
            <span className="text-emerald-400 font-bold tabular-nums">{shelters.length}</span> Shelters
          </div>
          <div>
            <span className="text-cyan-400 font-bold tabular-nums">{teams.length}</span> Teams
          </div>
          <div>
            <span className="text-blue-400 font-bold tabular-nums">{riverGauges.length}</span> River Gauges
          </div>
        </div>
      </div>

      {/* Main Grid: Controls (Left) | Interactive Map (Center) | Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Layers, Controls & Legend */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileTab === 'controls' ? 'block' : 'hidden lg:block'
          }`}
        >
          <MapControls
            layerState={layerState}
            onToggleLayer={toggleLayer}
            selectedSeverity={selectedSeverity}
            onChangeSeverity={setSelectedSeverity}
            selectedDisasterType={selectedDisasterType}
            onChangeDisasterType={setSelectedDisasterType}
            selectedStatus={selectedStatus}
            onChangeStatus={setSelectedStatus}
            proximityRadiusKm={proximityRadiusKm}
            onChangeProximityRadius={setProximityRadiusKm}
            tileTheme={tileTheme}
            onChangeTileTheme={setTileTheme}
            totalFilteredCount={filteredIncidents.length}
          />

          <MapLegend />
        </div>

        {/* Center Column: Live Interactive GIS Map */}
        <div
          className={`lg:col-span-5 ${
            mobileTab === 'map' ? 'block' : 'hidden lg:block'
          }`}
        >
          <InteractiveMap
            incidents={filteredIncidents}
            shelters={shelters}
            teams={teams}
            gauges={riverGauges}
            hazardZones={hazardZones}
            layerState={layerState}
            proximityRadiusKm={proximityRadiusKm}
            tileTheme={tileTheme}
            selectedEntity={selectedEntity}
            onSelectEntity={(sel) => {
              setSelectedEntity(sel);
              // On mobile, automatically show inspector
              if (window.innerWidth < 1024) {
                setMobileTab('inspector');
              }
            }}
            searchedLocation={searchedLocation}
          />
        </div>

        {/* Right Column: Selected Entity Inspector, Telemetry & Turf Proximity */}
        <div
          className={`lg:col-span-4 ${
            mobileTab === 'inspector' ? 'block' : 'hidden lg:block'
          }`}
        >
          <MapInspector
            selection={selectedEntity}
            onClose={() => setSelectedEntity(null)}
            shelters={shelters}
            teams={teams}
            proximityRadiusKm={proximityRadiusKm}
            onNavigateToIncident={onNavigateToIncident}
            onNavigateToTeam={onNavigateToTeam}
          />
        </div>
      </div>
    </div>
  );
};
