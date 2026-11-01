# RakshaGrid — System Architecture Specification

---

## 1. High-Level Architectural Topology

RakshaGrid is engineered as a decoupled, resilient, cloud-first full-stack application featuring client-side route code-splitting, an in-memory/localStorage fault-tolerant data cache, real-time Supabase PostgreSQL synchronization, and an explainable AI intelligence subsystem.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT APPLICATION                                 |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |   Public Portal    |  | Authenticated EOC UI |  | AI Intelligence Center   |  |
|  | (Citizens/Shelter) |  | (Command/GIS/Teams)  |  | (Orchestrator/Simulator)  |  |
|  +---------+----------+  +----------+-----------+  +-------------+-------------+  |
|            |                        |                            |                |
|  +---------v------------------------v----------------------------v-------------+  |
|  |                          React Router & Viewport Shell                      |  |
|  |              (Error Boundaries + Suspense Route Code Splitting)             |  |
|  +----------------------------------+------------------------------------------+  |
|                                     |                                             |
|  +----------------------------------v------------------------------------------+  |
|  |                 State Management & Client DataService Layer                  |  |
|  |        (Unified In-Memory Storage + Universal Local Storage Fallback)        |  |
|  +-------+--------------------------+----------------------------+-------------+  |
+----------|--------------------------|----------------------------|----------------+
           |                          |                            |
           v                          v                            v
+--------------------+      +--------------------+      +---------------------------+
| Supabase Auth      |      | Supabase Database  |      | Google Gemini API         |
| - JWT Sessions     |      | - PostgreSQL 15+   |      | - @google/genai SDK       |
| - Role Claims      |      | - Row Level Sec.   |      | - Deterministic Heuristic |
| - Session Recovery |      | - Realtime Streams |      |   Fallback Swarm          |
+--------------------+      +--------------------+      +---------------------------+
```

---

## 2. Layer-by-Layer Architectural Breakdown

### 2.1 Presentation & Viewport Layer
- **Tactical Responsive Layout:** Implemented in `src/components/layout/AppLayout.tsx`, providing collapsible responsive navigation, live alert tickers, global search modal (`Cmd+K`), and network disconnection warnings.
- **Dynamic Route-Level Code Splitting:** Pages (`DashboardPage`, `IncidentsPage`, `MapPage`, `AIIntelligencePage`, `TeamsPage`, `SheltersPage`, `ResourcesPage`, `TasksPage`, `AnalyticsPage`, `AlertsPage`, `SettingsPage`, `AuditLogPage`) are lazily loaded on demand via `React.lazy` and `React.Suspense`, slashing initial load bundle size by >70%.
- **Subsystem Error Containment:** All route viewports are isolated inside `ErrorBoundary` components (`src/components/common/ErrorBoundary.tsx`). If any visual component crashes (e.g., corrupt map tiles), the fault is contained locally without unmounting the rest of the application.

### 2.2 Geospatial GIS Engine
- **Spatial Calculations:** Geodesic distance, radial hazard buffer polygons, and point-in-polygon containment are calculated client-side using Turf.js (`@turf/turf`).
- **Tile Rendering:** Leaflet rendering with customizable tactical tile layers (CartoDB Dark Matter, OpenStreetMap, Satellite imagery).
- **Hazard Buffers:** Dynamic circular and polygonal risk rings calculated per incident severity (Critical = 15km buffer, High = 10km buffer, Medium = 5km buffer).

### 2.3 Resilient Persistence & DataService
- **Hybrid Storage Design:** `src/services/dataService.ts` encapsulates all transactional mutations. It seamlessly bridges browser `localStorage` and Node/SSR memory map backings.
- **Supabase Realtime Sync:** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, data operations seamlessly push and subscribe to PostgreSQL tables with strict Row-Level Security (RLS).
- **Immutable Audit Trail:** All mutations (incident updates, team status changes, resource allocations, alert acknowledgments, login sessions) generate timestamped audit records with actor attribution.

### 2.4 Human-in-the-Loop AI Intelligence Engine
- **Decoupled Swarm:** 7 specialized agents compute domain analysis in parallel (`Weather`, `Hydrology`, `Disaster`, `Resource`, `Shelter`, `Planning`, `Infrastructure`).
- **Chief Orchestrator:** Synthesizes domain analyses into an authoritative Situation Awareness Report (SAR) with multi-agent consensus validation.
- **Explainable Multi-Factor Risk Engine:** Deterministic scoring algorithm combining hazard severity (0.25), vulnerability (0.25), exposure (0.20), shelter deficit (0.15), and response distance (0.15).
- **Isolated Simulation Sandbox:** `DisasterScenarioSimulator` evaluates user-configured catastrophe parameters (rainfall surge, river crest, grid failure, bridge collapse) as pure mathematical functions without mutating baseline database records.
