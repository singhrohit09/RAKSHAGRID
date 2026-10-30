-- RakshaGrid Normalized Relational Schema
-- Supports both SQLite and PostgreSQL (using portable ANSI SQL types)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(255),
  callsign VARCHAR(100),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  staff_count INTEGER NOT NULL DEFAULT 1,
  skills TEXT NOT NULL,
  home_base VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Available',
  current_assignment TEXT,
  contact_callsign VARCHAR(64),
  contact_phone VARCHAR(64),
  latitude REAL NOT NULL DEFAULT 28.6139,
  longitude REAL NOT NULL DEFAULT 77.2090,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Reported',
  priority VARCHAR(16) NOT NULL DEFAULT 'P2',
  location_name VARCHAR(255) NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  reported_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  assigned_team_id VARCHAR(64) REFERENCES teams(id) ON DELETE SET NULL,
  affected_population INTEGER DEFAULT 0,
  casualties INTEGER DEFAULT 0,
  source VARCHAR(64) DEFAULT 'Manual Report',
  estimated_radius_meters INTEGER DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id VARCHAR(64) PRIMARY KEY,
  incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  actor VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  type VARCHAR(32) DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS shelters (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  region VARCHAR(255) NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  capacity INTEGER NOT NULL,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'Open',
  facilities TEXT NOT NULL,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(64),
  notes TEXT,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_allocated INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(64) NOT NULL,
  storage_location VARCHAR(255) NOT NULL,
  min_threshold INTEGER NOT NULL DEFAULT 10,
  status VARCHAR(32) NOT NULL DEFAULT 'Sufficient',
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id VARCHAR(64) PRIMARY KEY,
  resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  movement_type VARCHAR(32) NOT NULL,
  quantity INTEGER NOT NULL,
  previous_available INTEGER NOT NULL,
  new_available INTEGER NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  note TEXT,
  timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  related_incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE SET NULL,
  assigned_team_id VARCHAR(64) REFERENCES teams(id) ON DELETE SET NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'Medium',
  status VARCHAR(32) NOT NULL DEFAULT 'Ready',
  due_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  target_region VARCHAR(255) NOT NULL,
  related_incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE SET NULL,
  safety_actions TEXT NOT NULL,
  channels TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS geofences (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  shape_type VARCHAR(32) NOT NULL DEFAULT 'polygon',
  center_latitude REAL,
  center_longitude REAL,
  radius_meters INTEGER,
  coordinates_json TEXT NOT NULL,
  description TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_timeline_incident_id ON incident_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_incident ON tasks(related_incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_movements_resource ON inventory_movements(resource_id);
CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_geofences_status ON geofences(status);
CREATE INDEX IF NOT EXISTS idx_geofences_category ON geofences(category);

