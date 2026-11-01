/**
 * RakshaGrid External Provider Data Models & Contracts
 * Phase 3: Live Weather, Hydrological Gauges & Hazard Telemetry
 */

export type WeatherCondition = 
  | 'clear' 
  | 'partly_cloudy' 
  | 'overcast' 
  | 'fog' 
  | 'rain' 
  | 'heavy_rain' 
  | 'thunderstorm' 
  | 'snow' 
  | 'cyclonic_storm' 
  | 'extreme';

export type WeatherSeverity = 'normal' | 'advisory' | 'warning' | 'critical';

export interface NormalizedWeatherReport {
  latitude: number;
  longitude: number;
  temperatureC: number;
  apparentTemperatureC?: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windGustsKmh?: number;
  precipitationMm: number;
  weatherCode: number;
  weatherDescription: string;
  condition: WeatherCondition;
  severity: WeatherSeverity;
  source: string;
  sourceAttribution: string;
  fetchedAt: string;
  lastUpdated: string;
  isLive: boolean;
  isStale: boolean;
  cacheTtlSeconds: number;
}

export type FloodStage = 'normal' | 'watch' | 'warning' | 'severe' | 'inundation';

export type TelemetryType = 'live' | 'live_modeled' | 'simulated' | 'cached' | 'unavailable';

export interface RiverGaugeReport {
  stationId: string;
  riverName: string;
  locationName: string;
  latitude: number;
  longitude: number;
  dischargeM3s: number;
  waterLevelMeters: number;
  dangerLevelMeters: number;
  floodStage: FloodStage;
  trend: 'rising' | 'steady' | 'falling';
  source: string;
  sourceAttribution: string;
  updatedAt: string;
  isLive: boolean; // Direct physical IoT sensor streaming indicator (false if no direct sensor)
  // Granular telemetry truthfulness & provenance breakdown:
  telemetryType: TelemetryType;
  dischargeStatus: 'live_modeled' | 'simulated';
  dischargeIsLive: boolean; // false (modeled numerical runoff forecast, not physical Doppler flow meter)
  waterLevelStatus: 'reference_baseline' | 'simulated';
  waterLevelIsLive: boolean; // ALWAYS false - static baseline / simulated mark
  floodStageStatus?: 'estimated_from_baseline' | 'simulated';
  floodStageIsLive: boolean; // ALWAYS false - not a live observation
  trendIsLive: boolean; // ALWAYS false - simulated / baseline trend
  isModeled: boolean; // true if GloFAS runoff model is available
  isSimulated: boolean; // true if fallback baseline
  modelRunTimestamp?: string | null;
  sensorObservationTimestamp?: string | null;
}

export interface ExternalHazardWarning {
  id: string;
  hazardType: 'flood' | 'cyclone' | 'heavy_rain' | 'heatwave' | 'thunderstorm' | 'landslide';
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
  headline: string;
  description: string;
  affectedRegion: string;
  coordinates?: [number, number];
  issuedAt: string;
  expiresAt: string;
  issuingAgency: string;
  source: string;
  sourceAttribution?: string;
  isLive: boolean; // STRICTLY false for synthetic exercise/demo records
  isSimulated: boolean; // true
  telemetryType: TelemetryType; // 'simulated'
  verificationStatus: 'simulated_drill' | 'verified_official' | 'unverified';
  simulationNotice?: string;
}

export interface ProviderHealthStatus {
  providerName: string;
  serviceType: 'weather' | 'hydrology' | 'hazards';
  status: 'operational' | 'degraded' | 'cached' | 'offline' | 'simulated';
  isLive: boolean;
  telemetryType?: TelemetryType;
  lastSuccess: string | null;
  lastError: string | null;
  latencyMs: number | null;
  requestsCount: number;
  errorsCount: number;
  cachedEntriesCount: number;
  sourceAttribution?: string;
}
