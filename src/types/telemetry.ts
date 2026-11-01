/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeatherClassification =
  | 'CURRENT_OBSERVATION'
  | 'MODEL_FORECAST'
  | 'HISTORICAL_DATA'
  | 'UNAVAILABLE';

export interface WeatherTelemetry {
  locationName: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  relativeHumidityPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  weatherCode: number;
  weatherCondition: string;
  classification: WeatherClassification;
  provider: string; // e.g., 'Open-Meteo Weather API (DWD/NOAA Model Blend)'
  observedAt: string;
  retrievedAt: string;
  dataFreshness: 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE';
  hourlyForecast?: Array<{
    time: string;
    precipitationProbability: number;
    precipitationMm: number;
    temperatureC: number;
  }>;
}

export type HydrologyClassification =
  | 'LIVE_SENSOR_TELEMETRY'
  | 'LIVE_MODELED_DATA'
  | 'FORECAST_DATA'
  | 'REFERENCE_BASELINE'
  | 'SIMULATED_DEMO_DATA'
  | 'UNAVAILABLE';

export interface HydrologyTelemetry {
  id: string;
  riverName: string;
  stationName: string;
  latitude: number;
  longitude: number;
  dischargeCubicMetersPerSec?: number;
  waterLevelMeters?: number;
  warningLevelMeters?: number;
  dangerLevelMeters?: number;
  hflMeters?: number; // Historical High Flood Level
  status: 'NORMAL' | 'WARNING' | 'DANGER' | 'RECORD_HIGH';
  classification: HydrologyClassification;
  provider: string; // e.g., 'Copernicus GloFAS via Open-Meteo Flood API' or 'Central Water Commission (CWC)'
  dataSource: string;
  observedAt: string;
  retrievedAt: string;
  provenanceMetadata: {
    modelType?: string;
    gaugeId?: string;
    basin: string;
    limitations: string;
  };
  dischargeForecast7Days?: Array<{
    date: string;
    meanDischarge: number;
    maxDischarge: number;
  }>;
}

export interface TelemetrySource {
  id: string;
  provider: string;
  sourceName: string;
  sourceType: 'weather' | 'hydrology' | 'seismic' | 'gis';
  endpointIdentifier: string;
  enabled: boolean;
  status: 'ONLINE' | 'DEGRADED' | 'UNAVAILABLE';
  lastPingAt: string;
}
