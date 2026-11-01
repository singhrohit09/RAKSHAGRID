-- RAKSHAGRID PHASE 3: GEOSPATIAL INTELLIGENCE & REAL-TIME DISASTER MONITORING MIGRATION
-- Compatible with Supabase PostgreSQL and PostGIS extensions

-- Enable PostGIS extension if available
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. TELEMETRY SOURCES
CREATE TABLE IF NOT EXISTS public.telemetry_sources (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('weather', 'hydrology', 'seismic', 'gis')),
    endpoint_identifier TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'DEGRADED', 'UNAVAILABLE')),
    last_ping_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active telemetry sources
CREATE INDEX IF NOT EXISTS idx_telemetry_sources_type ON public.telemetry_sources (source_type, enabled);

-- 2. WEATHER OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.weather_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_name TEXT NOT NULL DEFAULT 'Disaster Monitoring Point',
    temperature DOUBLE PRECISION NOT NULL,
    relative_humidity INTEGER,
    precipitation DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    wind_speed DOUBLE PRECISION,
    wind_direction INTEGER,
    weather_code INTEGER NOT NULL,
    weather_condition TEXT NOT NULL,
    observation_type TEXT NOT NULL CHECK (observation_type IN ('CURRENT_OBSERVATION', 'MODEL_FORECAST', 'HISTORICAL_DATA', 'UNAVAILABLE')),
    provider TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    retrieved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_observations_coords ON public.weather_observations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_observations_observed_at ON public.weather_observations (observed_at DESC);

-- 3. HYDROLOGY OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.hydrology_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    river_name TEXT NOT NULL,
    station_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    discharge_m3s DOUBLE PRECISION,
    water_level_meters DOUBLE PRECISION,
    warning_level_meters DOUBLE PRECISION,
    danger_level_meters DOUBLE PRECISION,
    hfl_meters DOUBLE PRECISION,
    status TEXT NOT NULL CHECK (status IN ('NORMAL', 'WARNING', 'DANGER', 'RECORD_HIGH')),
    data_type TEXT NOT NULL CHECK (data_type IN ('LIVE_SENSOR_TELEMETRY', 'LIVE_MODELED_DATA', 'FORECAST_DATA', 'REFERENCE_BASELINE', 'SIMULATED_DEMO_DATA', 'UNAVAILABLE')),
    provider TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    retrieved_at TIMESTAMPTZ DEFAULT NOW(),
    provenance_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_hydrology_observations_river ON public.hydrology_observations (river_name, status);
CREATE INDEX IF NOT EXISTS idx_hydrology_observations_coords ON public.hydrology_observations (latitude, longitude);

-- 4. GEOSPATIAL ZONES (HAZARD BOUNDARIES & PROXIMITY SECTORS)
CREATE TABLE IF NOT EXISTS public.geospatial_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN ('VERIFIED_FLOOD_INUNDATION', 'CYCLONE_WARNING_CONE', 'LANDSLIDE_HIGH_HAZARD', 'INDUSTRIAL_CONTAINMENT', 'ANALYTICAL_PROXIMITY_BUFFER')),
    provenance TEXT NOT NULL CHECK (provenance IN ('VERIFIED_OFFICIAL_DATASET', 'ANALYTICAL_PROXIMITY_BUFFER', 'ILLUSTRATIVE_DEMO_ZONE')),
    source_attribution TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'advisory')),
    coordinates JSONB NOT NULL, -- Array of [lat, lng] vertices
    valid_until TIMESTAMPTZ,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geospatial_zones_type_sev ON public.geospatial_zones (zone_type, severity);

-- Row Level Security (RLS) Policies
ALTER TABLE public.telemetry_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydrology_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geospatial_zones ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and operational readers
CREATE POLICY "Allow public read access to weather observations"
    ON public.weather_observations FOR SELECT USING (true);

CREATE POLICY "Allow public read access to hydrology observations"
    ON public.hydrology_observations FOR SELECT USING (true);

CREATE POLICY "Allow public read access to geospatial zones"
    ON public.geospatial_zones FOR SELECT USING (true);

CREATE POLICY "Allow authenticated read access to telemetry sources"
    ON public.telemetry_sources FOR SELECT TO authenticated USING (true);
