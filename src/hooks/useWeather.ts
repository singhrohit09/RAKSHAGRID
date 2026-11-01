/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { WeatherTelemetry } from '../types/telemetry';
import { WeatherProvider } from '../services/external/weatherProvider';

export function useWeather(lat: number | null, lng: number | null, locationName?: string) {
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (lat === null || lng === null) {
      setWeather(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await WeatherProvider.getWeather(lat, lng, locationName);
      setWeather(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch weather telemetry';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, locationName]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { weather, loading, error, refresh: fetchWeather };
}
