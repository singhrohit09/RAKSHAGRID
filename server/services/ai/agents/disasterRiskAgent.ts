import { db } from '../../../db/connection.js';
import { openMeteoWeather } from '../../external/openMeteoProvider.js';
import { hydrologyAndHazard } from '../../external/hydrologyProvider.js';
import { haversineDistanceMeters } from '../../gis/geofenceEngine.js';
import { providerFactory } from '../providers/providerFactory.js';
import { 
  DisasterRiskOutput, 
  RiskLevel, 
  AreaRiskAssessment, 
  ContributingFactor, 
  DataProvenance 
} from '../types.js';

export interface DisasterRiskInput {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  focusRegionName?: string;
}

export class DisasterRiskAgent {
  public readonly id = 'disaster_risk';
  public readonly name = 'Disaster Risk Intelligence Agent';
  public readonly role = 'Multi-Hazard Risk Assessment & Geospatial Exposure Analyzer';

  public async analyze(input?: DisasterRiskInput): Promise<DisasterRiskOutput> {
    const lat = input?.latitude ?? 28.6139;
    const lng = input?.longitude ?? 77.2090;
    const radiusKm = input?.radiusKm ?? 35;
    const nowIso = new Date().toISOString();

    const dataSources: DataProvenance[] = [];
    let isDegraded = false;
    let degradedReason: string | undefined;

    // 1. Gather Weather Telemetry
    let weatherReport: any = null;
    try {
      weatherReport = await openMeteoWeather.getWeather(lat, lng);
      dataSources.push({
        source: 'Open-Meteo Meteorological Service',
        sourceAttribution: weatherReport.sourceAttribution || 'Open-Meteo WMO Model',
        timestamp: weatherReport.fetchedAt || nowIso,
        isLive: weatherReport.isLive,
        isSimulated: !weatherReport.isLive,
        isCached: weatherReport.isCached ?? false,
        coverageArea: `Coordinates: ${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`
      });
    } catch (err: any) {
      isDegraded = true;
      degradedReason = `Live weather stream unavailable: ${err.message}`;
      weatherReport = openMeteoWeather.getSimulatedFallback(lat, lng);
      dataSources.push({
        source: 'RakshaGrid Offline Meteorological Baseline (Simulated)',
        sourceAttribution: 'Offline fallback baseline',
        timestamp: nowIso,
        isLive: false,
        isSimulated: true,
        isCached: false
      });
    }

    // 2. Gather Hydrology Telemetry
    let riverGauges: any[] = [];
    try {
      riverGauges = await hydrologyAndHazard.getRiverGauges();
      const hasLiveGauge = riverGauges.some(g => g.isLive);
      dataSources.push({
        source: hasLiveGauge ? 'Open-Meteo GloFAS & CWC Telemetry' : 'Central Water Commission (CWC) Monitored Baseline (Simulated)',
        sourceAttribution: 'Central Water Commission / GloFAS Model',
        timestamp: riverGauges[0]?.updatedAt || nowIso,
        isLive: hasLiveGauge,
        isSimulated: !hasLiveGauge,
        isCached: false,
        coverageArea: 'Yamuna & Hindon River Catchment Basins'
      });
    } catch (err) {
      riverGauges = [];
    }

    // 3. Query Active Incidents & Spatial Geofences
    const incidents = await db.query<any>(
      `SELECT id, title, category, severity, status, latitude, longitude, affected_population, reported_at 
       FROM incidents WHERE status != 'Closed'`
    );

    const geofences = await db.query<any>(
      `SELECT id, name, category, severity, status, shape_type, coordinates_json, radius_meters, center_latitude, center_longitude 
       FROM geofences WHERE status = 'Active'`
    );

    dataSources.push({
      source: 'RakshaGrid Incident Command Registry',
      sourceAttribution: 'Municipal Emergency Operations Center',
      timestamp: nowIso,
      isLive: true,
      isSimulated: false,
      isCached: false
    });

    dataSources.push({
      source: 'Operational GIS Geofence Engine',
      sourceAttribution: 'Spatial Hazard Boundary System',
      timestamp: nowIso,
      isLive: true,
      isSimulated: false,
      isCached: false
    });

    // 4. Construct Deterministic Rule-Based Assessment
    const fallbackGenerator = (): DisasterRiskOutput => {
      return this.computeDeterministicRisk(
        lat, 
        lng, 
        radiusKm, 
        weatherReport, 
        riverGauges, 
        incidents, 
        geofences, 
        dataSources, 
        isDegraded, 
        degradedReason
      );
    };

    // 5. Invoke AI Provider with Deterministic Fallback Protection
    const systemPrompt = `You are the Disaster Risk Intelligence Agent for RakshaGrid, an emergency response platform in India.
Analyze meteorological, hydrological, incident, and geofence data to compute regional disaster risk.
Guidelines:
- Never invent sensor readings or claim certainty.
- Risk levels: 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'.
- Scores: 0 to 100.
- If data is simulated, mention simulated status in contributing factors.
- Return valid JSON matching the DisasterRiskOutput schema.`;

    const userPrompt = `Operational Context:
Target Coordinates: ${lat}, ${lng} (Radius: ${radiusKm} km)
Weather: Temp ${weatherReport?.temperatureCelsius}°C, Rain ${weatherReport?.precipitationMm}mm, Wind ${weatherReport?.windSpeedKmh}km/h, Condition: ${weatherReport?.conditionText}
River Gauges: ${JSON.stringify(riverGauges.map(g => ({ station: g.stationName, stage: g.floodStage, trend: g.trend, waterLevel: g.waterLevelMeters, dangerLevel: g.dangerLevelMeters, isLive: g.isLive })))}
Active Incidents (${incidents.length}): ${JSON.stringify(incidents.map(i => ({ title: i.title, severity: i.severity, cat: i.category, lat: i.latitude, lng: i.longitude })))}
Active Geofences (${geofences.length}): ${JSON.stringify(geofences.map(g => ({ name: g.name, category: g.category, severity: g.severity })))}
Generate a structured regional disaster risk assessment.`;

    const provider = providerFactory.getActiveProvider();
    const result = await provider.generateStructuredCompletion<DisasterRiskOutput>(
      userPrompt,
      systemPrompt,
      fallbackGenerator
    );

    // Validate and guarantee baseline fields
    const output = result.data;
    output.assessmentTimestamp = nowIso;
    output.dataSources = dataSources;
    if (isDegraded) {
      output.isDegraded = true;
      output.degradedReason = degradedReason;
    }

    return output;
  }

