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
    <div className="bg-[#11161d] border border-slate-800 rounded-lg p-4 space-y-5 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-mono text-xs text-amber-400 font-semibold uppercase tracking-wider">
          <Layers className="w-4 h-4 text-amber-500" />
          <span>GIS Layers & Filters</span>
        </div>
        <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
          {totalFilteredCount} Incidents Active
        </span>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
          Operational GIS Layers
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onToggleLayer('incidents')}
            className={`flex items-center gap-2 p-2 rounded border transition text-left ${
              layerState.incidents
                ? 'bg-rose-950/40 border-rose-600/60 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Incidents</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('shelters')}
            className={`flex items-center gap-2 p-2 rounded border transition text-left ${
              layerState.shelters
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Shelters</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('teams')}
            className={`flex items-center gap-2 p-2 rounded border transition text-left ${
              layerState.teams
                ? 'bg-cyan-950/40 border-cyan-600/60 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="truncate">Response Units</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('hydrologyGauges')}
            className={`flex items-center gap-2 p-2 rounded border transition text-left ${
              layerState.hydrologyGauges
                ? 'bg-blue-950/40 border-blue-600/60 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">River Gauges</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('hazardZones')}
            className={`flex items-center gap-2 p-2 rounded border transition text-left ${
              layerState.hazardZones
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Hazard Polygons</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('proximityBuffers')}
            className={`flex items-center gap-2 p-2 rounded border transition text-left ${
              layerState.proximityBuffers
                ? 'bg-purple-950/40 border-purple-600/60 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Buffer ({proximityRadiusKm}km)</span>
          </button>
        </div>
      </div>

      {/* Proximity Buffer Distance Slider */}
      {layerState.proximityBuffers && (
        <div className="bg-slate-900/80 p-3 rounded border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 text-[11px] uppercase">
              Proximity Analysis Radius
            </span>
            <span className="font-mono text-purple-400 font-semibold">{proximityRadiusKm} km</span>
          </div>
          <input
            type="range"
            min={5}
            max={75}
            step={5}
            value={proximityRadiusKm}
            onChange={(e) => onChangeProximityRadius(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <p className="text-[10px] text-slate-400 leading-tight">
            *Analytical radius around critical/high threat points. Not an empirical inundation boundary.
          </p>
        </div>
      )}

      {/* Incident Severity Filter */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
          Incident Severity Filter
        </label>
        <select
          value={selectedSeverity}
          onChange={(e) => onChangeSeverity(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Threat Severities</option>
          <option value="critical">Critical (Catastrophic / Immediate)</option>
          <option value="high">High (Major Threat to Life)</option>
          <option value="medium">Medium (Moderate Hazard)</option>
          <option value="low">Low (Localized / Advisory)</option>
        </select>
      </div>

      {/* Disaster Hazard Type Filter */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
          Disaster Hazard Type
        </label>
        <select
          value={selectedDisasterType}
          onChange={(e) => onChangeDisasterType(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Hazard Classifications</option>
          <option value="flood">Flood & Hydrological Inundation</option>
          <option value="cyclone">Cyclone & Severe Storm Surge</option>
          <option value="landslide">Landslide & Slope Debris Flow</option>
          <option value="earthquake">Earthquake & Structural Seismic</option>
          <option value="wildfire">Wildfire & Forest Conflagration</option>
          <option value="industrial">Industrial & HazMat Contamination</option>
          <option value="tsunami">Tsunami & Ocean Surge</option>
        </select>
      </div>

      {/* Incident Status Filter */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
          Operational Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => onChangeStatus(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Lifecycle States</option>
          <option value="active">Active Triage / Immediate Response</option>
          <option value="investigating">Investigating / Reconnaissance</option>
          <option value="contained">Contained / Evacuated</option>
          <option value="resolved">Resolved / Demobilized</option>
        </select>
      </div>

      {/* Map Tile Theme Selection */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="font-mono text-slate-400 text-[11px]">Map Tile Base</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChangeTileTheme('dark')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition ${
              tileTheme === 'dark'
                ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            Tactical Dark
          </button>
          <button
            type="button"
            onClick={() => onChangeTileTheme('standard')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition ${
              tileTheme === 'standard'
                ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            OSM Standard
          </button>
        </div>
      </div>
    </div>
  );
};
