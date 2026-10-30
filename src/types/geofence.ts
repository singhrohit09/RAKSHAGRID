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
  coordinates: [number, number][]; // [lat, lng]
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
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
  incidentZoneMap: Record<string, string[]>;
  shelterZoneMap: Record<string, string[]>;
}
