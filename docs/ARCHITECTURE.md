# RakshaGrid Architecture Documentation (Phase 3 Full-Stack & GIS Integration)

## System Overview

**RakshaGrid** is a specialized disaster intelligence and coordinated emergency operations platform. It is engineered to give Emergency Operations Centers (EOC), Incident Commanders, and field relief authorities real-time situational awareness, tactical coordination tools, resource logistics tracking, spatial geofencing analysis, and multi-channel alerting during major emergencies.

Phase 3 elevates the platform into a live, data-integrated emergency coordination network with external meteorological integrations, a server-side GIS geofencing engine, multi-channel notification routing, and concurrency-safe transactional workflows.

```
                           +--------------------------------------+
                           |        Browser User Interface        |
                           +--------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         +-----------------------+                         +-----------------------+
         | Internal Ops Shell    |                         | Public Bulletin Portal|
         | (/dashboard, /map,    |                         | (/public)             |
         |  /incidents, /teams,  |                         | Public warnings,      |
         |  /shelters, /tasks...) |                         | shelter info, guides  |
         +-----------------------+                         +-----------------------+
                     \                                                 /
                      \-----------------------+-----------------------/
                                              |
                                              v
                              +-------------------------------+
                              |     RakshaGrid Data Store     |
                              |  (React Context + API Client) |
                              +-------------------------------+
                                              |
                         +--------------------+--------------------+
                         |                                         |
     (When Offline / Demo Mode)                           (When Online)
                         |                                         |
                         v                                         v
         +-------------------------------+         +-------------------------------+
         |    Versioned LocalStorage     |         |     Express REST API Layer    |
         |  Schema: rakshagrid_state_v1  |         |   (Port 5000 /api endpoints)  |
         +-------------------------------+         +-------------------------------+
                                                                   |
                                            +----------------------+----------------------+
                                            |                      |                      |
                                            v                      v                      v
                                 +--------------------+ +--------------------+ +--------------------+
                                 | JWT Session Auth & | | External Weather & | | GIS Geofencing &   |
                                 | RBAC Matrix (5)    | | Hydrology Feeds    | | Spatial Analysis   |
                                 +--------------------+ +--------------------+ +--------------------+
                                            |                      |                      |
                                            +----------------------+----------------------+
                                                                   |
                                                                   v
                                                   +-------------------------------+
                                                   |  Multichannel Alert Dispatch  |
                                                   | (In-App, Webhook, SMS Sim)    |
                                                   +-------------------------------+
                                                                   |
                                                                   v
                                                   +-------------------------------+
                                                   |    Relational Database Layer  |
                                                   |  (PostgreSQL || SQLite (WAL)) |
                                                   | 13 Normalized Tables + Audit  |
                                                   +-------------------------------+
```

---

## 1. External Weather & Hydrological Telemetry Layer

### A. Provider Interface & Model Normalization
External data ingestion is managed via a pluggable provider pattern (`server/services/external/`):
- `NormalizedWeatherReport`: Standardized telemetry format across all sources (temperature, apparent temperature, relative humidity, wind speed, wind direction, precipitation, WMO code, condition categorization, and source attribution).
- `RiverGaugeReport`: Water levels, danger thresholds, discharge rates (`m³/s`), and flood stages (`normal`, `watch`, `warning`, `severe`, `inundation`).
- `ProviderHealthStatus`: Metrics tracking provider uptime, latency in milliseconds, error counts, and live vs. simulated status.

### B. Open-Meteo Integration
- Connects to the public Open-Meteo API (`https://api.open-meteo.com/v1/forecast`) for real-time weather observations.
- Configured with a 5,000 ms request timeout.
- Automatic WMO code normalization translating numerical weather codes (0–99) to standardized disaster severity categories (`normal`, `advisory`, `warning`, `critical`).
- If network requests fail or time out, the system automatically falls back to an offline simulated baseline while setting `isLive: false` and `source: 'RakshaGrid Development Offline Baseline (Simulated)'`.

### C. In-Memory Cache with Stale-While-Revalidate (SWR)
- `server/services/external/cache.ts` manages telemetry caching with configurable TTL (default 10 minutes).
- Requests within TTL return immediately from cache (`HIT`).
- If an entry expires, it is served stale while an asynchronous background refresh is dispatched (`SWR`), preventing latency spikes during emergency operations.

---

## 2. GIS Geofencing & Spatial Intelligence Engine

### A. Mathematical Foundations (`server/services/gis/geofenceEngine.ts`)
The spatial intelligence engine performs server-side geospatial evaluation without external spatial database extensions:
1. **Ray-Casting Algorithm for Point-in-Polygon (PIP)**:
   - For an arbitrary polygon defined by coordinates \([(lat_1, lng_1), (lat_2, lng_2), \dots, (lat_n, lng_n)]\), a horizontal semi-infinite ray is cast from test point \(P(lat, lng)\).
   - If the ray intersects the polygon boundary an odd number of times, \(P\) is strictly contained inside the polygon.
   - Handles edge cases including vertices and collinear horizontal segments safely.