  private computeDeterministicRisk(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    weather: any,
    gauges: any[],
    incidents: any[],
    geofences: any[],
    dataSources: DataProvenance[],
    isDegraded: boolean,
    degradedReason?: string
  ): DisasterRiskOutput {
    let baseScore = 15; // Ambient baseline
    const contributingFactors: ContributingFactor[] = [];
    const primaryFactors: string[] = [];
    const precautions: string[] = [];

    // Weather impact
    const rain = weather?.precipitationMm ?? 0;
    const wind = weather?.windSpeedKmh ?? 0;

    if (rain > 50) {
      baseScore += 35;
      contributingFactors.push({
        factor: 'Torrential Precipitation',
        weight: 0.35,
        description: `Extreme precipitation of ${rain.toFixed(1)} mm recorded; surface runoff exceeding storm drainage capacity.`,
        severity: 'critical'
      });
      primaryFactors.push('Extreme torrential rainfall');
      precautions.push('Avoid low-lying underpasses and subterranean transit routes.');
    } else if (rain > 15) {
      baseScore += 20;
      contributingFactors.push({
        factor: 'Heavy Rainfall',
        weight: 0.20,
        description: `Moderate to heavy rain of ${rain.toFixed(1)} mm observed.`,
        severity: 'high'
      });
      primaryFactors.push('Heavy atmospheric precipitation');
      precautions.push('Monitor local municipal waterlogging advisories.');
    } else if (rain > 2) {
      baseScore += 8;
      contributingFactors.push({
        factor: 'Light Precipitation',
        weight: 0.08,
        description: `Light showers of ${rain.toFixed(1)} mm.`,
        severity: 'low'
      });
    }

    if (wind > 60) {
      baseScore += 20;
      contributingFactors.push({
        factor: 'Gale Force Winds',
        weight: 0.20,
        description: `High wind gusts reaching ${wind.toFixed(1)} km/h causing structural and electrical hazard.`,
        severity: 'critical'
      });
      primaryFactors.push('High-velocity wind gusts');
      precautions.push('Secure loose roofing sheets and stay clear of aging tree canopies.');
    } else if (wind > 35) {
      baseScore += 10;
      contributingFactors.push({
        factor: 'Moderate Winds',
        weight: 0.10,
        description: `Sustained wind speeds of ${wind.toFixed(1)} km/h.`,
        severity: 'moderate'
      });
    }

    // Hydrology impact
    const highGauges = gauges.filter(g => g.floodStage === 'warning' || g.floodStage === 'danger');
    if (highGauges.length > 0) {
      const g = highGauges[0];
      baseScore += 25;
      const isSimulatedTag = g.isLive ? '' : ' (Simulated Model)';
      contributingFactors.push({
        factor: `River Gauge Surge${isSimulatedTag}`,
        weight: 0.25,
        description: `${g.stationName} reports stage '${g.floodStage.toUpperCase()}' at ${g.waterLevelMeters}m (Danger Level: ${g.dangerLevelMeters}m).`,
        severity: g.floodStage === 'danger' ? 'critical' : 'high'
      });
      primaryFactors.push(`Hydrological rise at ${g.stationName}`);
      precautions.push('Initiate pre-emptive evacuation in designated riverbed Zone O settlements.');
    }

    // Active incidents impact
    const nearbyIncidents = incidents.filter(inc => {
      if (typeof inc.latitude === 'number' && typeof inc.longitude === 'number') {
        const distMeters = haversineDistanceMeters(centerLat, centerLng, inc.latitude, inc.longitude);
        return distMeters <= radiusKm * 1000;
      }
      return true;
    });

    const criticalIncidents = nearbyIncidents.filter(i => i.severity === 'Critical');
    if (criticalIncidents.length > 0) {
      baseScore += Math.min(25, criticalIncidents.length * 10);
      contributingFactors.push({
        factor: 'Active Critical Incidents',
        weight: 0.25,
        description: `${criticalIncidents.length} critical emergency incidents ongoing in operational radius.`,
        severity: 'critical'
      });
      primaryFactors.push(`${criticalIncidents.length} ongoing critical incident(s)`);
    } else if (nearbyIncidents.length > 0) {
      baseScore += Math.min(15, nearbyIncidents.length * 3);
      contributingFactors.push({
        factor: 'Multiple Active Incidents',
        weight: 0.15,
        description: `${nearbyIncidents.length} active emergency incidents undergoing response.`,
        severity: 'moderate'
      });
    }

    // Geofences impact
    const activeRiskGeofences = geofences.filter(g => g.severity === 'Critical' || g.severity === 'High');
    if (activeRiskGeofences.length > 0) {
      baseScore += 10;
      contributingFactors.push({
        factor: 'Active Spatial Risk Zones',
        weight: 0.10,
        description: `${activeRiskGeofences.length} critical/high spatial risk geofences declared active by Incident Command.`,
        severity: 'high'
      });
      primaryFactors.push(`${activeRiskGeofences.length} active geofenced danger zones`);
    }

    // Clamp score
    const riskScore = Math.min(100, Math.max(5, Math.round(baseScore)));
    let riskLevel: RiskLevel = 'LOW';
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MODERATE';

    if (precautions.length === 0) {
      precautions.push('Maintain regular situational monitoring via RakshaGrid telemetry dashboard.');
      precautions.push('Keep quick-response rescue boats and pumping sets on standby.');
    }

    // Area-wise assessments
    const areas: AreaRiskAssessment[] = [
      {
        areaName: 'Yamuna Floodplain (Zone O)',
        latitude: 28.6650,
        longitude: 77.2320,
        radiusMeters: 4500,
        riskLevel: highGauges.length > 0 || rain > 30 ? 'HIGH' : 'MODERATE',
        riskScore: Math.min(95, riskScore + 10),
        hazardTypes: ['flood', 'heavy_rainfall'],
        contributingFactors: contributingFactors.slice(0, 2),
        recommendedPrecautions: [
          'Enforce non-entry into riparian low-water zones.',
          'Alert riverfront disaster rescue units.'
        ]
      },
      {
        areaName: 'Najafgarh Drainage Basin',
        latitude: 28.6100,
        longitude: 77.0500,
        radiusMeters: 6000,
        riskLevel: rain > 20 ? 'HIGH' : 'MODERATE',
        riskScore: Math.min(85, Math.round(riskScore * 0.9)),
        hazardTypes: ['flood'],
        contributingFactors: contributingFactors.filter(f => f.factor.includes('Precipitation')),
        recommendedPrecautions: ['Deploy heavy-duty mobile dewatering pumping stations.']
      },
      {
        areaName: 'Central Command & Ridge Sector',
        latitude: 28.6250,
        longitude: 77.1950,
        radiusMeters: 3500,
        riskLevel: 'LOW',
        riskScore: Math.max(10, Math.round(riskScore * 0.4)),
        hazardTypes: ['storm'],
        contributingFactors: [],
        recommendedPrecautions: ['Maintain logistics staging readiness.']
      }
    ];

    // Calculate confidence based on data completeness
    let confidence = 92;
    if (isDegraded) confidence -= 25;
    if (gauges.some(g => !g.isLive)) confidence -= 8; // Minor deduction for modeled hydrology

    return {
      overallRiskLevel: riskLevel,
      overallRiskScore: riskScore,
      confidenceScore: Math.max(40, confidence),
      affectedAreas: areas,
      primaryContributingFactors: primaryFactors.length > 0 ? primaryFactors : ['Normal seasonal conditions'],
      recommendedPrecautions: precautions,
      dataSources,
      assessmentTimestamp: new Date().toISOString(),
      isDegraded,
      degradedReason
    };
  }
}

export const disasterRiskAgent = new DisasterRiskAgent();
