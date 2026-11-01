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
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Incident, Shelter, Team } from '../types';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';

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
  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showHazardBuffer, setShowHazardBuffer] = useState(true);

  // Selected map entity
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'incident' | 'shelter' | 'team';
    data: Incident | Shelter | Team;
  } | null>(() => {
    return incidents[0] ? { type: 'incident', data: incidents[0] } : null;
  });

  // Filter state for map pins
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Map bounding coordinates for Indian subcontinent disaster theater
  // Lat: ~16 to 32, Lng: ~72 to 90
  const MIN_LAT = 15;
  const MAX_LAT = 32;
  const MIN_LNG = 72;
  const MAX_LNG = 90;

  // Projection math from GPS coordinates to SVG coordinate system (0 to 1000 width, 0 to 600 height)
  const project = (lat: number, lng: number) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 960 + 20;
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 560 + 20;
    return { x: Math.max(20, Math.min(980, x)), y: Math.max(20, Math.min(580, y)) };
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
      return true;
    });
  }, [incidents, filterSeverity]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Geospatial Situational Grid"
        kicker="Geographic Information & Threat Vector Node"
        description="Real-time multi-echelon geospatial overview of active hazard zones, safe evacuation shelters, and responder unit locations."
        metadata={
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Projection: WGS84 Mercator Vector Grid</span>
            <span>·</span>
            <span>Coverage: South Asia Disaster Theater</span>
          </div>
        }
      />

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Viewport Canvas */}
        <div className="lg:col-span-3 bg-[#0d1117] border border-slate-800 rounded-lg overflow-hidden flex flex-col relative shadow-xl">
          {/* Map Controls Toolbar */}
          <div className="p-3 bg-[#12171e] border-b border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 uppercase flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Layers:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIncidents(!showIncidents)}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  showIncidents ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-900 text-slate-500'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Incidents ({filteredIncidents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowShelters(!showShelters)}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  showShelters ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-slate-900 text-slate-500'
                }`}
              >
                <Home className="w-3 h-3 text-sky-400" />
                <span>Shelters ({shelters.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTeams(!showTeams)}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  showTeams ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'
                }`}
              >
                <Users className="w-3 h-3 text-emerald-400" />
                <span>Units ({teams.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHazardBuffer(!showHazardBuffer)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  showHazardBuffer ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-500'
                }`}
              >
                <span>50km Threat Radius</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Compass className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>RADAR ACTIVE</span>
            </div>
          </div>

          {/* Tactical SVG Map Graphic */}
          <div className="relative w-full h-[540px] bg-[#0b0e13] overflow-hidden select-none">
            {/* Coordinate Crosshairs & Grid Background */}
            <svg
              className="w-full h-full cursor-crosshair"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#17202c" strokeWidth="0.8" />
                </pattern>
                <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#ef4444" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid backdrop */}
              <rect width="1000" height="600" fill="url(#grid)" />

              {/* Geographical reference outlines (Stylized Subcontinental coastlines and river basins) */}
              <path
                d="M 120 80 Q 240 140 380 180 T 680 240 T 820 180 L 890 320 Q 840 400 810 460 T 740 540 L 680 580 Q 640 500 580 440 T 420 340 T 260 280 Z"
                fill="#121822"
                stroke="#1f2937"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />

              {/* Major Maritime Coastline Guideline */}
              <path
                d="M 400 240 Q 520 280 650 360 T 780 520"
                fill="none"
                stroke="#1e3a5f"
                strokeWidth="1.5"
                opacity="0.4"
              />

              {/* Hazard Buffers */}
              {showHazardBuffer &&
                showIncidents &&
                filteredIncidents.map((inc) => {
                  if (inc.status === 'resolved') return null;
                  const pos = project(inc.coordinates.lat, inc.coordinates.lng);
                  const radius = inc.severity === 'critical' ? 55 : inc.severity === 'high' ? 38 : 25;
                  return (
                    <g key={`buffer-${inc.id}`}>
                      <circle cx={pos.x} cy={pos.y} r={radius} fill="url(#hazardGlow)" />
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill="none"
                        stroke={inc.severity === 'critical' ? '#ef4444' : '#f59e0b'}
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        opacity="0.6"
                      />
                    </g>
                  );
                })}

              {/* Shelters Layer */}
              {showShelters &&
                shelters.map((shelter) => {
                  const pos = project(shelter.coordinates.lat, shelter.coordinates.lng);
                  const isSelected = selectedEntity?.data.id === shelter.id;
                  return (
                    <g
                      key={`shelter-${shelter.id}`}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedEntity({ type: 'shelter', data: shelter })}
                      className="cursor-pointer"
                    >
                      <rect
                        x="-10"
                        y="-10"
                        width="20"
                        height="20"
                        rx="3"
                        fill="#0284c7"
                        stroke={isSelected ? '#ffffff' : '#38bdf8'}
                        strokeWidth={isSelected ? '2' : '1'}
                      />
                      <path d="M -5 -2 L 0 -6 L 5 -2 L 5 4 L -5 4 Z" fill="#ffffff" />
                      <text
                        x="14"
                        y="4"
                        fill="#7dd3fc"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {shelter.id}
                      </text>
                    </g>
                  );
                })}

              {/* Teams Layer */}
              {showTeams &&
                teams.map((team) => {
                  const pos = project(team.location.lat, team.location.lng);
                  const isSelected = selectedEntity?.data.id === team.id;
                  return (
                    <g
                      key={`team-${team.id}`}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedEntity({ type: 'team', data: team })}
                      className="cursor-pointer"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill="#059669"
                        stroke={isSelected ? '#ffffff' : '#34d399'}
                        strokeWidth={isSelected ? '2' : '1'}
                      />
                      <circle cx="0" cy="-2" r="2.5" fill="#ffffff" />
                      <path d="M -4 5 Q 0 1 4 5" fill="none" stroke="#ffffff" strokeWidth="1.2" />
                      <text
                        x="13"
                        y="4"
                        fill="#a7f3d0"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {team.id}
                      </text>
                    </g>
                  );
                })}

              {/* Incidents Layer */}
              {showIncidents &&
                filteredIncidents.map((inc) => {
                  const pos = project(inc.coordinates.lat, inc.coordinates.lng);
                  const isSelected = selectedEntity?.data.id === inc.id;
                  const isCrit = inc.severity === 'critical';
                  return (
                    <g
                      key={`inc-${inc.id}`}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedEntity({ type: 'incident', data: inc })}
                      className="cursor-pointer"
                    >
                      {/* Pulse circle for critical */}
                      {isCrit && inc.status === 'active' && (
                        <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="1.5">
                          <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <polygon
                        points="0,-12 11,8 -11,8"
                        fill={isCrit ? '#dc2626' : '#d97706'}
                        stroke={isSelected ? '#ffffff' : '#fecaca'}
                        strokeWidth={isSelected ? '2' : '1'}
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        !
                      </text>
                      <text
                        x="14"
                        y="4"
                        fill="#fca5a5"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {inc.id}
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* In-canvas Legend */}
            <div className="absolute bottom-3 left-3 bg-[#12171e]/90 backdrop-blur-xs border border-slate-800 rounded p-2.5 text-[11px] font-mono space-y-1.5 shadow-lg">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Tactical Map Legend
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-rose-600 rounded-xs shrink-0" />
                <span className="text-slate-300">Hazard / Incident Epicenter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-sky-600 rounded-xs shrink-0" />
                <span className="text-slate-300">Evacuation Shelter Haven</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-600 rounded-full shrink-0" />
                <span className="text-slate-300">Deployed Response Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Side Panel */}
        <div className="space-y-4">
          <div className="p-4 bg-[#12171e] border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Target Inspector
                </h3>
              </div>
              {selectedEntity && (
                <span className="text-[10px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded text-amber-400 border border-slate-800">
                  {selectedEntity.type}
                </span>
              )}
            </div>

            {selectedEntity ? (
              <div className="space-y-4 text-xs">
                {/* When Incident is Selected */}
                {selectedEntity.type === 'incident' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-amber-400">
                          {(selectedEntity.data as Incident).id}
                        </span>
                        <SeverityBadge severity={(selectedEntity.data as Incident).severity} size="sm" />
                      </div>
                      <h4 className="font-semibold text-slate-100 text-sm">
                        {(selectedEntity.data as Incident).title}
                      </h4>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">
                      {(selectedEntity.data as Incident).description}
                    </p>

                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-1 font-mono text-[11px]">
                      <div className="text-slate-500 uppercase text-[10px]">Geospatial Fix</div>
                      <div className="text-slate-200">{(selectedEntity.data as Incident).location}</div>
                      <div className="text-amber-400">
                        {(selectedEntity.data as Incident).coordinates.lat.toFixed(4)}° N,{' '}
                        {(selectedEntity.data as Incident).coordinates.lng.toFixed(4)}° E
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                      <span className="text-slate-500 font-mono">Status:</span>
                      <StatusBadge status={(selectedEntity.data as Incident).status} size="sm" />
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToIncident((selectedEntity.data as Incident).id)}
                      className="w-full py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Open Incident Command Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* When Shelter is Selected */}
                {selectedEntity.type === 'shelter' && (
                  <>
                    <div>
                      <span className="font-mono font-bold text-sky-400">
                        {(selectedEntity.data as Shelter).id}
                      </span>
                      <h4 className="font-semibold text-slate-100 text-sm mt-0.5">
                        {(selectedEntity.data as Shelter).name}
                      </h4>
                    </div>

                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-2 font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Occupancy:</span>
                        <span className="text-slate-100 font-bold">
                          {(selectedEntity.data as Shelter).currentOccupancy} /{' '}
                          {(selectedEntity.data as Shelter).capacity}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((selectedEntity.data as Shelter).currentOccupancy /
                                (selectedEntity.data as Shelter).capacity) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-1 font-mono text-[11px]">
                      <div className="text-slate-500 uppercase text-[10px]">Safe Haven Address</div>
                      <div className="text-slate-200">{(selectedEntity.data as Shelter).location}</div>
                      <div className="text-slate-400 text-[10px]">
                        Contact: {(selectedEntity.data as Shelter).contactPerson} (
                        {(selectedEntity.data as Shelter).contactPhone})
                      </div>
                    </div>
                  </>
                )}

                {/* When Team is Selected */}
                {selectedEntity.type === 'team' && (
                  <>
                    <div>
                      <span className="font-mono font-bold text-emerald-400">
                        {(selectedEntity.data as Team).id}
                      </span>
                      <h4 className="font-semibold text-slate-100 text-sm mt-0.5">
                        {(selectedEntity.data as Team).name}
                      </h4>
                    </div>

                    <div className="p-2.5 rounded bg-slate-900 border border-slate-850 space-y-1 font-mono text-[11px]">
                      <div className="text-slate-500 uppercase text-[10px]">Specialization</div>
                      <div className="text-slate-200 font-bold">{(selectedEntity.data as Team).specialization}</div>
                      <div className="text-slate-400">{(selectedEntity.data as Team).memberCount} Active Personnel</div>
                      <div className="text-slate-400">Commander: {(selectedEntity.data as Team).leader}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                      <span className="text-slate-500 font-mono">Status:</span>
                      <StatusBadge status={(selectedEntity.data as Team).status} size="sm" />
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToTeam((selectedEntity.data as Team).id)}
                      className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono text-xs transition-colors border border-slate-700"
                    >
                      View Team Directory Entry
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                Click any pin on the tactical grid to inspect real-time metadata.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
