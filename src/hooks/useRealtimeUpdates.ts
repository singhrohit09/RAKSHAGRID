/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { realtimeService, RealtimeStatus } from '../services/realtime/realtime.service';

export function useRealtimeUpdates(onDataMutation?: () => void) {
  const [status, setStatus] = useState<RealtimeStatus>(() => realtimeService.getStatus());

  useEffect(() => {
    const unsubStatus = realtimeService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscriptions to tables
    const unsubIncidents = realtimeService.subscribeToTable('incidents', () => {
      onDataMutation?.();
    });
    const unsubTeams = realtimeService.subscribeToTable('teams', () => {
      onDataMutation?.();
    });
    const unsubShelters = realtimeService.subscribeToTable('shelters', () => {
      onDataMutation?.();
    });
    const unsubAlerts = realtimeService.subscribeToTable('alerts', () => {
      onDataMutation?.();
    });

    return () => {
      unsubStatus();
      unsubIncidents();
      unsubTeams();
      unsubShelters();
      unsubAlerts();
    };
  }, [onDataMutation]);

  return { status };
}
