/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, Users, Home, Box, CheckSquare, Zap, X, MapPin } from 'lucide-react';
import { Incident, Team, Shelter, Resource, Task } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  teams: Team[];
  shelters: Shelter[];
  resources: Resource[];
  tasks: Task[];
  onNavigate: (route: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  incidents,
  teams,
  shelters,
  resources,
  tasks,
  onNavigate,
}) => {
  const { permissions } = useAuth();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingIncidents = q
    ? incidents.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.disasterType.toLowerCase().includes(q)
      )
    : incidents.slice(0, 3);

  const matchingTeams = q
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.specialization.toLowerCase().includes(q) ||
          t.assignedZone.toLowerCase().includes(q)
      )
    : teams.slice(0, 2);

  const matchingShelters = q
    ? shelters.filter(
        (s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)
      )
    : [];

  const handleSelect = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-[#161c24] border border-slate-750 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center px-4 border-b border-slate-800 bg-[#12171e]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search incidents, teams, shelters, resources, coordinates... (Esc to exit)"
            className="w-full px-3 py-3.5 bg-transparent text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick command actions */}
          <div>
            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
              Command Actions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {permissions.canCreateIncident && (
                <button
                  type="button"
                  onClick={() => handleSelect('/incidents?action=create')}
                  className="flex items-center gap-2 p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs text-left border border-slate-800/80 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Report Incident</span>
                </button>
              )}
              {permissions.canBroadcastAlert && (
                <button
                  type="button"
                  onClick={() => handleSelect('/alerts?action=broadcast')}
                  className="flex items-center gap-2 p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs text-left border border-slate-800/80 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">Broadcast Alert</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSelect('/map')}
                className="flex items-center gap-2 p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs text-left border border-slate-800/80 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Open Situational Map</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelect('/teams')}
                className="flex items-center gap-2 p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs text-left border border-slate-800/80 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Dispatch Teams</span>
              </button>
            </div>
          </div>

          {/* Incidents matching */}
          {matchingIncidents.length > 0 && (
            <div>
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                <span>Incidents ({matchingIncidents.length})</span>
                <span className="text-slate-600">Select to inspect</span>
              </div>
              <div className="space-y-1">
                {matchingIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => handleSelect(`/incidents?id=${inc.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/80 text-left transition-colors border border-transparent hover:border-slate-700/50"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-amber-400 font-semibold">{inc.id}</span>
                        <span className="text-xs font-medium text-slate-200 truncate">{inc.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {inc.location} · {inc.region}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border border-slate-750 bg-slate-900 text-slate-300 shrink-0">
                      {inc.severity}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teams matching */}
          {matchingTeams.length > 0 && (
            <div>
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                Response Teams ({matchingTeams.length})
              </div>
              <div className="space-y-1">
                {matchingTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelect(`/teams?id=${team.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/80 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">{team.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {team.specialization} · {team.assignedZone}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      {team.status.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shelters matching */}
          {matchingShelters.length > 0 && (
            <div>
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                Shelters ({matchingShelters.length})
              </div>
              <div className="space-y-1">
                {matchingShelters.map((shelter) => (
                  <button
                    key={shelter.id}
                    onClick={() => handleSelect(`/shelters?id=${shelter.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/80 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">{shelter.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {shelter.location} ({shelter.currentOccupancy}/{shelter.capacity} capacity)
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 shrink-0">
                      {shelter.status.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-2.5 border-t border-slate-800 bg-[#10141a] text-slate-500 text-[11px] font-mono flex items-center justify-between">
          <span>Navigate with click or arrow keys</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
