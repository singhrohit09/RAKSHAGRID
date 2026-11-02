/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  label?: string;
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  label,
  options,
  selectedId,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-[#777D77] uppercase tracking-wider whitespace-nowrap shrink-0 mr-1">
          {label}:
        </span>
      )}
      <div className="flex items-center gap-1 p-1 bg-[#F5F4EF] rounded-lg border border-[#E4E3DC] shrink-0">
        {options.map((opt) => {
          const isActive = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-[#315C46] font-semibold shadow-xs border border-[#E4E3DC]'
                  : 'text-[#575D56] hover:text-[#171B19] hover:bg-white/60'
              }`}
            >
              <span>{opt.label}</span>
              {opt.count !== undefined && (
                <span
                  className={`text-[10px] tabular-nums font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#E5EDE6] text-[#315C46]' : 'bg-[#EAE8E1] text-[#777D77]'
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
