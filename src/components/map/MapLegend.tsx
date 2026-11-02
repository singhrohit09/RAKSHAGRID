/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info } from 'lucide-react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-white border border-[#E4E3DC] rounded-xl p-4 space-y-3.5 text-[#171B19] text-xs shadow-xs">
      <div className="flex items-center gap-1.5 font-bold text-xs text-[#171B19] uppercase tracking-wider border-b border-[#E4E3DC] pb-2.5">
        <Info className="w-3.5 h-3.5 text-[#315C46]" />
        <span>Map Symbology & Legend</span>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-[#777D77] uppercase tracking-wider">
          Incident Severity
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B9433D] border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C18A32] border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C18A32]/70 border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#315C46] border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Low / Advisory</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E4E3DC] pt-2.5 space-y-2">
        <div className="text-[11px] font-semibold text-[#777D77] uppercase tracking-wider">
          Facilities & Hydrology
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#315C46] border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Shelter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#315C46] border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Field Team</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Gauge (Normal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B9433D] border border-white shadow-xs"></span>
            <span className="font-medium text-[#171B19]">Gauge (Danger)</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E4E3DC] pt-2.5 space-y-2">
        <div className="text-[11px] font-semibold text-[#777D77] uppercase tracking-wider">
          Spatial Zones
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#B9433D]/20 border border-[#B9433D]"></span>
            <span className="font-medium text-[#171B19]">High-Risk Inundation Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t border-dashed border-[#C18A32]"></span>
            <span className="font-medium text-[#171B19]">Proximity Radius Buffer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