2. **Haversine Spherical Distance for Circular Zones**:
   \[
   a = \sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_1) \cdot \cos(lat_2) \cdot \sin^2\left(\frac{\Delta lng}{2}\right)
   \]
   \[
   d = 2 \cdot R \cdot \arcsin\left(\sqrt{a}\right) \quad (R = 6,371,000 \text{ meters})
   \]
   Point \(P\) is contained in circle \(C\) if \(d \le C.radiusMeters\).

### B. Dynamic Containment Evaluation
The evaluator runs on demand or automatically during incident updates (`GET /api/geofences/eval`):
- Cross-references all active geofence zones against active incidents, shelters, and field response teams.
- Generates bidirectional lookup maps: `incidentZoneMap` and `shelterZoneMap`.
- If an incident falls inside an active high-severity geofence, the system automatically triggers containment warnings and can dispatch automated multichannel alerts.

---

## 3. Multichannel Alert & Notification Infrastructure

### A. Provider Pattern Architecture
The notification hub (`server/services/notifications/`) decouples notification creation from delivery channels:
- `InAppNotificationProvider`: Writes persistent alert records to the `notifications` table for real-time client polling.
- `WebhookNotificationProvider`: Delivers JSON payloads via HTTP POST to registered external endpoints (e.g. Civil Defense EOCs, municipal portals).
- `SimulatedTelecommProvider`: Simulates SMS/Cell Broadcast transmission, recording simulated carrier handshakes and latency in `notification_deliveries`.

### B. Sliding-Window Deduplication Cache
- Prevents notification storms during mass-casualty incidents.
- A sliding-window cache tracks composite keys `[channel:recipient:fingerprint]`. Duplicate alerts within the debounce window (default 300 seconds) are suppressed, logging a deduplication event in the audit trail.

---

## 4. Emergency Coordination & Concurrency Controls

### A. Concurrency-Safe Transactional Inventory Allocation
- Resource allocations execute in atomic transactions (`BEGIN IMMEDIATE` in SQLite, serializable transactions in PostgreSQL).
- Verifies current available depot stock immediately before decrementing, preventing race conditions when multiple logistics officers allocate from the same depot simultaneously.

### B. Shelter Capacity Override Tracking
- Enforces safe capacity ceilings.
- If occupancy exceeds 100% capacity, the server strictly requires an `overrideReason` parameter, recording the justification in the audit ledger and tagging the shelter response with `isOverflow: true`.

### C. Incident Escalation & Response Unit Lifecycle
- `POST /api/incidents/:id/escalate`: Atomically upgrades incident severity and priority, appends an escalation event to the incident timeline, and broadcasts emergency notifications.
- Assigning a response team to an active incident automatically transitions the team status from `'Available'` to `'Deployed'`.
- Resolving or closing an incident automatically returns assigned teams to `'Available'`.

### D. Deep System Health Telemetry
- `GET /api/system/health`: Reports end-to-end health metrics including database query latency, weather provider status, river gauge telemetry freshness, and active deduplication counts.

---

## 5. Normalized Relational Database Schema (13 Tables)

```sql
users (id, email, password_hash, name, role, department, callsign, phone, is_active, created_at, updated_at)
teams (id, name, type, status, staff_count, skills_json, latitude, longitude, home_base, current_assignment, contact_callsign, contact_phone, created_at, updated_at)
shelters (id, name, address, region, latitude, longitude, capacity, current_occupancy, status, facilities_json, notes, created_at, updated_at)
resources (id, name, category, quantity_available, quantity_allocated, unit, status, min_threshold, depot_location, notes, created_at, updated_at)
inventory_movements (id, resource_id, movement_type, quantity, actor_id, actor_name, incident_id, shelter_id, notes, created_at)
incidents (id, title, description, category, severity, status, priority, location_name, latitude, longitude, assigned_team_id, assigned_team_name, affected_population, casualties, estimated_radius_meters, reported_at, updated_at)
incident_timeline (id, incident_id, timestamp, actor, note, type)
tasks (id, title, description, status, priority, due_date, assigned_team_id, assigned_team_name, incident_id, incident_title, created_at, updated_at)
alerts (id, type, title, body, severity, status, target_region, affected_count, approved_by, approved_at, broadcast_at, created_at)
audit_events (id, timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, description, metadata_json)
password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
geofences (id, name, category, severity, status, shape_type, center_latitude, center_longitude, radius_meters, coordinates_json, description, created_by, created_at, updated_at)
notification_deliveries (id, notification_id, channel, recipient, status, attempts, error_message, delivered_at, created_at)
system_settings (id, key, value, updated_at)
```
