/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Layers,
  Flame,
  Home,
  Users,
  CloudRain,
  Waves,
  ShieldAlert,
  Compass,
  Sliders,
  Filter,
} from 'lucide-react';
import { MapLayerState } from '../../types/geospatial';
import { SeverityLevel, DisasterType, IncidentStatus } from '../../types';

interface MapControlsProps {
  layerState: MapLayerState;
  onToggleLayer: (layer: keyof MapLayerState) => void;
  selectedSeverity: string;
  onChangeSeverity: (severity: string) => void;
  selectedDisasterType: string;
  onChangeDisasterType: (type: string) => void;
  selectedStatus: string;
  onChangeStatus: (status: string) => void;
  proximityRadiusKm: number;
  onChangeProximityRadius: (radius: number) => void;
  tileTheme: 'dark' | 'standard';
  onChangeTileTheme: (theme: 'dark' | 'standard') => void;
  totalFilteredCount: number;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layerState,
  onToggleLayer,
  selectedSeverity,
  onChangeSeverity,
  selectedDisasterType,
  onChangeDisasterType,
  selectedStatus,
  onChangeStatus,
  proximityRadiusKm,
  onChangeProximityRadius,
  tileTheme,
  onChangeTileTheme,
  totalFilteredCount,
}) => {
  return (
    <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-5 text-[#171B19] shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E4E3DC] pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#171B19] uppercase tracking-wider">
          <Layers className="w-4 h-4 text-[#315C46]" />
          <span>GIS Layers & Filters</span>
        </div>
        <span className="text-xs bg-[#E5EDE6] text-[#315C46] font-semibold px-2.5 py-0.5 rounded-full">
          {totalFilteredCount} Incidents
        </span>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#777D77] uppercase tracking-wider block">
          Operational Layers
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onToggleLayer('incidents')}
            className={`flex items-center gap-2 p-2 rounded-lg border transition text-left font-medium ${
              layerState.incidents
                ? 'bg-[#F9EBEA] border-[#B9433D]/40 text-[#B9433D]'
                : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#B9433D] shrink-0" />
            <span className="truncate">Incidents</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('shelters')}
            className={`flex items-center gap-2 p-2 rounded-lg border transition text-left font-medium ${
              layerState.shelters
                ? 'bg-[#E5EDE6] border-[#315C46]/40 text-[#315C46]'
                : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-[#315C46] shrink-0" />
            <span className="truncate">Shelters</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('teams')}
            className={`flex items-center gap-2 p-2 rounded-lg border transition text-left font-medium ${
              layerState.teams
                ? 'bg-[#E5EDE6] border-[#315C46]/40 text-[#315C46]'
                : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#315C46] shrink-0" />
            <span className="truncate">Field Teams</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('hydrologyGauges')}
            className={`flex items-center gap-2 p-2 rounded-lg border transition text-left font-medium ${
              layerState.hydrologyGauges
                ? 'bg-[#EBF3FC] border-blue-300 text-blue-700'
                : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">River Gauges</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('hazardZones')}
            className={`flex items-center gap-2 p-2 rounded-lg border transition text-left font-medium ${
              layerState.hazardZones
                ? 'bg-[#FAF2E6] border-[#C18A32]/40 text-[#C18A32]'
                : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#C18A32] shrink-0" />
            <span className="truncate">Hazard Zones</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('proximityBuffers')}
            className={`flex items-center gap-2 p-2 rounded-lg border transition text-left font-medium ${
              layerState.proximityBuffers
                ? 'bg-[#FAF2E6] border-[#C18A32]/40 text-[#C18A32]'
                : 'bg-white border-[#E4E3DC] text-[#777D77] hover:bg-[#F5F4EF]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#C18A32] shrink-0" />
            <span className="truncate">Safety Buffers</span>
          </button>
        </div>
      </div>

      {/* Severity Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#777D77] uppercase tracking-wider block">
          Filter by Severity
        </label>
        <select
          value={selectedSeverity}
          onChange={(e) => onChangeSeverity(e.target.value)}
          className="w-full bg-white border border-[#E4E3DC] rounded-lg px-2.5 py-1.5 text-xs text-[#171B19] font-medium focus:outline-none focus:border-[#315C46] transition"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High Hazard</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low / Advisory</option>
        </select>
      </div>

      {/* Disaster Type Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#777D77] uppercase tracking-wider block">
          Hazard Classification
        </label>
        <select
          value={selectedDisasterType}
          onChange={(e) => onChangeDisasterType(e.target.value)}
          className="w-full bg-white border border-[#E4E3DC] rounded-lg px-2.5 py-1.5 text-xs text-[#171B19] font-medium focus:outline-none focus:border-[#315C46] transition"
        >
          <option value="all">All Disaster Types</option>
          <option value="flood">Flood</option>
          <option value="cyclone">Cyclone / Storm</option>
          <option value="earthquake">Earthquake</option>
          <option value="landslide">Landslide</option>
          <option value="wildfire">Wildfire</option>
          <option value="industrial">Industrial / HazMat</option>
        </select>
      </div>

      {/* Analytical Proximity Range Slider */}
      <div className="space-y-2 pt-1 border-t border-[#E4E3DC]">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#777D77]">Proximity Perimeter</span>
          <span className="text-[#315C46] font-mono tabular-nums">{proximityRadiusKm} km</span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={proximityRadiusKm}
          onChange={(e) => onChangeProximityRadius(Number(e.target.value))}
          className="w-full h-1.5 bg-[#E4E3DC] rounded-lg appearance-none cursor-pointer accent-[#315C46]"
        />
        <div className="flex justify-between text-[10px] text-[#777D77] font-mono">
          <span>5 km</span>
          <span>50 km</span>
          <span>100 km</span>
        </div>
      </div>

      {/* Tile Theme Switcher */}
      <div className="pt-2 border-t border-[#E4E3DC] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#777D77]">Cartography Theme</span>
        <div className="flex gap-1 bg-[#F5F4EF] p-0.5 rounded-lg border border-[#E4E3DC]">
          <button
            type="button"
            onClick={() => onChangeTileTheme('standard')}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
              tileTheme === 'standard'
                ? 'bg-white text-[#171B19] shadow-xs'
                : 'text-[#777D77] hover:text-[#171B19]'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => onChangeTileTheme('dark')}
            className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
              tileTheme === 'dark'
                ? 'bg-white text-[#171B19] shadow-xs'
                : 'text-[#777D77] hover:text-[#171B19]'
            }`}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};
