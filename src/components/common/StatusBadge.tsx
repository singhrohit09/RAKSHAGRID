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
        return 'text-[#B9433D] bg-[#F9EBEA] border-[#E8C2BF]';
      // In progress / warning
      case 'investigating':
      case 'en_route':
      case 'in_transit':
      case 'moderate':
      case 'full':
      case 'high':
        return 'text-[#C18A32] bg-[#FAF2E6] border-[#EED7B8]';
      // Standby / triage
      case 'standby':
      case 'triage':
      case 'on_scene':
      case 'reserved':
        return 'text-[#2B5A84] bg-[#E8EFF5] border-[#C6D8E7]';
      // Contained / ready / available / resolved
      case 'contained':
      case 'resolved':
      case 'available':
      case 'open':
      case 'stocked':
      case 'adequate':
        return 'text-[#315C46] bg-[#E5EDE6] border-[#C8DACB]';
      case 'off_duty':
      case 'closed':
      default:
        return 'text-[#555A55] bg-[#EBEBE6] border-[#DCDCD5]';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').toUpperCase();
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-wider font-mono ${pad} ${getStyle()}`}
    >
      {formatText(status)}
    </span>
  );
};
