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
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-6 text-center text-[#777D77] space-y-3 shadow-xs">
        <Compass className="w-8 h-8 text-[#315C46] mx-auto" />
        <div className="text-xs font-bold uppercase tracking-wider text-[#171B19]">
          No GIS Entity Selected
        </div>
        <p className="text-xs text-[#777D77] max-w-xs mx-auto">
          Click any incident, shelter, response team, or river gauge marker on the map to inspect live telemetry and proximity analysis.
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
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-4 text-[#171B19] max-h-[85vh] overflow-y-auto shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[#E4E3DC] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={incident.severity} size="sm" />
              <StatusBadge status={incident.status} size="sm" />
              <span className="font-mono text-[10px] text-[#777D77]">{incident.id}</span>
            </div>
            <h3 className="font-bold text-sm text-[#171B19] leading-snug">{incident.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777D77] hover:text-[#171B19] p-1 rounded-lg hover:bg-[#F5F4EF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location & Coordinates */}
        <div className="bg-[#F5F4EF] rounded-lg p-3 border border-[#E4E3DC] space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-[#171B19]">
            <MapPin className="w-3.5 h-3.5 text-[#315C46] shrink-0" />
            <span className="font-semibold truncate">{incident.location}</span>
          </div>
          <div className="text-[11px] text-[#777D77] flex items-center justify-between">
            <span>Region: {incident.region}</span>
            <span className="font-mono">
              {incident.coordinates.lat.toFixed(4)}°N, {incident.coordinates.lng.toFixed(4)}°E
            </span>
          </div>
          <div className="text-[11px] text-[#777D77] flex items-center justify-between pt-1 border-t border-[#E4E3DC]">
            <span>Reported: {new Date(incident.reportedTime).toLocaleTimeString()}</span>
            <span>Affected: {incident.affectedPopulation.toLocaleString()} people</span>
          </div>
        </div>

        {/* Real Weather Telemetry */}
        <div className="bg-white rounded-lg p-3 border border-[#E4E3DC] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#171B19] font-bold uppercase">
              <CloudRain className="w-3.5 h-3.5 text-[#315C46]" />
              <span>Live Atmospheric Telemetry</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5EDE6] text-[#315C46] font-semibold uppercase">
              {weather?.classification || 'OBSERVATION'}
            </span>
          </div>

          {weatherLoading ? (
            <div className="py-2 text-center text-xs text-[#777D77] animate-pulse">
              Querying atmospheric sensor feed...
            </div>
          ) : weather ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#F5F4EF] p-2 rounded-lg border border-[#E4E3DC]">
                  <div className="text-[10px] text-[#777D77] uppercase font-semibold">Temp</div>
                  <div className="text-xs font-bold text-[#171B19] tabular-nums">
                    {weather.temperatureC}°C
                  </div>
                </div>
                <div className="bg-[#F5F4EF] p-2 rounded-lg border border-[#E4E3DC]">
                  <div className="text-[10px] text-[#777D77] uppercase font-semibold">Humidity</div>
                  <div className="text-xs font-bold text-[#171B19] tabular-nums">
                    {weather.relativeHumidityPercent}%
                  </div>
                </div>
                <div className="bg-[#F5F4EF] p-2 rounded-lg border border-[#E4E3DC]">
                  <div className="text-[10px] text-[#777D77] uppercase font-semibold">Precip</div>
                  <div className="text-xs font-bold text-[#315C46] tabular-nums">
                    {weather.precipitationMm} mm
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#171B19] bg-[#F5F4EF] px-2.5 py-1.5 rounded-lg border border-[#E4E3DC]">
                <div className="flex items-center gap-1.5 text-[#777D77]">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind: {weather.windSpeedKmh} km/h ({weather.windDirectionDegrees}°)</span>
                </div>
                <span className="text-[#315C46] font-semibold truncate max-w-[130px]">
                  {weather.weatherCondition}
                </span>
              </div>

              <div className="text-[10px] text-[#777D77] flex items-center justify-between pt-1 border-t border-[#E4E3DC]">
                <span>Source: Open-Meteo Model Blend</span>
                <span>Observed: {new Date(weather.observedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#777D77]">Weather telemetry unavailable for this area.</div>
          )}
        </div>

        {/* River Hydrology & Flood Telemetry */}
        <div className="bg-white rounded-lg p-3 border border-[#E4E3DC] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#171B19] font-bold uppercase">
              <Waves className="w-3.5 h-3.5 text-blue-600" />
              <span>Hydrology & River Basin</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                hydrology?.status === 'DANGER'
                  ? 'bg-[#F9EBEA] text-[#B9433D]'
                  : hydrology?.status === 'WARNING'
                  ? 'bg-[#FAF2E6] text-[#C18A32]'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {hydrology?.status || 'NORMAL'}
            </span>
          </div>

          {hydroLoading ? (
            <div className="py-2 text-center text-xs text-[#777D77] animate-pulse">
              Calculating GloFAS river discharge grid...
            </div>
          ) : hydrology ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#171B19]">{hydrology.riverName} River</span>
                <span className="text-[#777D77]">{hydrology.stationName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#F5F4EF] p-2 rounded-lg border border-[#E4E3DC]">
                  <div className="text-[10px] text-[#777D77] uppercase font-semibold">GloFAS Discharge</div>
                  <div className="font-bold text-blue-700 tabular-nums text-xs">
                    {hydrology.dischargeCubicMetersPerSec?.toLocaleString()} m³/s
                  </div>
                </div>
                <div className="bg-[#F5F4EF] p-2 rounded-lg border border-[#E4E3DC]">
                  <div className="text-[10px] text-[#777D77] uppercase font-semibold">Water Level / Danger</div>
                  <div className="font-bold text-[#171B19] tabular-nums text-xs">
                    {hydrology.waterLevelMeters}m / {hydrology.dangerLevelMeters}m
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[#777D77] flex items-center justify-between pt-1 border-t border-[#E4E3DC]">
                <span>Classification: {hydrology.classification}</span>
                <span>Basin: {hydrology.provenanceMetadata.basin.split(' ')[0]}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Nearby Safe Evacuation Shelters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#777D77] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#315C46]">
              <Home className="w-3.5 h-3.5" />
              <span>Nearest Shelters</span>
            </span>
            <span>Within Buffer</span>
          </div>

          <div className="space-y-1.5">
            {proximity.nearbyShelters.slice(0, 3).map(({ shelter, distanceKm, availableCapacity }) => (
              <div
                key={shelter.id}
                className="bg-[#F5F4EF] border border-[#E4E3DC] rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-[#171B19] truncate">{shelter.name}</div>
                  <div className="text-[11px] text-[#777D77] flex items-center gap-2">
                    <span>{distanceKm} km away</span>
                    <span>·</span>
                    <span className="text-[#315C46] font-medium">{availableCapacity} beds available</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    shelter.status === 'open' ? 'bg-[#E5EDE6] text-[#315C46]' : 'bg-[#E4E3DC] text-[#777D77]'
                  }`}
                >
                  {shelter.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Response Teams */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#777D77] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#315C46]">
              <Users className="w-3.5 h-3.5" />
              <span>Available Response Units</span>
            </span>
            <span>Distance</span>
          </div>

          <div className="space-y-1.5">
            {proximity.nearbyTeams.slice(0, 2).map(({ team, distanceKm, isAvailable }) => (
              <div
                key={team.id}
                className="bg-[#F5F4EF] border border-[#E4E3DC] rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-[#171B19] truncate">{team.name}</div>
                  <div className="text-[11px] text-[#777D77] flex items-center gap-2">
                    <span>{team.specialization}</span>
                    <span>·</span>
                    <span>{distanceKm} km away</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    isAvailable ? 'bg-[#E5EDE6] text-[#315C46]' : 'bg-[#FAF2E6] text-[#C18A32]'
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
          className="w-full flex items-center justify-center gap-2 bg-[#315C46] hover:bg-[#254836] text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition shadow-xs"
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
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-4 text-[#171B19] shadow-xs">
        <div className="flex items-start justify-between border-b border-[#E4E3DC] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5EDE6] text-[#315C46] uppercase">
                Evacuation Shelter
              </span>
              <span className="font-mono text-[10px] text-[#777D77]">{shelter.id}</span>
            </div>
            <h3 className="font-bold text-sm text-[#171B19]">{shelter.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#777D77] hover:text-[#171B19] p-1 rounded-lg hover:bg-[#F5F4EF]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#F5F4EF] rounded-lg p-3 border border-[#E4E3DC] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#777D77]">Occupancy Capacity:</span>
            <span className="font-bold text-[#171B19]">
              {shelter.currentOccupancy} / {shelter.capacity} ({occupancyPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#E4E3DC] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                occupancyPercent > 90 ? 'bg-[#B9433D]' : occupancyPercent > 70 ? 'bg-[#C18A32]' : 'bg-[#315C46]'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#777D77] pt-1">
            <span>Available: {Math.max(0, shelter.capacity - shelter.currentOccupancy)} beds</span>
            <span>Supply: {shelter.supplyLevel.toUpperCase()}</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="text-[11px] font-semibold text-[#777D77] uppercase">On-site Emergency Facilities</div>
          <div className="flex flex-wrap gap-1.5">
            {shelter.facilities.map((fac, idx) => (
              <span key={idx} className="bg-[#F5F4EF] px-2.5 py-1 rounded-md text-[11px] font-medium text-[#171B19] border border-[#E4E3DC]">
                {fac}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#F5F4EF] rounded-lg p-3 border border-[#E4E3DC] space-y-1 text-xs">
          <div className="text-[10px] font-semibold text-[#777D77] uppercase">Shelter Coordination Point</div>
          <div className="font-semibold text-[#171B19]">{shelter.contactPerson}</div>
          <div className="font-mono text-xs text-[#315C46] font-medium">{shelter.contactPhone}</div>
          <div className="text-[10px] text-[#777D77] font-mono">
            {shelter.coordinates.lat.toFixed(4)}°N, {shelter.coordinates.lng.toFixed(4)}°E
          </div>
        </div>
      </div>
    );
  }

  // --- INSPECTOR FOR RESPONSE TEAM ---
  if (selection.type === 'team') {
    const team = selection.data;

    return (
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-4 text-[#171B19] shadow-xs">
        <div className="flex items-start justify-between border-b border-[#E4E3DC] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5EDE6] text-[#315C46] uppercase">
                {team.specialization}
              </span>
              <span className="font-mono text-[10px] text-[#777D77]">{team.id}</span>
            </div>
            <h3 className="font-bold text-sm text-[#171B19]">{team.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#777D77] hover:text-[#171B19] p-1 rounded-lg hover:bg-[#F5F4EF]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#F5F4EF] rounded-lg p-3 border border-[#E4E3DC] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#777D77]">Operational Status:</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                team.status === 'available'
                  ? 'bg-[#E5EDE6] text-[#315C46]'
                  : team.status === 'deployed'
                  ? 'bg-[#F9EBEA] text-[#B9433D]'
                  : 'bg-[#E4E3DC] text-[#777D77]'
              }`}
            >
              {team.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777D77]">Assigned Zone:</span>
            <span className="font-semibold text-[#171B19]">{team.assignedZone}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#777D77]">Unit Leader:</span>
            <span className="text-[#171B19] font-medium">
              {team.leader} ({team.memberCount} Responders)
            </span>
          </div>
        </div>

        <div className="bg-[#FAF2E6] p-3 rounded-lg border border-[#C18A32]/30 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#C18A32] font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Check-in Provenance</span>
          </div>
          <p className="text-[11px] text-[#777D77] leading-relaxed">
            Fixed coordinates reflect verified tactical deployment check-in point ({team.location.lat.toFixed(4)}, {team.location.lng.toFixed(4)}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTeam(team.id)}
          className="w-full flex items-center justify-center gap-2 bg-[#315C46] hover:bg-[#254836] text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition shadow-xs"
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
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-4 text-[#171B19] shadow-xs">
        <div className="flex items-start justify-between border-b border-[#E4E3DC] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                  isAboveDanger
                    ? 'bg-[#F9EBEA] text-[#B9433D]'
                    : isAboveWarning
                    ? 'bg-[#FAF2E6] text-[#C18A32]'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {isAboveDanger ? 'DANGER THRESHOLD' : isAboveWarning ? 'WARNING THRESHOLD' : 'NORMAL LEVEL'}
              </span>
              <span className="font-mono text-[10px] text-[#777D77]">{gauge.id}</span>
            </div>
            <h3 className="font-bold text-sm text-[#171B19]">{gauge.stationName}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#777D77] hover:text-[#171B19] p-1 rounded-lg hover:bg-[#F5F4EF]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#F5F4EF] rounded-lg p-3 border border-[#E4E3DC] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#777D77]">River Basin:</span>
            <span className="font-bold text-[#171B19]">{gauge.basin}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-white p-2 rounded-lg border border-[#E4E3DC]">
              <div className="text-[10px] text-[#777D77] uppercase font-semibold">Current</div>
              <div className="font-bold text-blue-700 tabular-nums">{gauge.currentWaterLevelMeters}m</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E4E3DC]">
              <div className="text-[10px] text-[#777D77] uppercase font-semibold">Warning</div>
              <div className="font-bold text-[#C18A32] tabular-nums">{gauge.warningLevelMeters}m</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E4E3DC]">
              <div className="text-[10px] text-[#777D77] uppercase font-semibold">Danger</div>
              <div className="font-bold text-[#B9433D] tabular-nums">{gauge.dangerLevelMeters}m</div>
            </div>
          </div>
          <div className="text-[10px] text-[#777D77] pt-1.5 border-t border-[#E4E3DC] flex justify-between">
            <span>Historical Peak (HFL): {gauge.hflMeters}m</span>
            <span>Coord: {gauge.latitude.toFixed(2)}°N, {gauge.longitude.toFixed(2)}°E</span>
          </div>
        </div>

        <div className="text-[10px] text-[#777D77] leading-tight">
          Physical gauge telemetry verified with Central Water Commission (CWC) historical benchmark thresholds.
        </div>
      </div>
    );
  }

  // --- INSPECTOR FOR HAZARD ZONE ---
  if (selection.type === 'zone') {
    const zone = selection.data;

    return (
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-4 text-[#171B19] shadow-xs">
        <div className="flex items-start justify-between border-b border-[#E4E3DC] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF2E6] text-[#C18A32] uppercase">
                {zone.zoneType.replace(/_/g, ' ')}
              </span>
              <SeverityBadge severity={zone.severity === 'advisory' ? 'low' : zone.severity} size="sm" />
            </div>
            <h3 className="font-bold text-sm text-[#171B19]">{zone.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#777D77] hover:text-[#171B19] p-1 rounded-lg hover:bg-[#F5F4EF]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#F5F4EF] rounded-lg p-3 border border-[#E4E3DC] space-y-2 text-xs">
          <div className="font-medium text-[#171B19] leading-relaxed">{zone.details}</div>
          <div className="text-[10px] text-[#C18A32] font-medium pt-1 border-t border-[#E4E3DC]">
            Source: {zone.sourceAttribution}
          </div>
          <div className="text-[10px] text-[#777D77]">
            Boundary Classification: {zone.provenance}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
