import { RiverGaugeReport, ExternalHazardWarning, ProviderHealthStatus } from './types.js';
import { ExternalDataCache } from './cache.js';

export class HydrologyAndHazardProvider {
  private gaugeCache = new ExternalDataCache<RiverGaugeReport[]>(15 * 60 * 1000);
  private hazardCache = new ExternalDataCache<ExternalHazardWarning[]>(10 * 60 * 1000);
  private requestsCount = 0;
  private errorsCount = 0;
  private lastSuccess: string | null = null;
  private lastError: string | null = null;
  private lastLatencyMs: number | null = null;
  private lastDataIsModeled = false;

  /**
   * Generates deterministic simulated baseline reports for regional monitoring stations.
   * Explicitly labeled as simulated baseline data with isLive: false.
   */
  public getSimulatedFallbackGauges(): RiverGaugeReport[] {
    const now = new Date().toISOString();
    return [
      {
        stationId: 'CWC-YAM-01',
        riverName: 'Yamuna River',
        locationName: 'Old Railway Bridge (Loha Pul), Delhi',
        latitude: 28.6625,
        longitude: 77.2361,
        dischargeM3s: 345.2,
        waterLevelMeters: 205.33,
        dangerLevelMeters: 205.33,
        floodStage: 'warning',
        trend: 'rising',
        source: 'Central Water Commission (CWC) Monitored Baseline (Simulated)',
        sourceAttribution: 'Central Water Commission Historical Benchmark (Offline Demonstration)',
        updatedAt: now,
        isLive: false,
        telemetryType: 'simulated',
        dischargeStatus: 'simulated',
        dischargeIsLive: false,
        waterLevelStatus: 'simulated',
        waterLevelIsLive: false,
        floodStageStatus: 'simulated',
        floodStageIsLive: false,
        trendIsLive: false,
        isModeled: false,
        isSimulated: true,
        modelRunTimestamp: null,
        sensorObservationTimestamp: null
      },
      {
        stationId: 'CWC-HIND-02',
        riverName: 'Hindon River',
        locationName: 'Ghaziabad Barrage Station',
        latitude: 28.6720,
        longitude: 77.4120,
        dischargeM3s: 112.5,
        waterLevelMeters: 198.80,
        dangerLevelMeters: 201.00,
        floodStage: 'watch',
        trend: 'steady',
        source: 'Central Water Commission (CWC) Monitored Baseline (Simulated)',
        sourceAttribution: 'State Irrigation & Flood Control Dept Baseline Model',
        updatedAt: now,
        isLive: false,
        telemetryType: 'simulated',
        dischargeStatus: 'simulated',
        dischargeIsLive: false,
        waterLevelStatus: 'simulated',
        waterLevelIsLive: false,
        floodStageStatus: 'simulated',
        floodStageIsLive: false,
        trendIsLive: false,
        isModeled: false,
        isSimulated: true,
        modelRunTimestamp: null,
        sensorObservationTimestamp: null
      },
      {
        stationId: 'CWC-NAJAF-03',
        riverName: 'Najafgarh Basin Channel',
        locationName: 'Kakrola Regulator Station',
        latitude: 28.6145,
        longitude: 77.0320,
        dischargeM3s: 58.4,
        waterLevelMeters: 210.15,
        dangerLevelMeters: 212.00,
        floodStage: 'normal',
        trend: 'falling',
        source: 'Delhi Jal Board Hydrological Station Baseline (Simulated)',
        sourceAttribution: 'Delhi Jal Board & Flood Control Baseline Model',
        updatedAt: now,
        isLive: false,
        telemetryType: 'simulated',
        dischargeStatus: 'simulated',
        dischargeIsLive: false,
        waterLevelStatus: 'simulated',
        waterLevelIsLive: false,
        floodStageStatus: 'simulated',
        floodStageIsLive: false,
        trendIsLive: false,
        isModeled: false,
        isSimulated: true,
        modelRunTimestamp: null,
        sensorObservationTimestamp: null
      }
    ];
  }

