/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  Layers,
  Filter,
  Flame,
  Home,
  Users,
  Waves,
  ShieldAlert,
  Info,
  Radio,
  RefreshCw,
  Search,
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
  const [tileTheme, setTileTheme] = useState<'dark' | 'standard'>('standard');

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
        kicker="Geospatial Situational Grid"
        description="Real-time multi-echelon disaster map integrating OpenStreetMap cartography, Open-Meteo atmospheric telemetry, Copernicus GloFAS river discharge, and Turf.js spatial analysis."
        metadata={
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#777D77]">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'CONNECTED'
                    ? 'bg-[#315C46] animate-pulse'
                    : realtimeStatus === 'RECONNECTING'
                    ? 'bg-[#C18A32] animate-pulse'
                    : 'bg-[#B9433D]'
                }`}
              />
              <span className="text-[#171B19] font-medium">Realtime Mesh: {realtimeStatus}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5 text-[#171B19]">
              <Radio className="w-3.5 h-3.5 text-[#315C46]" />
              <span className="font-medium">GloFAS Flood & River Telemetry: Live</span>
            </div>
            <span>·</span>
            <span className="font-mono text-[11px]">WGS84 EPSG:3857</span>
          </div>
        }
      />

      {/* Top Search & Location Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E4E3DC] shadow-xs">
        <MapSearch
          onSelectLocation={(loc) => {
            setSearchedLocation(loc);
            setMobileTab('map');
          }}
        />

        {/* Mobile Tab Selector */}
        <div className="flex lg:hidden bg-[#F5F4EF] p-1 rounded-lg border border-[#E4E3DC] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-1.5 px-3 rounded-md transition ${
              mobileTab === 'map' ? 'bg-white text-[#171B19] shadow-xs' : 'text-[#777D77]'
            }`}
          >
            Tactical Map
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('inspector')}
            className={`flex-1 py-1.5 px-3 rounded-md transition ${
              mobileTab === 'inspector' ? 'bg-white text-[#171B19] shadow-xs' : 'text-[#777D77]'
            }`}
          >
            Inspector
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('controls')}
            className={`flex-1 py-1.5 px-3 rounded-md transition ${
              mobileTab === 'controls' ? 'bg-white text-[#171B19] shadow-xs' : 'text-[#777D77]'
            }`}
          >
            Layers
          </button>
        </div>

        {/* Quick Map Stat Counters */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-[#777D77]">
          <div>
            <span className="text-[#B9433D] font-bold tabular-nums">{filteredIncidents.length}</span> Incidents
          </div>
          <div>
            <span className="text-[#315C46] font-bold tabular-nums">{shelters.length}</span> Shelters
          </div>
          <div>
            <span className="text-[#315C46] font-bold tabular-nums">{teams.length}</span> Field Teams
          </div>
          <div>
            <span className="text-blue-700 font-bold tabular-nums">{riverGauges.length}</span> River Gauges
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
