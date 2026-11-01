import test from 'node:test';
import assert from 'node:assert/strict';
import { SpatialAnalysisService, VERIFIED_HAZARD_ZONES } from '../services/geospatial/spatialAnalysis.service';
import { WeatherProvider } from '../services/external/weatherProvider';
import { HydrologyProvider, VERIFIED_RIVER_GAUGES } from '../services/external/hydrologyProvider';
import { INITIAL_INCIDENTS, INITIAL_SHELTERS, INITIAL_TEAMS } from '../services/mockData';

test('Geospatial - calculateDistanceKm returns accurate geodesic distance between coordinates', () => {
  // Distance between Delhi (28.6139, 77.2090) and Mumbai (19.0760, 72.8777) is approximately 1148 km
  const dist = SpatialAnalysisService.calculateDistanceKm(28.6139, 77.209, 19.076, 72.8777);
  assert.ok(dist > 1100 && dist < 1200, `Expected ~1148 km, got ${dist} km`);

  // Distance between same point should be 0
  const zeroDist = SpatialAnalysisService.calculateDistanceKm(28.6139, 77.209, 28.6139, 77.209);
  assert.equal(zeroDist, 0);
});

test('Geospatial - generateProximityCircle produces a closed polygon ring with Turf.js', () => {
  const circle = SpatialAnalysisService.generateProximityCircle(26.1833, 91.7333, 25);
  assert.ok(circle.length > 20, 'Circle should have at least 20 vertex points');

  // Verify it is a closed ring: first vertex should equal last vertex
  const [firstLat, firstLng] = circle[0];
  const [lastLat, lastLng] = circle[circle.length - 1];
  assert.ok(Math.abs(firstLat - lastLat) < 0.0001, 'Latitude of first and last vertex must match');
  assert.ok(Math.abs(firstLng - lastLng) < 0.0001, 'Longitude of first and last vertex must match');
});

test('Geospatial - analyzeIncidentProximity sorts shelters and teams by proximity', () => {
  const incident = INITIAL_INCIDENTS[0];
  const analysis = SpatialAnalysisService.analyzeIncidentProximity(
    incident,
    INITIAL_SHELTERS,
    INITIAL_TEAMS,
    30
  );

  assert.equal(analysis.incidentId, incident.id);
  assert.ok(analysis.nearbyShelters.length > 0, 'Should find nearby shelters');
  assert.ok(analysis.nearbyTeams.length > 0, 'Should find nearby teams');

  // Shelters must be sorted ascending by distance
  for (let i = 1; i < analysis.nearbyShelters.length; i++) {
    assert.ok(
      analysis.nearbyShelters[i].distanceKm >= analysis.nearbyShelters[i - 1].distanceKm,
      'Shelters must be sorted in ascending order of distance'
    );
  }

  // Available capacity should be capacity - currentOccupancy
  for (const item of analysis.nearbyShelters) {
    const expectedAvail = Math.max(0, item.shelter.capacity - item.shelter.currentOccupancy);
    assert.equal(item.availableCapacity, expectedAvail);
  }
});

test('Geospatial - Point-in-polygon correctly evaluates point containment in hazard zones', () => {
  const zone = VERIFIED_HAZARD_ZONES[0]; // Brahmaputra Lowland Inundation Sector
  // Point inside the zone [26.25, 92.00]
  const isInside = SpatialAnalysisService.isPointInZone(26.25, 92.0, zone.coordinates);
  assert.equal(isInside, true, 'Point (26.25, 92.00) should be inside Brahmaputra flood polygon');

  // Point far away (e.g. Mumbai [19.07, 72.87])
  const isOutside = SpatialAnalysisService.isPointInZone(19.07, 72.87, zone.coordinates);
  assert.equal(isOutside, false, 'Point (19.07, 72.87) should NOT be inside Assam flood polygon');
});

test('Hydrology - Verified river gauges have valid thresholds (Danger > Warning)', () => {
  assert.ok(VERIFIED_RIVER_GAUGES.length >= 6, 'Should have at least 6 verified river gauges');
  for (const gauge of VERIFIED_RIVER_GAUGES) {
    assert.ok(gauge.dangerLevelMeters > gauge.warningLevelMeters, `Danger level must exceed warning level for ${gauge.stationName}`);
    assert.ok(gauge.hflMeters >= gauge.dangerLevelMeters, `HFL must be >= danger level for ${gauge.stationName}`);
    assert.ok(gauge.latitude >= -90 && gauge.latitude <= 90);
    assert.ok(gauge.longitude >= -180 && gauge.longitude <= 180);
  }
});

test('Weather - Fallback weather baseline conforms to telemetry contract', async () => {
  // Test offline/fallback path
  const weather = await WeatherProvider.getWeather(26.1833, 91.7333, 'Guwahati Test Zone');
  assert.ok(weather.locationName, 'Must have location name');
  assert.ok(typeof weather.temperatureC === 'number');
  assert.ok(typeof weather.relativeHumidityPercent === 'number');
  assert.ok(typeof weather.precipitationMm === 'number');
  assert.ok(typeof weather.windSpeedKmh === 'number');
  assert.ok(['CURRENT_OBSERVATION', 'MODEL_FORECAST'].includes(weather.classification));
  assert.ok(weather.observedAt);
  assert.ok(weather.provider.includes('Open-Meteo'));
});
