/**
 * RakshaGrid Server-Side Spatial Analysis & Geofencing Engine
 * High-performance point-in-polygon (ray casting), Haversine spherical distance, and spatial intersection evaluator.
 */

export type ShapeType = 'polygon' | 'circle';
export type GeofenceSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type GeofenceStatus = 'Active' | 'Monitoring' | 'Cleared';

export interface GeofenceZone {
  id: string;
  name: string;
  category: string;
  severity: GeofenceSeverity;
  status: GeofenceStatus;
  shapeType: ShapeType;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  coordinates: [number, number][]; // Array of [lat, lng]
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpatialEntity {
  id: string;
  name?: string;
  title?: string;
  latitude: number;
  longitude: number;
  type: 'incident' | 'team' | 'shelter';
}

export interface ZoneEvaluationResult {
  zoneId: string;
  zoneName: string;
  severity: GeofenceSeverity;
  status: GeofenceStatus;
  category: string;
  shapeType: ShapeType;
  containedIncidents: string[];
  containedTeams: string[];
  containedShelters: string[];
  incidentCount: number;
  teamCount: number;
  shelterCount: number;
}

export interface SpatialEvaluationReport {
  timestamp: string;
  totalZones: number;
  activeZones: number;
  evaluations: ZoneEvaluationResult[];
  incidentZoneMap: Record<string, string[]>; // incidentId -> array of zoneNames
  shelterZoneMap: Record<string, string[]>;  // shelterId -> array of zoneNames
}

/**
 * Validates terrestrial coordinate boundaries.
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;
}

/**
 * Validates geometry and vertex array for polygons or circle configurations.
 */
export function validateGeofenceGeometry(shapeType: ShapeType, coordinates: [number, number][], radiusMeters?: number): { valid: boolean; error?: string } {
  if (shapeType === 'circle') {
    if (!coordinates || coordinates.length === 0 || !coordinates[0]) {
      return { valid: false, error: 'Circle geofence requires a center coordinate [lat, lng].' };
    }
    const [lat, lng] = coordinates[0];
    if (!isValidCoordinate(lat, lng)) {
      return { valid: false, error: 'Invalid center coordinates.' };
    }
    if (!radiusMeters || radiusMeters <= 0 || radiusMeters > 500000) {
      return { valid: false, error: 'Circle radius must be between 1 and 500,000 meters.' };
    }
    return { valid: true };
  }

  // Polygon validation
  if (!Array.isArray(coordinates) || coordinates.length < 3) {
    return { valid: false, error: 'Polygon geofence requires at least 3 vertex coordinates.' };
  }

  for (let i = 0; i < coordinates.length; i++) {
    const pt = coordinates[i];
    if (!Array.isArray(pt) || pt.length < 2 || !isValidCoordinate(pt[0], pt[1])) {
      return { valid: false, error: `Invalid vertex coordinate at index ${i}.` };
    }
  }

  return { valid: true };
}

/**
 * Calculates Great-Circle distance between two coordinates in meters using the Haversine formula.
 */
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Evaluates whether a point (lat, lng) is within a circular radius.
 */
export function isPointInCircle(pointLat: number, pointLng: number, centerLat: number, centerLng: number, radiusMeters: number): boolean {
  return haversineDistanceMeters(pointLat, pointLng, centerLat, centerLng) <= radiusMeters;
}

/**
 * Evaluates whether a point (lat, lng) is inside a polygon using ray-casting algorithm.
 * Vertices are expected as [lat, lng].
 */
export function isPointInPolygon(pointLat: number, pointLng: number, polygon: [number, number][]): boolean {
  if (polygon.length < 3) return false;

  // 1. Fast bounding box pre-check
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of polygon) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  if (pointLat < minLat || pointLat > maxLat || pointLng < minLng || pointLng > maxLng) {
    return false;
  }

  // 2. Ray-casting algorithm
  // Test horizontal ray from pointLng towards +infinity along pointLat
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const latI = polygon[i][0];
    const lngI = polygon[i][1];
    const latJ = polygon[j][0];
    const lngJ = polygon[j][1];

    const intersects = ((latI > pointLat) !== (latJ > pointLat)) &&
      (pointLng < ((lngJ - lngI) * (pointLat - latI)) / (latJ - latI) + lngI);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Checks if a given coordinate is contained within a geofence zone.
 */
export function isContainedInGeofence(lat: number, lng: number, zone: GeofenceZone): boolean {
  if (!isValidCoordinate(lat, lng)) return false;

  if (zone.shapeType === 'circle') {
    const centerLat = zone.centerLatitude ?? (zone.coordinates[0] ? zone.coordinates[0][0] : undefined);
    const centerLng = zone.centerLongitude ?? (zone.coordinates[0] ? zone.coordinates[0][1] : undefined);
    const radius = zone.radiusMeters ?? 1000;

    if (centerLat === undefined || centerLng === undefined) return false;
    return isPointInCircle(lat, lng, centerLat, centerLng, radius);
  }

  return isPointInPolygon(lat, lng, zone.coordinates);
}

/**
 * Evaluates spatial intersections between active geofences and sets of operational entities (incidents, teams, shelters).
 */
export function evaluateSpatialContainment(
  zones: GeofenceZone[],
  incidents: SpatialEntity[],
  teams: SpatialEntity[],
  shelters: SpatialEntity[]
): SpatialEvaluationReport {
  const evaluations: ZoneEvaluationResult[] = [];
  const incidentZoneMap: Record<string, string[]> = {};
  const shelterZoneMap: Record<string, string[]> = {};

  const activeZones = zones.filter(z => z.status === 'Active');

  for (const zone of zones) {
    const isZoneActive = zone.status === 'Active';
    const containedIncidents: string[] = [];
    const containedTeams: string[] = [];
    const containedShelters: string[] = [];

    if (isZoneActive) {
      for (const inc of incidents) {
        if (isContainedInGeofence(inc.latitude, inc.longitude, zone)) {
          containedIncidents.push(inc.id);
          if (!incidentZoneMap[inc.id]) incidentZoneMap[inc.id] = [];
          incidentZoneMap[inc.id].push(zone.name);
        }
      }

      for (const team of teams) {
        if (isContainedInGeofence(team.latitude, team.longitude, zone)) {
          containedTeams.push(team.id);
        }
      }

      for (const shelter of shelters) {
        if (isContainedInGeofence(shelter.latitude, shelter.longitude, zone)) {
          containedShelters.push(shelter.id);
          if (!shelterZoneMap[shelter.id]) shelterZoneMap[shelter.id] = [];
          shelterZoneMap[shelter.id].push(zone.name);
        }
      }
    }

    evaluations.push({
      zoneId: zone.id,
      zoneName: zone.name,
      severity: zone.severity,
      status: zone.status,
      category: zone.category,
      shapeType: zone.shapeType,
      containedIncidents,
      containedTeams,
      containedShelters,
      incidentCount: containedIncidents.length,
      teamCount: containedTeams.length,
      shelterCount: containedShelters.length
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalZones: zones.length,
    activeZones: activeZones.length,
    evaluations,
    incidentZoneMap,
    shelterZoneMap
  };
}
