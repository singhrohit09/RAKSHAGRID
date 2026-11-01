# RakshaGrid — Disaster Intelligence. Coordinated Response. Safer Communities.

> **AGENTCRAFT 2026** · **Phase 5: Production Hardening, Deployment, Security & Final Hackathon Readiness**  
> **Authorized GitHub Repository:** [https://github.com/singhrohit09/RAKSHAGRID.git](https://github.com/singhrohit09/RAKSHAGRID.git)  
> **Production Status:** VERIFIED PRODUCTION READY (29/29 Automated Tests Passed)

---

## 1. Executive Summary

**RakshaGrid** is a mission-critical Disaster Intelligence and Coordinated Emergency Response Platform designed for Emergency Operations Centers (EOCs), first responders (NDRF, SDRF, Fire, Police), and citizens.

In extreme weather and geological emergencies—such as coastal cyclones, sudden flash floods, dam discharge surges, and industrial hazards—RakshaGrid unifies fragmented telemetry feeds into an authoritative **Common Operating Picture (COP)** powered by an explainable 7-agent AI swarm, Leaflet/Turf.js geospatial GIS tracking, and resilient offline state persistence.

---

## 2. Five-Phase Implementation Architecture

| Phase | Focus Area | Key Deliverables & Capabilities |
| :---: | :--- | :--- |
| **Phase 1** | Application Foundation & Core Ops | Command layout, incidents CRUD, response force tracking, relief shelter capacity, logistics inventory, tasks, and analytics. |
| **Phase 2** | Access Control & Public Citizen Portal | 5 RBAC personas (Admin, Commander, Responder, Logistics, Analyst), protected route guards, Supabase Auth, and public citizen portal. |
| **Phase 3** | Live Geospatial GIS Intelligence | Multi-layer Leaflet GIS map, CartoDB Dark Matter, Turf.js geodesic calculations, dynamic hazard buffer zones, and CWC river gauge sensors. |
| **Phase 4** | AI Disaster Intelligence & Multi-Agent Swarm | 7-agent swarm, Chief Orchestrator, explainable multi-factor risk engine, what-if scenario simulator, and human-in-the-loop CAP alert staging. |
| **Phase 5** | Production Hardening, Security & Deployment | Route-level code splitting, subsystem error boundaries, offline/reconnect detection, SPA routing, security audit, and 29 automated tests. |

---

## 3. Key Differentiators & Engineering Highlights

1. **Hierarchical 7-Agent Swarm with Deterministic Fallbacks:**
   - 7 domain specialists: Weather, Hydrology, Disaster, Resource, Shelter, Emergency Planning, and Infrastructure.
   - Operates with Google Gemini API when available and falls back gracefully to deterministic mathematical algorithms if disconnected or rate-limited.
2. **Transparent, Explainable Multi-Factor Risk Engine:**
   - Decomposes disaster risk: Hydro-Meteorological (0.25) + Vulnerability & Severity (0.25) + Population Exposure (0.20) + Shelter Saturation (0.15) + First-Responder Proximity (0.15).
   - Generates auditable factor scorecards rather than black-box AI outputs.
3. **Isolated What-If Scenario Sandbox:**
   - Real-time simulation of compound disasters (e.g. 2.5x rainfall + bridge collapse + dam release) as a pure mathematical function.
   - Guaranteed zero mutation of baseline operational records with permanent simulation watermarks.
4. **Human-in-the-Loop Sovereign Authority:**
   - AI models strictly recommend; life-critical actions (deploying teams, allocating rations, transmitting CAP broadcast alerts) require authenticated human commander signatures.
5. **Zero-Downtime Resilience & Offline Architecture:**
   - Subsystem Error Boundaries prevent component exceptions from crashing the application.
   - Network drop detection displays tactical local cache banners and auto-synchronizes upon reconnection.

---

## 4. Documentation Suite

The complete engineering and evaluation documentation suite is available in the `docs/` directory:

- [**Phase 5 Master Verification & Quality Audit**](docs/PHASE_5_FINAL_AUDIT.md) — Feature-by-feature verification across all 5 phases with honest status classifications.
- [**Security Audit & Vulnerability Assessment**](docs/SECURITY_AUDIT.md) — Threat modeling, RBAC matrix, RLS policy verification, and prompt injection defense.
- [**Production Deployment Guide**](docs/DEPLOYMENT_GUIDE.md) — Step-by-step setup for Vercel, Supabase, Cloudflare, environment variables, and rollback runbooks.
- [**Hackathon Demonstration Script**](docs/HACKATHON_DEMO_SCRIPT.md) — 5-minute judge demonstration script modeling severe cyclone landfall and flash flood response.
- [**System Architecture Specification**](docs/SYSTEM_ARCHITECTURE.md) — High-level topological and layer-by-layer architectural breakdown.
- [**AI Multi-Agent Architecture**](docs/AI_AGENT_ARCHITECTURE.md) — Swarm structure, consensus mechanisms, and grounding safeguards.
- [**Data Flow Specification**](docs/DATA_FLOW.md) — Lifecycle diagrams from incident submission to tactical dispatch and audit logging.
- [**Known Limitations & Roadmap**](docs/KNOWN_LIMITATIONS.md) — Transparent documentation of physical constraints and planned enhancements.

---

## 5. Technology Stack

- **Frontend:** React 19, TypeScript 7.0, Vite 8.3, Tailwind CSS v4, Motion (Framer Motion v12), Lucide React
- **Geospatial & Mapping:** Leaflet 1.9, Turf.js 7.4 (geodesic distance, radial hazard buffers, point-in-polygon)
- **Data Visualizations:** Recharts 3.10
- **AI Engine:** Google Gemini API (`@google/genai` v2.4.0), Multi-Agent Deterministic Swarm
- **Backend & Database:** Supabase JS v2.118, PostgreSQL 15+, Row-Level Security (RLS), Supabase Realtime
- **Quality & Testing:** Node.js Native Test Runner (`tsx --test`), 29 passing automated test suites

---

## 6. Quick Start & Verification Commands

```bash
# 1. Clone the authorized repository
git clone https://github.com/singhrohit09/RAKSHAGRID.git
cd RAKSHAGRID

# 2. Install dependencies
npm install

# 3. Run automated test suite (29 tests)
npm test

# 4. Run TypeScript compiler type-check
npm run lint

# 5. Build production bundle (Code-split chunks)
npm run build

# 6. Start development server on port 3000
npm run dev
```

---

## 7. License & Compliance
Licensed under the Apache License, Version 2.0. Compliant with OpenGIS spatial standards and ITU-T X.1303 Common Alerting Protocol (CAP).
