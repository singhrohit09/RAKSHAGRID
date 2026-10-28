# RakshaGrid — Multi-Phase Development Roadmap

## Project Vision
"Disaster Intelligence. Coordinated Response. Safer Communities."

RakshaGrid is architected as an industrial-grade disaster intelligence and coordinated emergency operations platform. The roadmap spans five iterative phases progressing from an interactive operational command prototype to a multi-jurisdictional, real-time emergency coordination network.

---

## Phase 1: Complete Application Foundation (Completed)
**Objective**: Build a credible, high-density emergency operations command dashboard, persistent data architecture, role-aware simulation, interactive GIS mapping, and public bulletin.

### Key Milestones Completed:
- [x] **Operations Command Shell**: Desktop-first tactical layout with dark mode palette (`#0d1117`), collapsible sidebar, and responsive mobile navigation.
- [x] **Role & Persona Simulation**: Centralized permission matrix supporting Administrator, Incident Commander, Field Responder, Logistics Officer, and Read-Only Analyst.
- [x] **12 Operational Modules**:
  1. `/dashboard` — Live KPI counters, critical incident alerts, severity and status distributions, regional situation summary.
  2. `/incidents` — Incident registry with full CRUD, coordinate validation, status transitions, timeline logging, and team assignment.
  3. `/map` — Interactive Leaflet GIS map with severity markers, team positions, shelter layers, coordinate HUD, inspector drawer, and estimated impact radius overlays.
  4. `/teams` — Response team roster with readiness statuses, disciplines, personnel counts, and assignments.
  5. `/shelters` — Shelter management with capacity bar meters, occupancy overflow warnings, and facility checklists.
  6. `/resources` — Relief inventory ledger with allocation and release mechanics preventing negative inventory.
  7. `/tasks` — Kanban task coordination board with keyboard-accessible column navigation, incident links, and overdue tracking.
  8. `/alerts` — CAP-inspired emergency alert authoring, simulated channel placeholders, and review/approval flows.
  9. `/analytics` — Statistical charts and CSV report exports (RFC 4180 compliant).
  10. `/audit` — Immutable activity log recording all user mutations across domains with CSV and JSON exports.
  11. `/settings` — Operational center configuration, time formatting, coordinate defaults, and factory baseline reset.
  12. `/public` — Public civil emergency bulletin portal with active simulated warnings, verified helplines, and preparedness guides.
- [x] **Verification**: 21 unit tests covering domain operations, CSV escaping, and role authorization passed. Production Vite bundle verified.

---

## Phase 2: Production-Ready Backend, Database & Authentication (Completed)
**Objective**: Replace client-only persistence with a production-grade relational database, secure user authentication, server-enforced RBAC, and server-side safety business rules.

### Key Milestones Completed:
- [x] **Dual Relational Database Engine**: PostgreSQL (`pg.Pool`) and zero-configuration embedded SQLite (`better-sqlite3` with WAL mode and foreign key enforcement) sharing normalized ANSI SQL schema (`server/db/schema.sql`).
- [x] **Normalized Relational Schema**: 11 relational tables (`users`, `teams`, `shelters`, `resources`, `inventory_movements`, `incidents`, `incident_timeline`, `tasks`, `alerts`, `audit_events`, `system_settings`, `notifications`).
- [x] **Real User Authentication**: Bcrypt password hashing (`$2a$10$...`), cryptographically signed JWT sessions delivered in HttpOnly cookies and Bearer tokens, profile verification (`GET /api/auth/me`), and registration endpoints.
- [x] **Server-Side Role-Based Access Control (RBAC)**: `requirePermission(permission)` middleware enforcing 401 Unauthorized / 403 Forbidden access boundaries across 5 operational personas.
- [x] **Server Business Rules & Safety Guardrails**:
  - Prohibits negative inventory; records movement history in `inventory_movements`.
  - Rejects shelter occupancy overflowing safe capacity without explicit administrative override.
  - Validates terrestrial coordinate boundaries (-90..90 latitude, -180..180 longitude).
  - Tamper-resistant audit logging with automatic redaction of sensitive credentials.
- [x] **Modular Express REST API**: Complete endpoints mounted under `/api/*` (`/auth`, `/incidents`, `/teams`, `/shelters`, `/resources`, `/tasks`, `/alerts`, `/audit`, `/settings`, `/notifications`, `/health`).
- [x] **Frontend API Integration**: Typed client (`src/services/api.ts`) connecting `RakshaContext` to live backend endpoints with automatic fallback to standalone demo mode when running offline.
- [x] **Verification & Test Suite**: 39 Vitest tests passed (18 backend integration tests + 21 frontend domain tests); 0 TypeScript lint errors; production Vite bundle built and verified.

---

## Phase 3: Hardware Integrations, GIS Geofencing & Telecommunications
**Objective**: Integrate with actual sensor feeds, meteorological radar, and civil alerting infrastructure.

### Planned Capabilities:
- **CAP v1.2 Protocol Engine**: Full OASIS Common Alerting Protocol compliant XML generation and digital signature validation.
- **Telecommunication Gateways**: Integrations with official cellular broadcast channels, SMS emergency aggregators, and email distribution lists.
- **Siren & Acoustic Warning Network**: Hardware controller protocols for municipal outdoor warning sirens.
- **Live Environmental Feeds**: Ingestion of IMD Doppler radar data, USGS/National Seismological network feeds, and river water-level telemetry.
- **Dynamic Geofencing**: Polygon-based evacuation zone drawing with automatic population density estimation.

---

## Phase 4: AI Hazard Modeling, Predictive Triage & Resource Optimization
**Objective**: Provide algorithmic decision-support to Incident Commanders under severe cognitive load.

### Planned Capabilities:
- **Hydrological Inundation Modeling**: Predictive flash flood modeling using terrain elevation models (DEM) and live rainfall rates.
- **Automated Task Routing**: Intelligent dispatch recommendations matching task skills with nearby available response units.
- **Shelter Logistics Optimizer**: Algorithmic supply chain forecasting predicting ration and medical kit burn rates per shelter.
- **Automated Situation Reports (SITREPs)**: Automated generation of structured executive briefings for government disaster management authorities.

---

## Phase 5: Mobile Edge App & Multi-Agency Federation
**Objective**: Deploy ruggedized offline-first mobile apps for field responders and establish cross-jurisdictional federation.
