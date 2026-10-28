# RakshaGrid — Disaster Intelligence and Coordinated Response Platform

> **"Disaster Intelligence. Coordinated Response. Safer Communities."**

[![GitHub Repository](https://img.shields.io/badge/GitHub-singhrohit09%2FRAKSHAGRID-red.svg)](https://github.com/singhrohit09/RAKSHAGRID)
[![Phase](https://img.shields.io/badge/Phase-1%20Foundation%20Complete-emerald.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.6-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)]()
[![Tests](https://img.shields.io/badge/Vitest-21%20Passed-brightgreen.svg)]()

---

## 1. Problem Statement

Natural disasters and extreme emergencies — including riverine flooding, flash inundations, severe cyclones, landslides, industrial chemical fires, and structural collapses — place catastrophic stress on civil response infrastructures.

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

## 3. Phase 1 Features Implemented

Phase 1 delivers the complete operational application foundation with local persistence:

- **Tactical Dark-Mode Operations Interface**: Deep charcoal (`#0d1117`), elevated panels (`#161b22`), and clear emergency indicators (`#dc2626`, `#d97706`, `#059669`).
- **Role-Aware Persona Simulation**: Switch seamlessly between 5 operational roles:
  - *Administrator* (Full system authority)
  - *Incident Commander* (Tactical incident, team, and alert control)
  - *Field Responder* (Field status reporting and task execution)
  - *Logistics Officer* (Shelter headcounts and inventory allocation)
  - *Read-Only Analyst* (Observer situational awareness without write mutations)
- **12 Functional Modules & Routes**:
  1. `/dashboard` — KPI metrics, severity and status distribution charts, active hazard overview.
  2. `/incidents` — Incident registry supporting full CRUD, numeric coordinate validation, status transitions, and timeline logging.
  3. `/map` — Interactive Leaflet GIS map with OpenStreetMap tiles, layer visibility toggles, coordinate HUD, inspector panel, and estimated hazard radius overlays.
  4. `/teams` — Roster of specialized disaster units (Search & Rescue, Medical, Hazmat, Logistics, Evacuation) with staffing counts and status tracking.
  5. `/shelters` — Evacuation shelter registry with capacity utilization bars, overflow override safeguards, and verified facility checklists.
  6. `/resources` — Relief inventory ledger with allocation and release mechanics preventing negative inventory.
  7. `/tasks` — Response Kanban task board (Backlog, Ready, In Progress, Blocked, Completed) with keyboard-accessible column navigation and overdue tracking.
  8. `/alerts` — Common Alerting Protocol (CAP) inspired alert composer with simulated channel toggles (SMS, Cell Broadcast, Siren, Public Bulletin).
  9. `/analytics` — Statistical charts and RFC 4180 compliant CSV tabular report exports.
  10. `/audit` — Client-side immutable activity audit log recording all user mutations with CSV and JSON exports.
  11. `/settings` — Operational center configuration, time formatting, default map coordinates, and one-click demo data reset.
  12. `/public` — Accessible public emergency information portal with active simulated warnings, verified emergency helplines, and safety guides.

---

## 4. Technology Stack

- **Framework**: React 18.3 (TypeScript strict mode)
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4 with custom tactical design tokens
- **Icons**: Lucide React
- **Mapping**: Leaflet 1.9 with OpenStreetMap / CartoDB tiles
- **Data Visualization**: Recharts 2.13
- **Routing**: React Router DOM 6.28
- **Unit Testing**: Vitest 2.1
- **Storage**: Browser LocalStorage with schema versioning (`v1.0`) and fallback migration

---

## 5. Architecture and Folder Structure

```
d:\RakshaGrid\
├── index.html                  # HTML entry point with Plus Jakarta Sans & JetBrains Mono fonts
├── vite.config.ts              # Vite 5 + React plugin + Vitest configuration
├── tailwind.config.js          # Tactical operations design tokens
├── package.json                # Dependencies and npm script targets
├── .env.example                # Placeholder configuration endpoints
├── src/
│   ├── main.tsx                # React DOM root mounting
│   ├── App.tsx                 # Route declarations & provider nesting
│   ├── index.css               # Global tactical styles & Leaflet popup customizations
│   ├── types/                  # Strict TypeScript data contracts
│   │   ├── incident.ts         # Incident, severity, timeline, coordinates
│   │   ├── team.ts             # Response teams, staffing, disciplines
│   │   ├── shelter.ts          # Shelter facilities, capacity, occupancy
│   │   ├── resource.ts         # Logistics stock, units, depots, status
│   │   ├── task.ts             # Kanban task cards, priority, status
│   │   ├── alert.ts            # CAP-inspired warning schemas, channels
│   │   ├── audit.ts            # Audit trail event contracts
│   │   ├── role.ts             # Persona identities and permission types
│   │   └── settings.ts         # Operations center settings & mock feeds
│   ├── data/                   # Realistic baseline scenario fixtures
│   │   ├── mockIncidents.ts    # Indraprashtha Sector 4 incidents
│   │   ├── mockTeams.ts        # NDRF, SDRF, Medical, Fire battalions
│   │   ├── mockShelters.ts     # Evacuation sports complexes & schools
│   │   ├── mockResources.ts    # Potable water, medical kits, zodiac boats
│   │   ├── mockTasks.ts        # Sandbagging, dewatering, hazmat perimeter
│   │   ├── mockAlerts.ts       # Evacuation orders and chemical advisories
│   │   ├── mockAuditLogs.ts    # Initial exercise timeline entries
│   │   └── seedData.ts         # Schema versioning & storage defaults
│   ├── context/
│   │   └── RakshaContext.tsx   # Centralized data store, CRUD methods, persistence
│   ├── utils/
│   │   ├── permissions.ts      # Persona matrix & permission checking helpers
│   │   ├── csvExport.ts        # RFC 4180 compliant CSV serializer and downloader
│   │   ├── formatters.ts       # Date, coordinate, and number formatters
│   │   └── validators.ts       # Coordinate (-90..90, -180..180) & form checks
│   ├── components/
│   │   ├── common/             # Badges, Buttons, Modals, StatCards, ConfirmDialog
│   │   ├── layout/             # Header, Sidebar, AppLayout, PersonaSelector
│   │   └── map/                # Leaflet interactive map with custom div-icons
│   ├── pages/                  # 12 functional operational routes
│   │   ├── DashboardPage.tsx
│   │   ├── IncidentsPage.tsx
│   │   ├── OperationalMapPage.tsx
│   │   ├── TeamsPage.tsx
│   │   ├── SheltersPage.tsx
│   │   ├── ResourcesPage.tsx
│   │   ├── TaskBoardPage.tsx
│   │   ├── AlertsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── AuditLogPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── PublicBulletinPage.tsx
│   └── tests/                  # Vitest unit test suites
│       ├── businessRules.test.ts
│       └── domainOperations.test.ts
```

For in-depth architectural details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 6. Screens & Pages Overview

| Route | Page | Purpose |
| :--- | :--- | :--- |
| `/dashboard` | Operational Overview | High-level situational summary, live KPI cards, severity distribution, quick action launchers. |
| `/incidents` | Incident Registry | Full incident lifecycle (Reported &rarr; Verified &rarr; Active &rarr; Contained &rarr; Resolved &rarr; Closed), search, filtering, and field timeline. |
| `/map` | Operational Map | Geo-spatial visualization with severity markers, team positions, shelter layers, coordinate HUD, and inspector drawer. |
| `/teams` | Response Teams | Personnel management across Search & Rescue, Medical, Hazmat, Logistics, and Evacuation teams. |
| `/shelters` | Shelter Management | Evacuation shelter capacity tracking, occupancy meters, overflow warnings, and facility checklists. |
| `/resources` | Resource Inventory | Emergency supplies ledger with allocation and release mechanics preventing negative inventory. |
| `/tasks` | Task Board | Kanban board (Backlog, Ready, In Progress, Blocked, Completed) with incident links and overdue tracking. |
| `/alerts` | Emergency Alerts | Public warning drafting, CAP-inspired previews, channel placeholders, and review/approval flows. |
| `/analytics` | Analytics & SITREPs | Live charts and CSV tabular report exports (RFC 4180 compliant). |
| `/audit` | Audit Log | Client-side immutable activity log recording all user mutations across domains with CSV and JSON exports. |
| `/settings` | System Settings | Operational center configuration, time formatting, default map coordinates, and factory baseline reset. |
| `/public` | Public Bulletin | Public emergency portal with active simulated warnings, verified emergency helplines, and safety guides. |

---

## 7. Screenshots

*(Screenshots will be captured and added following deployment to the staging environment.)*

```
[ Screenshot Placeholder: Operational Overview Dashboard ]
[ Screenshot Placeholder: Interactive Leaflet GIS Map ]
[ Screenshot Placeholder: Incident Registry with Activity Timeline ]
[ Screenshot Placeholder: Common Alerting Protocol (CAP) Preview ]
```

---

## 8. Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20.x` or `v24.x` recommended)
- **Package Manager**: `npm` (`v9.x` or higher)
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari supporting ES2020 and Canvas.

---

## 9. Installation & Local Development

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
Copy the example environment configuration:
```bash
cp .env.example .env
```

### 4. Start local development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 10. Verification Commands

### TypeScript Strict Type Checking (Lint)
```bash
npm run lint
```

### Run Vitest Unit Tests
```bash
npm test
```
*Current status: 21 unit tests passing across domain operations, CSV sanitization, and role permissions.*

### Production Build
```bash
npm run build
```
Generates optimized production assets in `dist/`.

---

## 11. Demo Mode & Persistence Explanation

1. **Client-Side Simulation**: In Phase 1, RakshaGrid runs entirely client-side. All incidents, teams, shelters, resources, tasks, and audit logs are managed in a reactive React store.
2. **Persistence**: Changes are automatically serialized to browser `localStorage` under the key `rakshagrid_state_v1.0`. Your additions and updates persist across browser reloads.
3. **Reset to Baseline**: To restore pristine demo fixtures at any time, click the **Reset Demo Data** icon in the top header or navigate to **Settings &rarr; Restore Baseline Disaster Scenario**.

---

## 12. Security & Operational Disclaimers

> [!WARNING]
> **SIMULATION ONLY — NOT REAL EMERGENCY DISPATCH**:
> - RakshaGrid Phase 1 is a non-commercial emergency operations prototype.
> - **NO REAL EMERGENCY ALERTS ARE TRANSMITTED.** The platform does not send real SMS messages, broadcast over cellular towers, trigger sirens, or contact police/fire dispatchers.
> - Client-side role checks are a simulation feature for interface evaluation, **NOT a security boundary**.
> - Never enter confidential credentials or real-world emergency classified data into this prototype.

---

## 13. Roadmap (Phases 2–5)

- **Phase 1 (Complete)**: Application Foundation, 12 Core Modules, GIS Map, Role Switcher, Local Persistence, Unit Tests.
- **Phase 2**: Backend PostgreSQL/PostGIS persistence, genuine OIDC/JWT authentication, and real-time WebSocket state synchronization.
- **Phase 3**: CAP v1.2 XML protocol engine, telecommunication integrations (SMS/Cell Broadcast gateways), acoustic siren network drivers, and Doppler radar telemetry ingestion.
- **Phase 4**: Hydrological flood inundation modeling, automated task routing heuristics, and predictive shelter logistics burn-rate forecasting.
- **Phase 5**: Ruggedized offline-first mobile edge applications (React Native/Flutter) with LoRa/mesh sync and multi-agency federation.

Detailed roadmap documentation is available in [docs/PHASE_ROADMAP.md](docs/PHASE_ROADMAP.md).

---

## 14. Git Repository & Contribution Workflow

The **ONLY** authorized repository destination for this project is:
**https://github.com/singhrohit09/RAKSHAGRID.git**

### Safe Git Workflow Commands:
```bash
# Verify remote destination
git remote -v

# Check status
git status

# Stage changes
git add .

# Create verified commit
git commit -m "feat: implement RakshaGrid application foundation"

# Push to main branch
git push origin main
```

---

## License

This project is open-source under the MIT License for educational and disaster resilience research purposes.
