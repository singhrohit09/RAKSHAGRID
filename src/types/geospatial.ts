/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinates, Incident, Shelter, Team } from './index';

export type LocationProvenanceType =
  | 'LIVE_GPS'
  | 'LAST_REPORTED_LOCATION'
  | 'REGISTERED_BASE_LOCATION'
  | 'UNKNOWN_LOCATION';

export interface LocationProvenance {
  type: LocationProvenanceType;
  source: string;
  reportedAt?: string;
  accuracyMeters?: number;
}

export type HazardZoneType =
  | 'VERIFIED_FLOOD_INUNDATION'
  | 'CYCLONE_WARNING_CONE'
  | 'LANDSLIDE_HIGH_HAZARD'
  | 'INDUSTRIAL_CONTAINMENT'
  | 'ANALYTICAL_PROXIMITY_BUFFER';

export type HazardZoneProvenance =
  | 'VERIFIED_OFFICIAL_DATASET'
  | 'ANALYTICAL_PROXIMITY_BUFFER'
  | 'ILLUSTRATIVE_DEMO_ZONE';

export interface HazardZone {
  id: string;
  name: string;
  zoneType: HazardZoneType;
  provenance: HazardZoneProvenance;
  sourceAttribution: string;
  severity: 'critical' | 'high' | 'medium' | 'advisory';
  coordinates: [number, number][]; // [lat, lng] polygon vertices
  center?: Coordinates;
  radiusKm?: number; // For analytical circular buffers
  validUntil?: string;
  details: string;
}

export interface MapLayerState {
  incidents: boolean;
  shelters: boolean;
  teams: boolean;
  hazardZones: boolean;
  proximityBuffers: boolean;
  weatherOverlay: boolean;
  hydrologyGauges: boolean;
}

export interface ProximityAnalysisResult {
  incidentId: string;
  bufferRadiusKm: number;
  nearbyShelters: Array<{
    shelter: Shelter;
    distanceKm: number;
    availableCapacity: number;
  }>;
  nearbyTeams: Array<{
    team: Team;
    distanceKm: number;
    isAvailable: boolean;
  }>;
  calculatedAt: string;
}

export interface GeocodeResult {
  placeId: string;
  displayName: string;
  coordinates: Coordinates;
  category: string;
  type: string;
  attribution: string;
}
