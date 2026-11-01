/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  icon?: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  onClick?: () => void;
  showDemoBadge?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  variant = 'default',
  onClick,
  showDemoBadge = true,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return 'border-rose-900/50 bg-[#171013] hover:border-rose-700/60 text-rose-400';
      case 'warning':
        return 'border-amber-900/50 bg-[#19140e] hover:border-amber-700/60 text-amber-400';
      case 'success':
        return 'border-emerald-900/50 bg-[#0d1814] hover:border-emerald-700/60 text-emerald-400';
      case 'info':
        return 'border-sky-900/50 bg-[#0e1620] hover:border-sky-700/60 text-sky-400';
      default:
        return 'border-slate-800 bg-[#12171e] hover:border-slate-700 text-slate-300';
    }
  };

  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative p-4 rounded border transition-all duration-150 text-left select-none ${getVariantStyles()} ${
        isClickable ? 'cursor-pointer hover:shadow-md hover:shadow-black/30' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase truncate">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {showDemoBadge && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">
              DEMO
            </span>
          )}
          {Icon && (
            <div className="p-1 rounded bg-slate-800/40 text-slate-300">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono tabular-nums ${
              trend.direction === 'up'
                ? 'text-rose-400'
                : trend.direction === 'down'
                ? 'text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.text}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-1.5 text-xs text-slate-400 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
