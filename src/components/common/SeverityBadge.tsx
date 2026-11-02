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
      colorClass: 'text-[#B9433D] bg-[#F9EBEA] border-[#E8C2BF]',
      dotClass: 'bg-[#B9433D]',
    },
    emergency: {
      label: 'EMERGENCY',
      colorClass: 'text-[#B9433D] bg-[#F9EBEA] border-[#E8C2BF]',
      dotClass: 'bg-[#B9433D]',
    },
    high: {
      label: 'HIGH',
      colorClass: 'text-[#C18A32] bg-[#FAF2E6] border-[#EED7B8]',
      dotClass: 'bg-[#C18A32]',
    },
    warning: {
      label: 'WARNING',
      colorClass: 'text-[#C18A32] bg-[#FAF2E6] border-[#EED7B8]',
      dotClass: 'bg-[#C18A32]',
    },
    medium: {
      label: 'MEDIUM',
      colorClass: 'text-[#315C46] bg-[#E5EDE6] border-[#C8DACB]',
      dotClass: 'bg-[#315C46]',
    },
    advisory: {
      label: 'ADVISORY',
      colorClass: 'text-[#2B5A84] bg-[#E8EFF5] border-[#C6D8E7]',
      dotClass: 'bg-[#2B5A84]',
    },
    low: {
      label: 'LOW',
      colorClass: 'text-[#555A55] bg-[#EBEBE6] border-[#DCDCD5]',
      dotClass: 'bg-[#555A55]',
    },
  }[norm] || {
    label: severity.toUpperCase(),
    colorClass: 'text-[#555A55] bg-[#EBEBE6] border-[#DCDCD5]',
    dotClass: 'bg-[#555A55]',
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border tracking-wide uppercase font-mono ${pad} ${config.colorClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
};
