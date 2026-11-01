/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info } from 'lucide-react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-[#11161d] border border-slate-800 rounded-lg p-3.5 space-y-3 text-slate-200 text-xs">
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
        <Info className="w-3.5 h-3.5 text-slate-400" />
        <span>Tactical Map Legend</span>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Incident Severity
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white/40 animate-pulse"></span>
            <span>Critical Threat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-600 border border-white/40"></span>
            <span>High Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white/40"></span>
            <span>Medium Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-white/40"></span>
            <span>Low / Advisory</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-2 space-y-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Facilities & Infrastructure
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-300"></span>
            <span>Evacuation Shelter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cyan-600 border border-cyan-300"></span>
            <span>Tactical Team Unit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-200"></span>
            <span>River Gauge (Normal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-red-200"></span>
            <span>River Gauge (Danger)</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-2 space-y-1.5">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Geospatial Risk Boundaries
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-2 rounded bg-amber-500/30 border border-amber-500"></span>
            <span>Verified Inundation / Hazard Polygon</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-2 rounded bg-purple-500/20 border border-purple-500 border-dashed"></span>
            <span>Analytical Proximity Buffer (Turf)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
