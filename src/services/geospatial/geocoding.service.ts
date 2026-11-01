/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeocodeResult } from '../../types/geospatial';

const geocodeCache = new Map<string, GeocodeResult[]>();

export const GeocodingService = {
  /**
   * Searches locations via OpenStreetMap Nominatim with caching & rate compliance
   */
  async searchLocation(query: string): Promise<GeocodeResult[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const cacheKey = trimmed.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          // Nominatim requires identification
          'User-Agent': 'RakshaGrid-Disaster-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim error status ${response.status}`);
      }

      const items = (await response.json()) as Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
        class?: string;
        type?: string;
      }>;

      const results: GeocodeResult[] = items.map((item) => ({
        placeId: String(item.place_id),
        displayName: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
        category: item.class || 'place',
        type: item.type || 'locality',
        attribution: '© OpenStreetMap contributors (ODbL)',
      }));

      geocodeCache.set(cacheKey, results);
      return results;
    } catch (err) {
      console.warn('[RakshaGrid Geocode] Search query failed, falling back to local registry:', err);

      // Known regional disaster centers fallback
      const REGIONAL_REGISTRY: Record<string, { lat: number; lng: number }> = {
        assam: { lat: 26.2006, lng: 92.9376 },
        guwahati: { lat: 26.1445, lng: 91.7362 },
        wayanad: { lat: 11.6854, lng: 76.132 },
        kerala: { lat: 10.8505, lng: 76.2711 },
        odisha: { lat: 20.9517, lng: 85.0985 },
        bhubaneswar: { lat: 20.2961, lng: 85.8245 },
        delhi: { lat: 28.6139, lng: 77.209 },
        mumbai: { lat: 19.076, lng: 72.8777 },
        chennai: { lat: 13.0827, lng: 80.2707 },
        kolkata: { lat: 22.5726, lng: 88.3639 },
      };

      const match = Object.keys(REGIONAL_REGISTRY).find((k) => cacheKey.includes(k));
      if (match) {
        const coords = REGIONAL_REGISTRY[match];
        return [
          {
            placeId: `local-${match}`,
            displayName: `${match.toUpperCase()} Disaster Operations Center`,
            coordinates: coords,
            category: 'boundary',
            type: 'administrative',
            attribution: 'RakshaGrid Offline Regional Index',
          },
        ];
      }

      return [];
    }
  },
};
