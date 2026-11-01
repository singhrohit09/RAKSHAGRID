/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Home,
  Users,
  Waves,
  ShieldAlert,
  MapPin,
  ExternalLink,
  CloudRain,
  Wind,
  Droplets,
  Clock,
  Compass,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Incident, Shelter, Team } from '../../types';
import { HazardZone } from '../../types/geospatial';
import { RiverGaugeStation } from '../../services/external/hydrologyProvider';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useWeather } from '../../hooks/useWeather';
import { useHydrology } from '../../hooks/useHydrology';
import { SpatialAnalysisService } from '../../services/geospatial/spatialAnalysis.service';

export type InspectorSelection =
  | { type: 'incident'; data: Incident }
  | { type: 'shelter'; data: Shelter }
  | { type: 'team'; data: Team }
  | { type: 'gauge'; data: RiverGaugeStation }
  | { type: 'zone'; data: HazardZone }
  | null;

interface MapInspectorProps {
  selection: InspectorSelection;
  onClose: () => void;
  shelters: Shelter[];
  teams: Team[];
  proximityRadiusKm: number;
  onNavigateToIncident: (id: string) => void;
  onNavigateToTeam: (id: string) => void;
}

export const MapInspector: React.FC<MapInspectorProps> = ({
  selection,
  onClose,
  shelters,
  teams,
  proximityRadiusKm,
  onNavigateToIncident,
  onNavigateToTeam,
}) => {
  if (!selection) {
    return (
      <div className="bg-[#11161d] border border-slate-800 rounded-lg p-6 text-center text-slate-400 space-y-3">
        <Compass className="w-8 h-8 text-slate-400 mx-auto" />
        <div className="font-mono text-xs uppercase tracking-wider text-slate-300">
          No GIS Entity Selected
        </div>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Click any incident, shelter, response team, or river gauge marker on the map to inspect live telemetry and tactical proximity.
        </p>
      </div>
    );
  }

  // --- INSPECTOR FOR INCIDENT ---
  if (selection.type === 'incident') {
    const incident = selection.data;
    const { weather, loading: weatherLoading } = useWeather(
      incident.coordinates.lat,
      incident.coordinates.lng,
      incident.location
    );
    const { hydrology, loading: hydroLoading } = useHydrology(
      incident.coordinates.lat,
      incident.coordinates.lng
    );

    const proximity = SpatialAnalysisService.analyzeIncidentProximity(
      incident,
      shelters,
      teams,
      proximityRadiusKm
    );

    return (
      <div className="bg-[#11161d] border border-slate-800 rounded-lg p-4 space-y-4 text-slate-200 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={incident.severity} size="sm" />
              <StatusBadge status={incident.status} size="sm" />
              <span className="font-mono text-[10px] text-slate-400">{incident.id}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100 leading-snug">{incident.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location & Coordinates */}
        <div className="bg-slate-900/80 rounded p-2.5 border border-slate-800 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-medium truncate">{incident.location}</span>
          </div>
          <div className="font-mono text-[10px] text-slate-400 flex items-center justify-between">
            <span>Region: {incident.region}</span>
            <span>
              {incident.coordinates.lat.toFixed(4)}°N, {incident.coordinates.lng.toFixed(4)}°E
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Reported: {new Date(incident.reportedTime).toLocaleTimeString()}</span>
            <span>Affected Pop: {incident.affectedPopulation.toLocaleString()}</span>
          </div>
        </div>

        {/* Real Weather Telemetry (Open-Meteo) */}
        <div className="bg-slate-900/90 rounded p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-sky-400 font-semibold uppercase">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Live Weather Telemetry</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 uppercase">
              {weather?.classification || 'OBSERVATION'}
            </span>
          </div>

          {weatherLoading ? (
            <div className="py-2 text-center text-[11px] font-mono text-slate-400 animate-pulse">
              Querying atmospheric sensor feed...
            </div>
          ) : weather ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/60 p-1.5 rounded">
                  <div className="text-[10px] text-slate-400 font-mono">Temp</div>
                  <div className="text-xs font-bold text-slate-200 tabular-nums">
                    {weather.temperatureC}°C
                  </div>
                </div>
                <div className="bg-slate-800/60 p-1.5 rounded">
                  <div className="text-[10px] text-slate-400 font-mono">Humidity</div>
                  <div className="text-xs font-bold text-slate-200 tabular-nums">
                    {weather.relativeHumidityPercent}%
                  </div>
                </div>
                <div className="bg-slate-800/60 p-1.5 rounded">
                  <div className="text-[10px] text-slate-400 font-mono">Precip</div>
                  <div className="text-xs font-bold text-sky-400 tabular-nums">
                    {weather.precipitationMm} mm
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/40 px-2 py-1 rounded">
                <div className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" />
                  <span>Wind: {weather.windSpeedKmh} km/h ({weather.windDirectionDegrees}°)</span>
                </div>
                <span className="text-amber-400 font-medium truncate max-w-[130px]">
                  {weather.weatherCondition}
                </span>
              </div>

              <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Source: Open-Meteo WMO Model Blend</span>
                <span>Observed: {new Date(weather.observedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Weather data unavailable for this coordinate.</div>
          )}
        </div>

        {/* River Hydrology & Flood Telemetry (GloFAS / Gauge) */}
        <div className="bg-slate-900/90 rounded p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400 font-semibold uppercase">
              <Waves className="w-3.5 h-3.5" />
              <span>Hydrology & River Basin</span>
            </div>
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase ${
                hydrology?.status === 'DANGER'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : hydrology?.status === 'WARNING'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-blue-950 text-blue-300 border-blue-800'
              }`}
            >
              {hydrology?.status || 'NORMAL'}
            </span>
          </div>

          {hydroLoading ? (
            <div className="py-2 text-center text-[11px] font-mono text-slate-400 animate-pulse">
              Calculating GloFAS river discharge grid...
            </div>
          ) : hydrology ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{hydrology.riverName} River</span>
                <span className="font-mono text-[10px] text-slate-400">{hydrology.stationName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="bg-slate-800/60 p-1.5 rounded">
                  <div className="text-[10px] text-slate-400 font-mono">GloFAS Discharge</div>
                  <div className="font-bold text-blue-400 tabular-nums">
                    {hydrology.dischargeCubicMetersPerSec?.toLocaleString()} m³/s
                  </div>
                </div>
                <div className="bg-slate-800/60 p-1.5 rounded">
                  <div className="text-[10px] text-slate-400 font-mono">Gauge / Danger</div>
                  <div className="font-bold text-slate-200 tabular-nums">
                    {hydrology.waterLevelMeters}m / {hydrology.dangerLevelMeters}m
                  </div>
                </div>
              </div>

              <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Classification: {hydrology.classification}</span>
                <span>Basin: {hydrology.provenanceMetadata.basin.split(' ')[0]}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Nearby Safe Evacuation Shelters (Turf Proximity) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Home className="w-3.5 h-3.5" />
              <span>Nearest Evacuation Shelters</span>
            </span>
            <span>Within Buffer</span>
          </div>

          <div className="space-y-1.5">
            {proximity.nearbyShelters.slice(0, 3).map(({ shelter, distanceKm, availableCapacity }) => (
              <div
                key={shelter.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded p-2 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-slate-200 truncate">{shelter.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{distanceKm} km away</span>
                    <span>·</span>
                    <span className="text-emerald-400">{availableCapacity} beds open</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    shelter.status === 'open' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {shelter.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Response Teams (Turf Proximity) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Users className="w-3.5 h-3.5" />
              <span>Available Response Units</span>
            </span>
            <span>Nearest Distance</span>
          </div>

          <div className="space-y-1.5">
            {proximity.nearbyTeams.slice(0, 2).map(({ team, distanceKm, isAvailable }) => (
              <div
                key={team.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded p-2 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-slate-200 truncate">{team.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>{team.specialization}</span>
                    <span>·</span>
                    <span>{distanceKm} km away</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    isAvailable ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {team.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Details Navigation Action */}
        <button
          type="button"
          onClick={() => onNavigateToIncident(incident.id)}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded text-xs transition"
        >
          <span>Open Full Incident Command Console</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // --- INSPECTOR FOR SHELTER ---
  if (selection.type === 'shelter') {
    const shelter = selection.data;
    const occupancyPercent = Math.min(100, Math.round((shelter.currentOccupancy / shelter.capacity) * 100));

    return (
      <div className="bg-[#11161d] border border-slate-800 rounded-lg p-4 space-y-4 text-slate-200">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                Evacuation Shelter
              </span>
              <span className="font-mono text-[10px] text-slate-400">{shelter.id}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{shelter.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 rounded p-3 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">Occupancy Capacity:</span>
            <span className="font-bold text-slate-200">
              {shelter.currentOccupancy} / {shelter.capacity} ({occupancyPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                occupancyPercent > 90 ? 'bg-rose-500' : occupancyPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Available Capacity: {Math.max(0, shelter.capacity - shelter.currentOccupancy)} beds</span>
            <span>Supply: {shelter.supplyLevel.toUpperCase()}</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="text-[11px] font-mono text-slate-400 uppercase">On-site Emergency Facilities</div>
          <div className="flex flex-wrap gap-1">
            {shelter.facilities.map((fac, idx) => (
              <span key={idx} className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">
                {fac}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 rounded p-2.5 border border-slate-800 space-y-1 text-xs">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Shelter Coordination Point</div>
          <div className="font-medium text-slate-200">{shelter.contactPerson}</div>
          <div className="font-mono text-[11px] text-amber-400">{shelter.contactPhone}</div>
          <div className="text-[10px] font-mono text-slate-400">
            Coordinates: {shelter.coordinates.lat.toFixed(4)}°N, {shelter.coordinates.lng.toFixed(4)}°E
          </div>
        </div>
      </div>
    );
  }

  // --- INSPECTOR FOR RESPONSE TEAM ---
  if (selection.type === 'team') {
    const team = selection.data;

    return (
      <div className="bg-[#11161d] border border-slate-800 rounded-lg p-4 space-y-4 text-slate-200">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                {team.specialization}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{team.id}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{team.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 rounded p-3 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Operational Status:</span>
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded font-bold uppercase ${
                team.status === 'available'
                  ? 'bg-emerald-950 text-emerald-300'
                  : team.status === 'deployed'
                  ? 'bg-rose-950 text-rose-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {team.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Assigned Zone:</span>
            <span className="font-semibold text-slate-200">{team.assignedZone}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Team Leader / Headcount:</span>
            <span className="text-slate-200">
              {team.leader} ({team.memberCount} Personnel)
            </span>
          </div>
        </div>

        {/* Location Provenance Notice */}
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400 uppercase font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Location Provenance: Console Check-in</span>
          </div>
          <p className="text-[11px] text-slate-400">
            *Fixed coordinates reflect registered tactical deployment check-in point ({team.location.lat.toFixed(4)}, {team.location.lng.toFixed(4)}). No unauthorized real-time GPS telemetry is active.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTeam(team.id)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded text-xs transition"
        >
          <span>View Team Roster & Equipment</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // --- INSPECTOR FOR RIVER GAUGE ---
  if (selection.type === 'gauge') {
    const gauge = selection.data;
    const isAboveDanger = gauge.currentWaterLevelMeters >= gauge.dangerLevelMeters;
    const isAboveWarning = gauge.currentWaterLevelMeters >= gauge.warningLevelMeters;

    return (
      <div className="bg-[#11161d] border border-slate-800 rounded-lg p-4 space-y-4 text-slate-200">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase ${
                  isAboveDanger
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : isAboveWarning
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {isAboveDanger ? 'DANGER THRESHOLD' : isAboveWarning ? 'WARNING THRESHOLD' : 'NORMAL LEVEL'}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{gauge.id}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{gauge.stationName}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 rounded p-3 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">River Basin:</span>
            <span className="font-bold text-slate-200">{gauge.basin}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
            <div className="bg-slate-800/60 p-1.5 rounded">
              <div className="text-[10px] text-slate-400 font-mono">Current</div>
              <div className="font-bold text-sky-400 tabular-nums">{gauge.currentWaterLevelMeters}m</div>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded">
              <div className="text-[10px] text-slate-400 font-mono">Warning</div>
              <div className="font-bold text-amber-400 tabular-nums">{gauge.warningLevelMeters}m</div>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded">
              <div className="text-[10px] text-slate-400 font-mono">Danger</div>
              <div className="font-bold text-rose-400 tabular-nums">{gauge.dangerLevelMeters}m</div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
            <span>Historical Peak (HFL): {gauge.hflMeters}m</span>
            <span>Coord: {gauge.latitude.toFixed(2)}°N, {gauge.longitude.toFixed(2)}°E</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 leading-tight">
          *Physical gauge level compared with Central Water Commission (CWC) historical benchmark thresholds.
        </div>
      </div>
    );
  }

  // --- INSPECTOR FOR HAZARD ZONE ---
  if (selection.type === 'zone') {
    const zone = selection.data;

    return (
      <div className="bg-[#11161d] border border-slate-800 rounded-lg p-4 space-y-4 text-slate-200">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                {zone.zoneType.replace(/_/g, ' ')}
              </span>
              <SeverityBadge severity={zone.severity === 'advisory' ? 'low' : zone.severity} size="sm" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">{zone.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 rounded p-3 border border-slate-800 space-y-2 text-xs">
          <div className="font-medium text-slate-300">{zone.details}</div>
          <div className="text-[10px] font-mono text-amber-400 pt-1 border-t border-slate-800">
            Source Provenance: {zone.sourceAttribution}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Boundary Classification: {zone.provenance}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