  /**
   * Retrieves operational river gauge telemetry.
   * Clearly separates live modeled river discharge (Copernicus GloFAS via Open-Meteo)
   * from static reference baselines (CWC water level marks & danger thresholds).
   * Fallback hydrology measurements are never reported as live.
   */
  public async getRiverGauges(): Promise<RiverGaugeReport[]> {
    const cacheKey = 'cwc:river_gauges';
    const cached = this.gaugeCache.get(cacheKey);
    if (cached && !cached.isStale) {
      return cached.data;
    }

    this.requestsCount++;
    const start = Date.now();
    const now = new Date().toISOString();

    try {
      const floodApiUrl = process.env.FLOOD_API_URL || 'https://flood-api.open-meteo.com/v1/flood';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = new URL(floodApiUrl);
      url.searchParams.set('latitude', '28.66');
      url.searchParams.set('longitude', '77.23');
      url.searchParams.set('daily', 'river_discharge');

      let liveDischarge = 345.2; // default reference m3/s
      let isModeled = false;
      let modelTimestamp: string | null = null;

      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as any;
          if (data && data.daily && Array.isArray(data.daily.river_discharge) && data.daily.river_discharge.length > 0) {
            liveDischarge = Number(data.daily.river_discharge[0]) || liveDischarge;
            isModeled = true;
            modelTimestamp = (data.daily.time && data.daily.time[0]) ? `${data.daily.time[0]}T00:00:00.000Z` : now;
          }
        }
      } catch {
        // Fall back gracefully to monitored baseline station readings
      }

      this.lastDataIsModeled = isModeled;

      const gauges: RiverGaugeReport[] = [
        {
          stationId: 'CWC-YAM-01',
          riverName: 'Yamuna River',
          locationName: 'Old Railway Bridge (Loha Pul), Delhi',
          latitude: 28.6625,
          longitude: 77.2361,
          dischargeM3s: liveDischarge,
          waterLevelMeters: 205.33,
          dangerLevelMeters: 205.33,
          floodStage: 'warning',
          trend: 'rising',
          source: isModeled 
            ? 'Copernicus GloFAS Hydrological Model (Runoff) & CWC Baseline (Elevation)' 
            : 'Central Water Commission (CWC) Monitored Baseline (Simulated)',
          sourceAttribution: isModeled
            ? 'Copernicus Emergency Management Service (GloFAS via Open-Meteo) / Central Water Commission Historical Gauge Reference'
            : 'Central Water Commission Baseline Model (Offline Demonstration)',
          updatedAt: now,
          isLive: false, // Station has no live physical in-situ IoT stream; discharge is modeled forecast
          telemetryType: isModeled ? 'live_modeled' : 'simulated',
          dischargeStatus: isModeled ? 'live_modeled' : 'simulated',
          dischargeIsLive: false, // Modeled numerical runoff forecast, not in-situ Doppler telemetry
          waterLevelStatus: isModeled ? 'reference_baseline' : 'simulated',
          waterLevelIsLive: false, // Reference historical benchmark, never claimed as live observation
          floodStageStatus: isModeled ? 'estimated_from_baseline' : 'simulated',
          floodStageIsLive: false,
          trendIsLive: false,
          isModeled,
          isSimulated: !isModeled,
          modelRunTimestamp: modelTimestamp,
          sensorObservationTimestamp: null
        },
        {
          stationId: 'CWC-HIND-02',
          riverName: 'Hindon River',
          locationName: 'Ghaziabad Barrage Station',
          latitude: 28.6720,
          longitude: 77.4120,
          dischargeM3s: 112.5,
          waterLevelMeters: 198.80,
          dangerLevelMeters: 201.00,
          floodStage: 'watch',
          trend: 'steady',
          source: 'Central Water Commission (CWC) Monitored Baseline (Simulated)',
          sourceAttribution: 'State Irrigation & Flood Control Dept Baseline Model',
          updatedAt: now,
          isLive: false,
          telemetryType: 'simulated',
          dischargeStatus: 'simulated',
          dischargeIsLive: false,
          waterLevelStatus: 'simulated',
          waterLevelIsLive: false,
          floodStageStatus: 'simulated',
          floodStageIsLive: false,
          trendIsLive: false,
          isModeled: false,
          isSimulated: true,
          modelRunTimestamp: null,
          sensorObservationTimestamp: null
        },
        {
          stationId: 'CWC-NAJAF-03',
          riverName: 'Najafgarh Basin Channel',
          locationName: 'Kakrola Regulator Station',
          latitude: 28.6145,
          longitude: 77.0320,
          dischargeM3s: 58.4,
          waterLevelMeters: 210.15,
          dangerLevelMeters: 212.00,
          floodStage: 'normal',
          trend: 'falling',
          source: 'Delhi Jal Board Hydrological Station Baseline (Simulated)',
          sourceAttribution: 'Delhi Jal Board & Flood Control Baseline Model',
          updatedAt: now,
          isLive: false,
          telemetryType: 'simulated',
          dischargeStatus: 'simulated',
          dischargeIsLive: false,
          waterLevelStatus: 'simulated',
          waterLevelIsLive: false,
          floodStageStatus: 'simulated',
          floodStageIsLive: false,
          trendIsLive: false,
          isModeled: false,
          isSimulated: true,
          modelRunTimestamp: null,
          sensorObservationTimestamp: null
        }
      ];

