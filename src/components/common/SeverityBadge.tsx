/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SeverityLevel, AlertSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: SeverityLevel | AlertSeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const norm = severity.toLowerCase();

  const config = {
    critical: {
      label: 'CRITICAL',
      colorClass: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
      dotClass: 'bg-rose-500',
    },
    emergency: {
      label: 'EMERGENCY',
      colorClass: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
      dotClass: 'bg-rose-500',
    },
    high: {
      label: 'HIGH',
      colorClass: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      dotClass: 'bg-amber-500',
    },
    warning: {
      label: 'WARNING',
      colorClass: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      dotClass: 'bg-amber-500',
    },
    medium: {
      label: 'MEDIUM',
      colorClass: 'text-sky-400 bg-sky-950/40 border-sky-800/60',
      dotClass: 'bg-sky-500',
    },
    advisory: {
      label: 'ADVISORY',
      colorClass: 'text-sky-400 bg-sky-950/40 border-sky-800/60',
      dotClass: 'bg-sky-500',
    },
    low: {
      label: 'LOW',
      colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
      dotClass: 'bg-emerald-500',
    },
  }[norm] || {
    label: severity.toUpperCase(),
    colorClass: 'text-slate-400 bg-slate-900 border-slate-700',
    dotClass: 'bg-slate-400',
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded tracking-wide border whitespace-nowrap ${pad} ${config.colorClass}`}
      role="status"
      aria-label={`Severity: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
