# RakshaGrid — Monitoring, Observability & Operations Manual

This document defines the monitoring infrastructure, metrics endpoints, synthetic health checks, and operational runbooks for **RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform**.

---

## 1. Observability Architecture

RakshaGrid implements a three-tier observability stack engineered for high-stakes emergency coordination:

```
+-----------------------------------------------------------------------+
|                         Observability Tier                            |
+-----------------------------------------------------------------------+
| 1. Liveness & Readiness Probes  --> GET /api/health                   |
| 2. Deep System Diagnostics     --> GET /api/system/health             |
| 3. Process & Telemetry Metrics  --> GET /api/system/metrics            |
| 4. Security Audit Ledger        --> GET /api/audit (Persistent SQL)   |
| 5. Demo Environment Reset       --> POST /api/system/reset-demo       |
+-----------------------------------------------------------------------+
```

---

## 2. Health & Monitoring Endpoints

### 2.1 Basic Liveness Probe: `GET /api/health`
Used by Kubernetes liveness probes, Docker container health checks, and cloud load balancers.

- **Success (200 OK)**:
  ```json
  {
    "status": "healthy",
    "service": "RakshaGrid Operational Backend API",
    "version": "1.0.0",
    "timestamp": "2026-11-01T00:30:00.000Z",
    "database": "connected"
  }
  ```
- **Failure (500 Internal Error)**: Returns `status: "unhealthy"` if database query fails.

---

### 2.2 Deep Diagnostic Health Check: `GET /api/system/health`
Monitors end-to-end integration health across external meteorological providers, river gauge hydrology feeds, and notification delivery queues.

- **Response Attributes**:
  - `status`: `"healthy"` or `"degraded"`
  - `operationalMode`: `"LIVE_PRODUCTION"` or `"DEVELOPMENT_FULLSTACK"`
  - `database`:
    - `status`: `"connected"` or `"error"`
    - `dialect`: `"postgres"` or `"sqlite"`
    - `latencyMs`: Round-trip query latency (ms)
    - `activeIncidents`: Open incident tally
    - `activeGeofences`: Active GIS spatial zones
  - `integrations`:
    - `weather`: Open-Meteo telemetry health (`operational`, `cached`, `offline`), last success timestamp, error count.
    - `hydrology`: CWC/IMD River gauge telemetry health (`operational`, `cached`, `offline`), simulated gauge count.
    - `notifications`: Active notification providers (`in_app`, `webhook`, `sms_simulated`) and active deduplication keys.
  - `dataFreshness`:
    - `weatherLastSync`, `weatherStale`
    - `hydrologyLastSync`, `hydrologyStale`

---

### 2.3 Process & Telemetry Metrics: `GET /api/system/metrics`
Exposes real-time runtime resource utilization and database entity tallies.

- **Sample Output**:
  ```json
  {
    "status": "operational",
    "timestamp": "2026-11-01T00:30:00.000Z",
    "uptimeSeconds": 1420,
    "process": {
      "pid": 8941,
      "nodeVersion": "v20.18.0",
      "platform": "win32",
      "arch": "x64",
      "env": "production"
    },
    "memory": {
      "rssMb": 88.42,
      "heapTotalMb": 42.15,
      "heapUsedMb": 31.87,
      "externalMb": 4.12
    },
    "database": {
      "dialect": "postgres",
      "status": "operational"
    },
    "rateLimiting": {
      "mode": "in-memory-single-instance",
      "distributed": false,
      "notes": "In-memory sliding window rate limiter active..."
    },
    "telemetryCounts": {
      "incidents": 12,
      "teams": 8,
      "shelters": 6,
      "resources": 15,
      "tasks": 14,
      "alerts": 7,
      "geofences": 5,
      "aiExecutions": 24,
      "aiRecommendations": 18
    }
  }
  ```

---

## 3. Operational Runbooks

### Runbook A: Database Connectivity Degradation
- **Symptom**: `GET /api/system/health` reports HTTP 503, `"database": { "status": "error" }`.
- **Immediate Actions**:
  1. Check PostgreSQL cluster status or SQLite file lock on the host.
  2. Inspect server logs for connection pool exhaustion: `⚠️ RakshaGrid PostgreSQL Pool Client Error`.
  3. Verify connection string and pool parameters:
     ```bash
     echo $DATABASE_URL
     ```
  4. If connection pool is starved, increase `DB_POOL_MAX` (e.g., from `20` to `50`).
  5. Restart the container/service. Schema check is idempotent and reconnects automatically.

### Runbook B: External Weather or Hydrology Outage
- **Symptom**: `weatherHealth.status` or `hydroHealth.status` reports `"cached"` or `"offline"`.
- **System Behavior**:
  - The application automatically falls back to in-memory cached telemetry for up to 30 minutes.
  - The UI displays an amber badge: `STALE DATA (CACHED)` or `OFFLINE FALLBACK` with the exact timestamp of last valid sync.
  - Live operations remain functional; incident commanders are informed of telemetry provenance.
- **Remediation**:
  1. Test upstream connectivity from server container:
     ```bash
     curl -s "https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m"
     ```
  2. If upstream rate-limits occur, verify Open-Meteo cache window is active (default 5 minutes).

### Runbook C: High Memory / Node.js Process Starvation
- **Symptom**: `heapUsedMb` > 400 MB or container crashes with OOMKilled.
- **Actions**:
  1. Inspect `GET /api/system/metrics` memory stats.
  2. Verify Leaflet tile caching or GIS polygons in memory: geoJSON processing should use bounding-box pruning.
  3. Ensure Node.js max heap allocation is configured in container startup:
     ```bash
     NODE_OPTIONS="--max-old-space-size=1024" npm start
     ```

---

## 4. Live Demonstration Reset Procedure

During hackathon presentations or QA demonstrations, users may create multiple test incidents, trigger AI resource recommendations, and modify shelter occupancies.

To restore the system to its benchmark state instantly without manual database wiping:

### Authenticated Reset Endpoint:
```bash
curl -X POST https://<domain>/api/system/reset-demo \
  -H "Authorization: Bearer <ADMIN_OR_COMMANDER_TOKEN>" \
  -H "Content-Type: application/json"
```

- **Effect**:
  - Re-seeds all 12 benchmark multi-hazard incidents and incident timeline logs.
  - Re-seeds all NDRF, SDRF, medical, and fire rescue teams.
  - Restores shelter capacities and baseline inventories.
  - Generates a permanent audit record: `DEMO_DATA_RESET`.
  - Returns HTTP 200 within ~50ms.
