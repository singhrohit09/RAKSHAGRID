import { 
  NormalizedWeatherReport, 
  ProviderHealthStatus 
} from './types.js';
import { interpretWmoCode } from './wmoCodes.js';
import { ExternalDataCache } from './cache.js';

export interface WeatherProviderOptions {
  timeoutMs?: number;
  cacheTtlMs?: number;
  customBaseUrl?: string;
}

export class OpenMeteoWeatherProvider {
  private cache: ExternalDataCache<NormalizedWeatherReport>;
  private timeoutMs: number;
  private baseUrl: string;
  private requestsCount = 0;
  private errorsCount = 0;
  private lastSuccess: string | null = null;
  private lastError: string | null = null;
  private lastLatencyMs: number | null = null;

  constructor(options: WeatherProviderOptions = {}) {
    this.timeoutMs = options.timeoutMs || 5000;
    this.baseUrl = options.customBaseUrl || process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast';
    // 10 minute cache TTL for weather
    this.cache = new ExternalDataCache<NormalizedWeatherReport>(options.cacheTtlMs || 10 * 60 * 1000);
  }

  /**
   * Fetches normalized weather telemetry for given terrestrial coordinates.
   */
  public async getWeather(latitude: number, longitude: number): Promise<NormalizedWeatherReport> {
    const latKey = Number(latitude.toFixed(2));
    const lngKey = Number(longitude.toFixed(2));
    const cacheKey = `weather:${latKey}:${lngKey}`;

    // 1. Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !cached.isStale) {
      return {
        ...cached.data,
        isStale: false
      };
    }

    this.requestsCount++;
    const startTime = Date.now();

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('latitude', latKey.toString());
      url.searchParams.set('longitude', lngKey.toString());
      url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m');
      url.searchParams.set('timezone', 'auto');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RakshaGrid-Disaster-Platform/3.0'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP error: status ${response.status} ${response.statusText}`);
      }

      const json = (await response.json()) as any;
      if (!json || !json.current) {
        throw new Error('Malformed weather response: missing "current" telemetry object.');
      }

      const current = json.current;
      const wmoInterpretation = interpretWmoCode(
        current.weather_code ?? 0, 
        current.wind_speed_10m ?? 0, 
        current.precipitation ?? 0
      );

      const now = new Date().toISOString();
      const report: NormalizedWeatherReport = {
        latitude: latKey,
        longitude: lngKey,
        temperatureC: Number(current.temperature_2m ?? 0),
        apparentTemperatureC: current.apparent_temperature ? Number(current.apparent_temperature) : undefined,
        relativeHumidity: Number(current.relative_humidity_2m ?? 0),
        windSpeedKmh: Number(current.wind_speed_10m ?? 0),
        windDirectionDeg: Number(current.wind_direction_10m ?? 0),
        windGustsKmh: current.wind_gusts_10m ? Number(current.wind_gusts_10m) : undefined,
        precipitationMm: Number(current.precipitation ?? 0),
        weatherCode: Number(current.weather_code ?? 0),
        weatherDescription: wmoInterpretation.description,
        condition: wmoInterpretation.condition,
        severity: wmoInterpretation.severity,
        source: 'Open-Meteo Meteorological Service',
        sourceAttribution: 'Weather data by Open-Meteo.com (CC BY 4.0)',
        fetchedAt: now,
        lastUpdated: current.time ? new Date(current.time).toISOString() : now,
        isLive: true,
        isStale: false,
        cacheTtlSeconds: 600
      };

      this.lastLatencyMs = Date.now() - startTime;
      this.lastSuccess = now;
      this.cache.set(cacheKey, report);
      return report;
    } catch (err: any) {
      this.errorsCount++;
      this.lastError = err.message || 'Unknown network error';

      // 2. If cached entry exists (even if stale), return it with isStale: true
      if (cached) {
        return {
          ...cached.data,
          isStale: true,
          source: `${cached.data.source} (Stale Cached Copy)`
        };
      }

      // 3. Fallback to clearly documented simulated development baseline
      return this.getSimulatedFallback(latKey, lngKey);
    }
  }

  /**
   * Deterministic simulated fallback for offline development / isolated test environments.
   * Clearly marked as isLive: false and simulated.
   */
  public getSimulatedFallback(latitude: number, longitude: number): NormalizedWeatherReport {
    const now = new Date().toISOString();
    return {
      latitude,
      longitude,
      temperatureC: 28.5,
      apparentTemperatureC: 30.2,
      relativeHumidity: 68,
      windSpeedKmh: 14.5,
      windDirectionDeg: 135,
      precipitationMm: 0.0,
      weatherCode: 2,
      weatherDescription: 'Partly cloudy (Simulated Offline Baseline)',
      condition: 'partly_cloudy',
      severity: 'normal',
      source: 'RakshaGrid Development Offline Baseline (Simulated)',
      sourceAttribution: 'Simulated baseline for disconnected operational environments',
      fetchedAt: now,
      lastUpdated: now,
      isLive: false,
      isStale: false,
      cacheTtlSeconds: 0
    };
  }

  public getHealth(): ProviderHealthStatus {
    const stats = this.cache.getStats();
    let status: ProviderHealthStatus['status'] = 'operational';

    if (this.errorsCount > 0 && this.requestsCount === this.errorsCount) {
      status = 'offline';
    } else if (this.errorsCount > 0) {
      status = 'degraded';
    }

    return {
      providerName: 'Open-Meteo Meteorological WMO Provider',
      serviceType: 'weather',
      status,
      isLive: status === 'operational' || status === 'degraded',
      lastSuccess: this.lastSuccess,
      lastError: this.lastError,
      latencyMs: this.lastLatencyMs,
      requestsCount: this.requestsCount,
      errorsCount: this.errorsCount,
      cachedEntriesCount: stats.size
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const openMeteoWeather = new OpenMeteoWeatherProvider();
