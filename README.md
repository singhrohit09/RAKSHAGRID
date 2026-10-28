# RakshaGrid — Disaster Intelligence and Coordinated Response Platform

> **"Disaster Intelligence. Coordinated Response. Safer Communities."**

[![GitHub Repository](https://img.shields.io/badge/GitHub-singhrohit09%2FRAKSHAGRID-red.svg)](https://github.com/singhrohit09/RAKSHAGRID)
[![Phase](https://img.shields.io/badge/Phase-2%20Backend%20%26%20Database%20Complete-emerald.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.6-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)]()
[![Express](https://img.shields.io/badge/Express-5.3-yellow.svg)]()
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL)%20%7C%20PostgreSQL-orange.svg)]()
[![Tests](https://img.shields.io/badge/Vitest-39%20Passed-brightgreen.svg)]()

---

## 1. Problem Statement

Natural disasters and extreme emergencies — including riverine flooding, flash inundations, severe cyclones, earthquakes, landslides, industrial chemical fires, and structural collapses — place catastrophic stress on civil response infrastructures.

Emergency Operations Centers (EOCs), district administrations, and disaster response forces (NDRF/SDRF) frequently face:
- **Fragmented Situational Awareness**: Information scattered across ad-hoc phone calls, field radios, paper logs, and disparate spreadsheets.
- **Resource Bottlenecks & Depletion**: Relief items (water rations, trauma medical supplies, inflatable boats) allocated without real-time inventory visibility, leading to stock depletion and uncoordinated deliveries.
- **Shelter Overcrowding**: Evacuation centers exceeding safe capacities while nearby shelters remain underutilized.
- **Delayed Public Warning Workflows**: Incoherent alert drafting and review bottlenecks during crucial evacuation windows.

---

## 2. Project Objectives

**RakshaGrid** is designed to provide unified emergency operations intelligence and coordination:
1. **Consolidated Incident Registry**: Log, triage, track, and update disaster incidents with validated coordinate telemetry, priorities, and audit timelines.
2. **Interactive Geo-Spatial Map**: Real-time Leaflet GIS mapping linking active incident markers, response units, and shelters with estimated hazard impact zones.
3. **Response Unit Coordination**: Maintain rosters of field search-and-rescue, medical, and fire battalions with readiness states and assignments.
4. **Capacity-Aware Shelter Management**: Monitor evacuation center headcounts with automated overflow warnings to safeguard vulnerable displaced populations.
5. **Relief Inventory Control**: Prevent negative stock allocations and alert logisticians when essential reserves drop below minimum thresholds.
6. **Accessible Public Information**: Deliver verified civil emergency guidelines, simulated warning bulletins, and authoritative helpline directories.

---

## 3. Phase 2 Features Implemented

Phase 2 elevates the platform from an offline prototype to a **production-ready, full-stack application**:

### A. Dual Relational Database Layer
- **PostgreSQL & SQLite Dual-Adapter Client** (`server/db/connection.ts`): Connects to PostgreSQL (`pg.Pool`) when `DATABASE_URL` is configured, or automatically falls back to zero-configuration embedded SQLite (`better-sqlite3` with Write-Ahead Logging and foreign keys enabled) at `server/data/rakshagrid.db`.
- **Normalized Schema (11 tables)** (`server/db/schema.sql`): `users`, `teams`, `shelters`, `resources`, `inventory_movements`, `incidents`, `incident_timeline`, `tasks`, `alerts`, `audit_events`, `system_settings`, `notifications`.
- **Baseline Seeding Script** (`server/scripts/seed.ts`): Seeds authenticated personas with hashed passwords, initial operational teams, shelters, resources, tasks, and audit records.

### B. Real Authentication & Session Handling
- **Password Hashing**: Standard `bcryptjs` encryption with salt rounds of 10.
- **Session Tokens**: Cryptographically signed JSON Web Tokens (JWT) stored in `HttpOnly`, `SameSite=Lax` cookies with header fallback (`Authorization: Bearer <token>`).
- **Profile Endpoint**: `/api/auth/me` validates the session and delivers the authenticated persona profile with verified permissions.
- **User Registration & Login**: Real registration and credential verification endpoints.

### C. Server-Enforced Role-Based Access Control (RBAC)
- Strict server-side RBAC middleware (`server/middleware/rbac.ts`) protecting sensitive API routes.
- Returns `HTTP 401 Unauthorized` for missing/invalid sessions and `HTTP 403 Forbidden` for role capability violations.
- Five operational personas with dedicated server capability sets:
  - **Administrator** (`admin`): Full administrative command, system preferences, data baseline reset.
  - **Incident Commander** (`commander`): Tactical incident triage, team dispatch, task assignment, alert review & approval.
  - **Field Responder** (`responder`): Field operational reporting, incident status updates, task execution.
  - **Logistics Officer** (`logistics`): Shelter management, inventory allocation and release.
  - **Read-Only Analyst** (`analyst`): Observer situational awareness, analytics inspection, audit log review.

### D. Server-Side Safety Business Rules
- **Negative Stock Prevention**: Inventory allocations exceeding depot stock are rejected at the server level (`HTTP 400 Insufficient stock`). Allocations and releases generate entries in `inventory_movements`.
- **Shelter Capacity Overflow Guard**: Occupancy headcounts exceeding safe capacity are blocked (`HTTP 400 EXCEEDS_CAPACITY`) unless an administrative override is explicitly provided.
- **Geographic Coordinate Validation**: Validates coordinate boundaries (-90..90 latitude, -180..180 longitude) before saving.
- **Tamper-Resistant Audit Trail**: Records mutations across all modules, sanitizing sensitive credentials before storage in `audit_events`.

### E. Frontend API Integration with Graceful Offline Fallback
- Typed REST API client (`src/services/api.ts`) connecting the reactive React store (`RakshaContext`) to backend endpoints.
- Built-in availability detector: when running without the backend server, the app automatically switches to **Demo Mode** using local storage persistence, ensuring 100% operational functionality in all environments.
- Real-time connection badge in the application header: `[LIVE API]` vs `[DEMO MODE]`.

---

## 4. Technology Stack

- **Frontend**: React 18.3 (TypeScript strict mode), Vite 5, Tailwind CSS 3.4
- **Backend API**: Node.js 20+/24+, Express 5.3, TypeScript
- **Authentication**: JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`
- **Database**: PostgreSQL (`pg`) / Embedded SQLite 3 (`better-sqlite3` WAL)
- **Mapping**: Leaflet 1.9 with OpenStreetMap / CartoDB tiles
- **Data Visualization**: Recharts 2.13
- **Testing**: Vitest 2.1, Supertest 7.3

---

## 5. Standard Baseline Credentials

| Persona | Role | Email | Password |
|---|---|---|---|
| Director Rajesh Verma | `admin` | `admin@rakshagrid.gov.in` | `Admin@RakshaGrid2026` |
| Cmdr. Ananya Sen | `commander` | `commander@rakshagrid.gov.in` | `Commander@Raksha2026` |
| Vikramaditya Rao | `responder` | `responder@rakshagrid.gov.in` | `Responder@Raksha2026` |
| Pooja Kulkarni | `logistics` | `logistics@rakshagrid.gov.in` | `Logistics@Raksha2026` |
| Dr. Siddharth Mehta | `analyst` | `analyst@rakshagrid.gov.in` | `Analyst@Raksha2026` |

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

### 4. Seed the database (Optional — runs automatically on first start)
```bash
npm run server:seed
```

### 5. Start the backend API server (Port 5000)
```bash
npm run server
```

### 6. Start the frontend development server (Port 3000)
In a separate terminal:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The Vite dev server will proxy all `/api` requests to `http://localhost:5000`.

---

## 7. Verification Commands

### Run Full Test Suite (39 Tests)
```bash
npm test
```
*Current status: 39 tests passing (18 backend integration tests + 21 frontend domain logic tests).*

### TypeScript Strict Type Checking (Dual Frontend & Backend)
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
git add .

# Create descriptive milestone commit
git commit -m "feat: integrate frontend API client and persistence"

# Push to main branch
git push origin main
```

---

## License

This project is open-source under the MIT License for educational and disaster resilience research purposes.
