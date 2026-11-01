/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { HydrologyTelemetry } from '../types/telemetry';
import { HydrologyProvider, RiverGaugeStation } from '../services/external/hydrologyProvider';

export function useHydrology(lat: number | null, lng: number | null) {
  const [hydrology, setHydrology] = useState<HydrologyTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHydrology = useCallback(async () => {
    if (lat === null || lng === null) {
      setHydrology(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await HydrologyProvider.getHydrologyForLocation(lat, lng);
      setHydrology(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch hydrology telemetry';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    fetchHydrology();
  }, [fetchHydrology]);

  const allGauges: RiverGaugeStation[] = HydrologyProvider.getAllGaugeStations();

  return { hydrology, allGauges, loading, error, refresh: fetchHydrology };
}
