/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IncidentStatus, TeamStatus, ShelterStatus, TaskStatus, ResourceStatus } from '../../types';

type AnyStatus = IncidentStatus | TeamStatus | ShelterStatus | TaskStatus | ResourceStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  const getStyle = () => {
    switch (norm) {
      // Active / Critical statuses
      case 'active':
      case 'deployed':
      case 'critical':
      case 'depleted':
        return 'text-rose-300 bg-rose-950/30 border-rose-800/40';
      // In progress / warning
      case 'investigating':
      case 'en_route':
      case 'in_transit':
      case 'moderate':
      case 'full':
      case 'high':
        return 'text-amber-300 bg-amber-950/30 border-amber-800/40';
      // Standby / triage
      case 'standby':
      case 'triage':
      case 'on_scene':
      case 'reserved':
        return 'text-cyan-300 bg-cyan-950/30 border-cyan-800/40';
      // Contained / ready / available / resolved
      case 'contained':
      case 'resolved':
      case 'available':
      case 'open':
      case 'stocked':
      case 'adequate':
        return 'text-emerald-300 bg-emerald-950/30 border-emerald-800/40';
      case 'off_duty':
      case 'closed':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').toUpperCase();
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border whitespace-nowrap tracking-wide ${pad} ${getStyle()}`}
    >
      {formatText(status)}
    </span>
  );
};
