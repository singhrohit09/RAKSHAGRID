# RakshaGrid - Disaster Intelligence & Coordinated Response

> **Disaster Intelligence. Coordinated Response. Safer Communities.**  
> Built for **AGENTCRAFT 2026** · **Phase 1: Foundation Release**  
> GitHub Repository: [https://github.com/singhrohit09/RAKSHAGRID.git](https://github.com/singhrohit09/RAKSHAGRID.git)

---

## 1. Overview & Vision

**RakshaGrid** is an emergency operations platform engineered for real-world disaster management authorities (NDRF, SDMA, DDMA, international humanitarian coordination nodes). Designed with operational clarity rather than decorative fluff, RakshaGrid equips emergency incident commanders, field responders, logistics officers, and planners with live tactical situational intelligence during acute crises (cyclones, monsoonal flash floods, hillside landslides, industrial HazMat breaches, and earthquakes).

---

## 2. Phase 1 Implemented Scope

In **Phase 1**, we have built the foundational full-stack architecture, design system, operational components, and data layer:

| Domain Area | Implemented Features in Phase 1 | Status |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Role-Based Access Control with 5 distinct personas (Administrator, Incident Commander, Field Responder, Logistics Officer, Read-Only Analyst); transparent Development Mode badge; custom sign-in and agency registration; session isolation. | **Complete** |
| **Emergency Operations Command** | KPI metric cards (Total incidents, Active emergencies, Critical threats, Available forces, Shelters open, Pending tasks); Recharts severity donut and hazard distribution bar chart; recent incident timeline; latest tactical alerts; live response audit stream. | **Complete** |
| **Incident Operations Registry** | List and detail layouts; client-side filtering by severity, status, hazard type, and region; dynamic keyword search; pagination; priority scoring; full CRUD modal for reporting and updating incidents with GPS coordinate validation. | **Complete** |
| **Geospatial Situational Grid** | Situational grid map with WGS84 coordinate projections, hazard epicenter radius visualization, shelter pins, team locations, multi-layer switches (Incidents, Shelters, Teams, 50km Threat Radius), and pin inspector panel. | **Complete** |
| **Response Teams Directory** | Directory of specialized disaster units (Search & Rescue, Medical, HazMat, Water Rescue, Evacuation, Air-Drop Logistics); deployment readiness indicators; equipment rosters; interactive dispatch workflow. | **Complete** |
| **Evacuation Shelters Hub** | Capacity gauge meters, real-time occupancy headcounts, bed availability, life-support supply ratings (Adequate, Moderate, Critical), humanitarian amenities checklists, and quick occupancy update modal. | **Complete** |
| **Relief Supply Inventory** | Strategic inventory (Inflatable rescue boats, dewatering pumps, trauma kits, rations, chemical ensembles, micro-inverters); status tracking; stock dispatch workflow to responder units. | **Complete** |
| **Tactical Dispatch Board** | Kanban-style workflow (Triage & Staging, En Route, On Scene, Completed); priority indicators; task issuance modal; one-click status transitions; alternative list view. | **Complete** |
| **Operations Analytics** | Recharts quantitative dashboards: response latency vs SLA targets, vulnerable populations by region, shelter occupancy distributions, and relief stock burn rates. | **Complete** |
| **Alerts & Warning Node** | OASIS Common Alerting Protocol (CAP v1.2) broadcast center; multi-channel dissemination toggles (Cell Broadcast CB-4370, Acoustic Siren, Mass SMS, FM Radio); commander acknowledgment flow. | **Complete** |
| **System Settings & RBAC** | Telemetry polling cadence adjustment (5s, 15s, 60s), offline resilient caching preferences, acoustic chime toggles, role permission matrix reference table, and Factory Demo Reset. | **Complete** |
| **Compliance & Audit Trail** | Non-repudiation audit ledger logging every operational transaction (incident creation, dispatch, alert broadcast, status modification) with actor identity, timestamp, IP, and CSV / JSON export. | **Complete** |
| **Public Emergency Portal** | Public-facing emergency bulletin on `/` with active civil warnings, verified helplines (1078, 112, 1070), citizen safety guidelines, and responder terminal launch. | **Complete** |

### Honestly Deferred to Later Phases (Phase 2 - Phase 5)

- **Phase 2**: Relational PostgreSQL database integration (via Cloud SQL/Drizzle ORM) replacing resilient localStorage; production multi-agency OAuth/JWT authentication server; WebSocket real-time subscription synchronization.
- **Phase 3**: Automated satellite SAR/weather raster overlays and predictive flood inundation depth mapping.
- **Phase 4**: Offline peer-to-peer mesh synchronization for field responders with zero cellular connectivity.
- **Phase 5**: AI-assisted situational reports synthesis, automated CAP XML feed distribution, and drone telemetry ingest.

---

## 3. Technology Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (Deep charcoal `#0d1117`, warm off-white, muted forest green, amber, restrained crimson)
- **Visualizations**: Recharts (Pie, Bar, Layout charts with interactive drilldown)
- **Icons**: Lucide React
- **Typography**: Plus Jakarta Sans & JetBrains Mono (`tabular-nums` for all telemetry)

---

## 4. Local Setup & Execution Guide

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher
- Modern Chromium or WebKit browser

### Quickstart Commands

```bash
# 1. Clone the repository
git clone https://github.com/singhrohit09/RAKSHAGRID.git
cd RAKSHAGRID

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env

# 4. Verify TypeScript linting and type checking
npm run lint

# 5. Build for production verification
npm run build

# 6. Launch development command node
npm run dev
```

The application runs on `http://localhost:3000`.

---

## 5. Pre-Configured Operational Personas (Phase 1 Dev Mode)

To test role-based access control and operational permissions, switch personas anytime via the top-right profile dropdown or the `/login` portal:

1. **Incident Commander**: Col. Rajesh Verma (`r.verma@ndrf.gov.in`)
   - *Permissions*: Issue CAP alerts, dispatch response teams, triage incidents, review audit logs.
2. **Administrator**: Kavita Sharma (`kavita.sharma@sdma.gov.in`)
   - *Permissions*: Full operational access, delete records, modify system configurations, manage personnel.
3. **Field Responder**: Inspector Amit Kumar (`amit.kumar@sdrf.gov.in`)
   - *Permissions*: Log on-scene incidents, update tactical tasks, report casualty counts.
4. **Logistics Officer**: Pooja Nair (`p.nair@redcross.org.in`)
   - *Permissions*: Dispatch relief stockpiles, manage shelter headcounts, track resource burn rates.
5. **Read-Only Analyst**: Dr. Sunita Rao (`s.rao@imd.res.in`)
   - *Permissions*: Geospatial and analytics observation without write privileges.

---

## 6. Audit & Test Verification Report

- **Type Check (`tsc --noEmit`)**: **PASSED** (0 errors)
- **Vite Production Build (`npm run build`)**: **PASSED** (Output in `/dist`)
- **Accessibility & Anti-Slop Audit**: Single elevation depth, unboxed metadata with `·` separators, tabular figures for all data columns, zero non-functional controls, zero broken images.
