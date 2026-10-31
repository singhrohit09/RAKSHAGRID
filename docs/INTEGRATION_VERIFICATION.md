# RakshaGrid — Integration Verification & Telemetry Audit

This document details the functional verification, integration testing, error handling, and provenance guarantees across all internal and external subsystems of **RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform**.

---

## 1. External Weather Integration (Open-Meteo)

### 1.1 Architecture & Implementation
- **Provider**: `OpenMeteoWeatherProvider` in `server/services/external/openMeteoProvider.ts`.
- **Endpoint**: `GET /api/external/weather?lat=<lat>&lng=<lng>`
- **Telemetry Parameters**: 2-meter air temperature (`temperature_2m`), apparent temperature, relative humidity, precipitation rate, WMO weather interpretation code, 10-meter wind velocity, wind direction, and maximum gusts.

### 1.2 Caching & Stale-Data Resilience
- **In-Memory Cache TTL**: 10 minutes (`ExternalDataCache<NormalizedWeatherReport>`).
- **Offline / Network Outage Fallback**: If Open-Meteo is unreachable or times out (>5000ms), the provider returns cached telemetry with `isStale: true` and logs provider health as `"cached"` or `"offline"`.
- **Zero Hallucination Rule**: Cached or simulated fallback data is explicitly stamped with `isLive: false`, `isStale: true`, and the exact UTC timestamp of the last valid fetch.

### 1.3 Verified Test Cases (Passed 100%):
- `GET /api/external/weather` with valid coordinates returns normalized telemetry.
- Coordinates outside valid ranges (`lat: -91` or `lng: 181`) return HTTP 400 with descriptive error.
- Rapid repeated calls return cached telemetry without triggering external upstream rate limits.

---

## 2. River Gauge Hydrology & Flood Stage Telemetry

### 2.1 Architecture & Implementation
- **Provider**: `HydrologyAndHazardProvider` in `server/services/external/hydrologyProvider.ts`.
- **Endpoint**: `GET /api/external/river-gauges`
- **Telemetry Metrics**: Real-time river discharge rate ($m^3/s$), water level relative to datum ($m$), danger level threshold ($m$), flood stage classification (`normal`, `watch`, `warning`, `severe`, `inundation`), and flow trend (`rising`, `steady`, `falling`).

### 2.2 Telemetry Truthfulness & Labeling
- River telemetry adapters report both adapter operational status and data source provenance.
- In environments where live telemetry from CWC telemetry stations is simulated, every payload contains:
  ```json
  {
    "source": "Central Water Commission Telemetry Gauge Network (Simulated)",
    "isLive": false
  }
  ```
  The platform strictly distinguishes real upstream telemetry from simulated flood models.

---

## 3. Multi-Channel Notification & Deduplication System

### 3.1 Multi-Channel Dispatch
RakshaGrid routes emergency broadcasts through 3 distinct delivery channels:
1. **In-App Persistent Notifications**: Stored in `notifications` SQL table and broadcast to active client sessions.
2. **Webhook Dispatch**: HTTP POST payloads with HMAC signatures dispatched to municipal EOC endpoints.
3. **SMS Alert Simulation**: Logged in `notification_deliveries` ledger with delivery status and retry counters.

### 3.2 Deduplication Guarantees
- Emergency alert broadcasts generate unique idempotency hashes: `sha256(recipient + channel + title + severity)`.
- Duplicate notifications arriving within the deduplication window (default 5 minutes) are discarded before dispatch.
- Active deduplication keys are tracked and surfaced via `GET /api/system/health`.

---

## 4. GIS Geofencing & Spatial Intelligence Engine

### 4.1 Algorithms & Precision
- **Point-in-Polygon (PIP)**: Optimized ray-casting algorithm in `server/services/gis/geofenceEngine.ts`.
- **Spatial Pruning**: Bounding-box minimum-bounding-rectangle (MBR) pre-filtering to eliminate distant incident points in $O(1)$ time before computing polygon edge intersections.
- **Geodesic Distance**: Haversine formula for spherical distance calculations across circular geofences.

### 4.2 Verified Spatial Test Cases:
- Exact coordinate inside polygon returns `isInside: true`.
- Exact coordinate outside polygon returns `isInside: false`.
- Boundary edge points evaluate safely without divide-by-zero or floating point overflow errors.

---

## 5. Multi-Agent AI Decision Intelligence

### 5.1 Orchestrator & Deterministic Fallback Engine
- `orchestrator.ts` coordinates all 5 specialized agents.
- When external LLM APIs (OpenAI, Anthropic, Gemini) are unconfigured or offline, RakshaGrid seamlessly runs the internal **Rule-Based Intelligence Engine**, ensuring disaster command centers remain fully functional in completely air-gapped field scenarios.

### 5.2 Verification Matrix:

| Agent | Purpose | Verification Result |
|-------|---------|---------------------|
| **Agent 1: Disaster Risk** | Multi-hazard risk scoring | Verified (Score 0-100, provenance tags) |
| **Agent 2: Incident Prioritization** | Queue ranking (P1-P4) | Verified (Quantitative prioritization index) |
| **Agent 3: Resource Allocation** | Equipment & team matching | Verified (Pending commander approval) |
| **Agent 4: Response Coordinator** | 3-phase action plan | Verified (Immediate, short, extended phases) |
| **Agent 5: Disaster Simulation** | Stress simulation sandbox | Verified (100% anti-mutation isolation) |

---

## 6. Dual-Database Engine Persistence

### 6.1 Dialect Compatibility
Both SQLite (`better-sqlite3`) and PostgreSQL (`pg.Pool`) are verified:
- All schema tables and secondary indices use portable ANSI SQL (`IF NOT EXISTS`).
- Queries using positional parameters (`?`) are dynamically translated to PostgreSQL index parameters (`$1`, `$2`, etc.) by `DatabaseClient`.
- Transactions correctly utilize `AsyncLocalStorage<pg.PoolClient>` in PostgreSQL and `BEGIN IMMEDIATE` in SQLite.
- `GET /api/system/health` and `GET /api/system/metrics` correctly report the active database dialect (`sqlite` or `postgres`).