      this.lastLatencyMs = Date.now() - start;
      this.lastSuccess = now;
      this.gaugeCache.set(cacheKey, gauges);
      return gauges;
    } catch (err: any) {
      this.errorsCount++;
      this.lastError = err.message;
      if (cached) return cached.data;
      throw err;
    }
  }

  /**
   * Retrieves active external hazard warnings for drill and response exercises.
   * Strictly marked as simulated exercise data (isLive: false, verificationStatus: 'simulated_drill').
   * Never fabricates active government bulletins or real-world emergency directives.
   */
  public async getExternalHazardWarnings(): Promise<ExternalHazardWarning[]> {
    const cacheKey = 'met:hazard_warnings';
    const cached = this.hazardCache.get(cacheKey);
    if (cached && !cached.isStale) {
      return cached.data;
    }

    const now = new Date();
    const issuedAt = new Date(now.getTime() - 45 * 60 * 1000).toISOString();
    const expiresAt = new Date(now.getTime() + 18 * 3600 * 1000).toISOString();

    const warnings: ExternalHazardWarning[] = [
      {
        id: 'WARN-MET-2026-089',
        hazardType: 'heavy_rain',
        severity: 'warning',
        headline: 'Demonstration Drill Advisory: Intense Precipitation in Low-Lying NCR Basins (Simulated)',
        description: 'Simulated exercise scenario: heavy rainfall (65mm - 115mm in 24h) modeled across NCR transit corridors for disaster preparedness drill.',
        affectedRegion: 'Delhi NCT, Noida, Gurugram Metropolitan Region',
        coordinates: [28.6139, 77.2090],
        issuedAt,
        expiresAt,
        issuingAgency: 'Regional Meteorological Centre (IMD New Delhi) [Simulation Exercise]',
        source: 'RakshaGrid Multi-Hazard Exercise Simulation Feed (Simulated Demonstration)',
        sourceAttribution: 'IMD / CWC Baseline Meteorological Scenario for Exercise & Training',
        isLive: false,
        isSimulated: true,
        telemetryType: 'simulated',
        verificationStatus: 'simulated_drill',
        simulationNotice: 'EXERCISE / SIMULATION ONLY — Not an active real-world government emergency bulletin'
      },
      {
        id: 'WARN-MET-2026-090',
        hazardType: 'flood',
        severity: 'watch',
        headline: 'Demonstration Drill Advisory: Yamuna Floodplain Upstream Inflow (Simulated)',
        description: 'Simulated exercise scenario: water discharge exceeding 1,20,000 cusecs modeled from Hathnikund Barrage for flood response testing.',
        affectedRegion: 'Yamuna Floodplain Zone O (Kashmere Gate to Okhla Barrage)',
        coordinates: [28.6625, 77.2361],
        issuedAt,
        expiresAt,
        issuingAgency: 'Central Water Commission (CWC) Flood Forecasting Division [Simulation Exercise]',
        source: 'RakshaGrid Multi-Hazard Exercise Simulation Feed (Simulated Demonstration)',
        sourceAttribution: 'Central Water Commission Flood Forecasting Model Scenario for Exercise & Training',
        isLive: false,
        isSimulated: true,
        telemetryType: 'simulated',
        verificationStatus: 'simulated_drill',
        simulationNotice: 'EXERCISE / SIMULATION ONLY — Not an active real-world government emergency bulletin'
      }
    ];

    this.hazardCache.set(cacheKey, warnings);
    return warnings;
  }

  /**
   * Clears telemetry and hazard caches for testing and state reset.
   */
  public clearCache(): void {
    this.gaugeCache.clear();
    this.hazardCache.clear();
  }

  public getHealth(): ProviderHealthStatus {
    const stats = this.gaugeCache.getStats();
    const status: ProviderHealthStatus['status'] = this.errorsCount > 0 
      ? 'degraded' 
      : this.lastDataIsModeled 
      ? 'operational' 
      : 'simulated';

    return {
      providerName: 'Central Hydrological & Flood Telemetry Engine',
      serviceType: 'hydrology',
      status,
      isLive: false, // In-situ physical IoT sensors are not connected; discharge uses Copernicus GloFAS numerical forecast model
      telemetryType: this.lastDataIsModeled ? 'live_modeled' : 'simulated',
      lastSuccess: this.lastSuccess,
      lastError: this.lastError,
      latencyMs: this.lastLatencyMs,
      requestsCount: this.requestsCount,
      errorsCount: this.errorsCount,
      cachedEntriesCount: stats.size,
      sourceAttribution: 'Copernicus GloFAS Hydrological Model & Central Water Commission Baseline'
    };
  }
}

export const hydrologyAndHazard = new HydrologyAndHazardProvider();
