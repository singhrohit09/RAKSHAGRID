# RakshaGrid Architecture Documentation (Phase 1)

## System Overview

**RakshaGrid** is a specialized disaster intelligence and coordinated emergency operations platform. It is engineered to give Emergency Operations Centers (EOC), Incident Commanders, and field relief authorities situational awareness, tactical coordination tools, resource logistics tracking, and simulated public alert drafting during major emergencies.

Phase 1 provides a fully operational, client-side application foundation with structured data contracts, role-aware persona switching, domain persistence, and an interactive GIS operations map.

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
                              |      (React State + Context)  |
                              +-------------------------------+
                                              |
                   +--------------------------+--------------------------+
                   |                          |                          |
                   v                          v                          v
      +------------------------+ +------------------------+ +------------------------+
      |  Domain Services &     | | Audit Activity Logger  | | Role & Permission      |
      |  CRUD Validators       | | (All CRUD Mutations)   | | Authorizer (5 Personas)|
      +------------------------+ +------------------------+ +------------------------+
                   |                          |                          |
                   +--------------------------+--------------------------+
                                              |
                                              v
                              +-------------------------------+
                              |    Versioned LocalStorage     |
                              |  Schema: rakshagrid_state_v1   |
                              +-------------------------------+
```

---

## Architecture Principles

1. **Information-Dense Operational Aesthetic**:
   - Designed for high-stress operations control rooms.
   - Restrained palette: `#0d1117` (Deep Charcoal), `#161b22` (Elevated Panels), `#30363d` (Borders), `#dc2626` (Emergency), `#d97706` (Hazard), `#059669` (Safe).
   - Monospace typography (`JetBrains Mono`) for coordinate telemetry, IDs, timestamps, and capacity figures; clean sans-serif (`Plus Jakarta Sans`) for interface controls.

2. **Unified Reactive Data Store**:
   - All modules (KPI dashboard, GIS map, registry tables, analytics, task boards) query from a single, centralized reactive data store (`RakshaContext`).
   - Mutations in one module (e.g., allocating 400 water kits or marking a shelter as 100% full) immediately update dashboard counters and analytical charts without manual page reloads.

3. **Centralized Audit Logging**:
   - Every mutative action (`incident_created`, `resource_allocated`, `shelter_updated`, `task_status_changed`, `alert_approved`, `demo_data_reset`) produces an immutable audit event recording timestamp, persona, domain, entity ID, and human-readable context.

4. **Zero-Trust Role Simulation**:
   - Five distinct responder personas:
     - **Administrator**: Unrestricted authority, system preferences, data baseline reset.
     - **Incident Commander**: Incident triage, alert review & approval, task dispatch, team coordination.
     - **Field Responder**: Field status updates, task execution.
     - **Logistics Officer**: Shelter capacity monitoring, inventory allocation and release.
     - **Read-Only Analyst**: Situational awareness observer, read-only analytics and audit log review.

5. **Safety by Design**:
   - Simulated emergency alert mechanisms explicitly disclaim real-world transmission.
   - Channel toggles (SMS, Cell Broadcast, Siren, Radio) are prominently marked "Not connected — demo only".
   - Shelter capacity validation warns and requires confirmation before accepting headcount overrides.
   - Resource allocation prohibits negative stock numbers.

---

## Folder & Component Structure

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

---

## Data Flow & Persistence Strategy

1. **Initialization**: On application mount, `RakshaProvider` inspects browser `localStorage` for key `rakshagrid_state_v1.0`. If present and valid, state is restored; otherwise, the baseline scenario from `seedData.ts` is populated.
2. **Mutations**: User actions trigger typed context callbacks (e.g., `addIncident`, `allocateResource`).
3. **Audit Dispatch**: The mutation callback atomically constructs an `AuditLogEvent` containing the active persona identity and timestamp, prepending it to `auditLogs`.
4. **Persistence**: A reactive `useEffect` writes serialized state to `localStorage` automatically.
5. **Reset & Recovery**: The `resetDemoData()` method wipes customized entries and re-seeds the pristine scenario baseline upon confirmation.

---

## Future Phase Integration Path

Phase 1 establishes clean architectural seams to ensure zero UI rewrites when upgrading:
- `RakshaContext` methods are designed to swap local state dispatch with REST/WebSocket calls to FastAPI or Node.js in Phase 2.
- Persona tokens will transition from client-side state to signed JWTs / OAuth2 tokens without changing permission check calls (`hasPermission(activePersonaId, permission)`).
- The Leaflet vector tile layer is configured to connect to PostGIS vector tiles (`MVT`) in Phase 3.
