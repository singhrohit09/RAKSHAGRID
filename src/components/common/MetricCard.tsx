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
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return 'border-[#E8C2BF] bg-white hover:border-[#B9433D]/50';
      case 'warning':
        return 'border-[#EED7B8] bg-white hover:border-[#C18A32]/50';
      case 'success':
        return 'border-[#C8DACB] bg-white hover:border-[#315C46]/50';
      case 'info':
        return 'border-[#E4E3DC] bg-white hover:border-[#D0CFC5]';
      default:
        return 'border-[#E4E3DC] bg-white hover:border-[#D0CFC5]';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'critical':
        return 'text-[#B9433D]';
      case 'warning':
        return 'text-[#C18A32]';
      case 'success':
        return 'text-[#315C46]';
      default:
        return 'text-[#171B19]';
    }
  };

  const getIconWrapperStyles = () => {
    switch (variant) {
      case 'critical':
        return 'bg-[#F9EBEA] text-[#B9433D]';
      case 'warning':
        return 'bg-[#FAF2E6] text-[#C18A32]';
      case 'success':
        return 'bg-[#E5EDE6] text-[#315C46]';
      default:
        return 'bg-[#F5F4EF] text-[#315C46]';
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
      className={`relative p-5 rounded-xl border transition-all duration-150 text-left select-none shadow-xs ${getVariantStyles()} ${
        isClickable ? 'cursor-pointer hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-semibold text-[#777D77] tracking-wider uppercase truncate">
          {label}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-lg shrink-0 ${getIconWrapperStyles()}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight ${getValueColor()}`}>
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono tabular-nums font-medium ${
              trend.direction === 'up'
                ? 'text-[#B9433D]'
                : trend.direction === 'down'
                ? 'text-[#315C46]'
                : 'text-[#777D77]'
            }`}
          >
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.text}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-1.5 text-xs text-[#777D77] truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
