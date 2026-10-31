# RakshaGrid — Disaster Intelligence and Coordinated Response Platform

> **"Disaster Intelligence. Coordinated Response. Safer Communities."**

[![GitHub Repository](https://img.shields.io/badge/GitHub-singhrohit09%2FRAKSHAGRID-red.svg)](https://github.com/singhrohit09/RAKSHAGRID)
[![Phase](https://img.shields.io/badge/Phase-4%20Multi--Agent%20AI%20%26%20Disaster%20Intelligence%20Complete-emerald.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.6-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)]()
[![Express](https://img.shields.io/badge/Express-5.3-yellow.svg)]()
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL)%20%7C%20PostgreSQL-orange.svg)]()
[![Tests](https://img.shields.io/badge/Vitest-110%20Passed%20(100%25)-brightgreen.svg)]()

---

## 1. Problem Statement

Natural disasters and extreme emergencies — including riverine flooding, flash inundations, severe cyclones, earthquakes, landslides, industrial chemical fires, and structural collapses — place catastrophic stress on civil response infrastructures.

Emergency Operations Centers (EOCs), district administrations, and disaster response forces (NDRF/SDRF) frequently face:
- **Fragmented Situational Awareness**: Information scattered across ad-hoc phone calls, field radios, paper logs, and disparate spreadsheets.
- **Disconnected External Data**: Weather radar, hydrological river telemetry, and seismic alerts siloed in separate government agency websites.
- **Resource Bottlenecks & Depletion**: Relief items (water rations, trauma medical supplies, inflatable boats) allocated without real-time inventory visibility or concurrency safety.
- **Shelter Overcrowding**: Evacuation centers exceeding safe capacities without traceable justification or overflow routing.
- **Delayed Public Warning Workflows**: Incoherent alert drafting and review bottlenecks during crucial evacuation windows.

---

## 2. Project Objectives

**RakshaGrid** is designed to provide unified emergency operations intelligence and coordination:
1. **Consolidated Incident Registry & Escalation**: Log, triage, track, escalate, and update disaster incidents with validated coordinate telemetry, priorities, and audit timelines.
2. **GIS Spatial Geofencing Engine**: Dynamic polygon ray-casting and Haversine circle containment evaluator identifying high-risk disaster perimeters and affected operational assets.
3. **External Meteorological & Hydrological Telemetry**: Live Open-Meteo weather integration with WMO code translation, flood gauges, and cached fallbacks.
4. **Multichannel Notification Infrastructure**: In-App, Webhook, and telecommunications alert dispatch with sliding-window deduplication and audit tracking.
5. **Response Unit Coordination**: Maintain rosters of field search-and-rescue, medical, and fire battalions with automated deployment lifecycle tracking.
6. **Capacity-Aware Shelter Management**: Monitor evacuation center headcounts with strict capacity safeguards and recorded administrative override justifications.
7. **Relief Inventory Control**: Concurrency-safe atomic resource allocations preventing negative inventory.

---

## 3. Architecture & Multi-Agent AI System (Phase 4)

Phase 4 transforms RakshaGrid into an explainable **multi-agent AI disaster intelligence and response coordination platform**:

```
+-----------------------------------------------------------------------------------------------+
|                       Browser User Interface (React 18 & TypeScript)                          |
|  - Operations Dashboard & Incident Registry        - Leaflet GIS Map & Environmental HUD      |
|  - AI Disaster Intelligence Center                 - Human-in-the-Loop Approval Queue         |
|  - Disaster Simulation Lab                         - Audit Logs & Execution History           |
+-----------------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------------+
|                        Express 5 Backend API & Modular Services (Port 5000)                   |
|  /api/auth       /api/incidents    /api/teams      /api/shelters   /api/resources             |
|  /api/tasks      /api/alerts       /api/audit      /api/external   /api/geofences             |
|  /api/ai/risk    /api/ai/incidents /api/ai/resources /api/ai/coordinator /api/ai/simulation   |
+-----------------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------------+
|                                  MULTI-AGENT AI ORCHESTRATOR                                  |
|  - Agent 1: Disaster Risk Intelligence Agent (Multi-hazard risk score & exposure)             |
|  - Agent 2: Incident Intelligence & Prioritization Agent (Dynamic P1-P4 triage ranking)      |
|  - Agent 3: Smart Resource Allocation Agent (Haversine proximity & inventory matching)        |
|  - Agent 4: AI Emergency Response Coordinator (NLP intent parsing & 3-phase action plan)      |
|  - Agent 5: Disaster Simulation Agent (Isolated sandbox stress-testing & strategy comparison) |
+-----------------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------------+
|                       AI Provider Abstraction & Deterministic Fallback                        |
|  - External LLM: Google Gemini 1.5 Flash / OpenAI (Backend-only keys, timeout & retries)      |
|  - Fallback Engine: Deterministic Analytical Heuristics (Zero credentials, always available)  |
|  - Human Approval Gate: Recommendations staged as 'pending' prior to atomic execution         |
+-----------------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------------+
| Dual-Adapter Relational Database Layer (PostgreSQL || SQLite 3 WAL Mode)                       |
| 16 Normalized Relational Tables:                                                              |
| users, teams, shelters, resources, inventory_movements, incidents, incident_timeline,         |
| tasks, alerts, audit_events, password_reset_tokens, geofences, notification_deliveries,        |
| ai_agent_executions, ai_recommendations, ai_simulation_records                                |
+-----------------------------------------------------------------------------------------------+
```

---

## 4. Live vs. Simulated Integration Status

RakshaGrid maintains absolute transparency regarding live external data versus simulated local fallbacks:

| Component / Subsystem | Integration Status | Data Source / Technology | Production Operational Notes |
|---|---|---|---|
| **Meteorological Weather Telemetry** | **LIVE** | Open-Meteo WMO Forecast API (`https://api.open-meteo.com/v1/forecast`) | Real temperature, humidity, wind speed, precipitation, and WMO severity classification with 10-minute in-memory caching and stale-while-revalidate. Falls back to offline baseline gracefully if network fails. |
| **Hydrological River Gauges** | **HYBRID / SIMULATED** | Central Water Commission & GloFAS Models | Provides calibrated stage thresholds (normal, watch, warning, severe, inundation) and discharge telemetry (`m³/s`) for regional rivers. Live CWC telemetry gateway ready for sensor credentials. |
| **GIS Geofencing Engine** | **LIVE / REAL** | In-Engine Ray-Casting & Haversine Spherical Calculation | Server-side mathematical containment engine evaluates exact point-in-polygon coordinates and radial circles against incidents, shelters, and field units. |
| **Relational Database** | **LIVE / REAL** | PostgreSQL (`pg`) or SQLite 3 (`better-sqlite3` WAL) | Dual-adapter client with ACID transactions, strict foreign keys, and 13 normalized tables. |
| **Multichannel Dispatcher** | **LIVE / SIMULATED** | In-App (Live), Webhooks (Live), Cellular SMS (Simulated) | Dispatches real in-app alerts and outgoing HTTP webhooks; cellular SMS adapter logs transmission payloads to `notification_deliveries` ledger. |

---

## 5. Security Architecture & Administrator Provisioning

RakshaGrid strictly adheres to production security hardening standards:
- **No Hardcoded or Published Credentials**: All published default passwords have been removed from source and documentation.
- **Secure Administrator Provisioning**:
  - Run the dedicated one-time provisioning script to bootstrap the first administrator:
    ```bash
    npm run server:bootstrap-admin
    ```
  - Alternatively, configure `INITIAL_ADMIN_PASSWORD` in your secure production environment.
- **Cryptographic Secret Generation**:
  - Production deployments require a 256-bit cryptographically random secret for signing JWTs:
    ```bash
    npm run generate-secret
    ```
- **Privilege Escalation Defense**: Public user registration (`/api/auth/register`) strictly assigns standard responder permissions and actively rejects attempts to claim `admin` or `commander` roles (HTTP 403 Forbidden). Administrator role promotion is restricted to verified administrators (`PUT /api/auth/users/:id/role`).
- **Rate Limiting & CSRF Protection**:
  - Sliding-window rate limiters defend against brute-force attacks on login (10 requests/min) and password reset (5 requests/15 min).
  - CSRF origin and custom header verification (`X-Requested-With`, `X-Raksha-CSRF`) protect state-changing mutation requests authenticated via cookies.
- **Application-Level Operational Audit Trail**:
  - Automatically logs mutations across all domains with actor callsign, IP, action, entity type, and sanitized payload in `audit_events`.

---

## 6. Installation & Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/singhrohit09/RAKSHAGRID.git
cd RAKSHAGRID
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration
```bash
cp .env.example .env
```

### 4. Seed database baseline
```bash
npm run server:seed
```

### 5. Start backend API server (Port 5000)
```bash
npm run server
```

### 6. Start frontend development server (Port 3000)
In a separate terminal:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The Vite dev server proxies all `/api` requests to `http://localhost:5000`.

---

## 7. Verification Commands

### Run Full Test Suite (93 Tests Passing across 8 Test Suites)
```bash
npm test
```
*Current test coverage includes:*
- `server/tests/security.test.ts` (17 tests) — Secret enforcement, admin bootstrap, rate limiting, CSRF, privilege escalation.
- `server/tests/api.test.ts` (18 tests) — Full REST endpoint CRUD, authentication, RBAC, inventory safety, shelter capacity.
- `server/tests/geofence.test.ts` (12 tests) — Ray-casting point-in-polygon math, circle Haversine distance, containment evaluator, REST API.
- `server/tests/external.test.ts` (12 tests) — Open-Meteo weather client, WMO code parser, TTL cache, SWR, river gauges, REST API.
- `server/tests/coordination.test.ts` (5 tests) — Incident escalation, team assignment state machine, shelter overflow tracking, concurrency safety.
- `server/tests/notifications.test.ts` (8 tests) — Multi-channel dispatcher, deduplication cache, webhook delivery, audit ledger.
- `src/tests/businessRules.test.ts` (13 tests) — Client domain validation and business constraints.
- `src/tests/domainOperations.test.ts` (8 tests) — CSV formatting, date calculations, search utilities.

### TypeScript Strict Type Checking (Frontend & Backend)
```bash
npm run lint
```
Checks strict type safety across both frontend (`tsconfig.json`) and server (`tsconfig.server.json`).

### Production Build
```bash
npm run build
```
Compiles and generates optimized production distribution in `dist/`.

---

## 8. Git Repository & Contribution Rules

The **ONLY** authorized repository destination for this project is:
**https://github.com/singhrohit09/RAKSHAGRID.git**

### Mandatory Git Workflow:
```bash
# Verify remote destination
git remote -v

# Check status
git status

# Stage verified changes
git add <files>

# Create descriptive milestone commit
git commit -m "feat(module): description"

# Push to main branch
git push origin main
```

---

## License

This project is open-source under the MIT License for educational and disaster resilience research purposes.
