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
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider whitespace-nowrap shrink-0 mr-1">
          {label}:
        </span>
      )}
      <div className="flex items-center gap-1 p-0.5 bg-[#0d1117] rounded border border-slate-800 shrink-0">
        {options.map((opt) => {
          const isActive = opt.id === selectedId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span>{opt.label}</span>
              {opt.count !== undefined && (
                <span
                  className={`text-[10px] tabular-nums px-1 rounded ${
                    isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-900 text-slate-400'
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
