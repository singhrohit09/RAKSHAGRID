# RakshaGrid — Project Overview
**Disaster Intelligence. Coordinated Response. Safer Communities.**
*AGENTCRAFT 2026 Challenge Entry*

---

## 1. Executive Summary

**RakshaGrid** is a mission-critical, AI-powered Disaster Intelligence and Coordinated Emergency Response Platform designed for Emergency Operations Centers (EOCs), disaster management authorities (NDMA/SDMA), first responders, and citizens.

In sudden-onset natural catastrophes—such as flash floods, severe tropical cyclones, dam overflow emergencies, and seismic events—incident commanders face an overwhelming paradox: critical information is fragmented across disparate telemetry feeds, hydrological sensors, field voice reports, and municipal databases, while decisions must be made in seconds to prevent loss of life.

RakshaGrid bridges the operational gap between raw sensor telemetry and life-critical field execution through:
1. **Unified Common Operating Picture (COP):** Real-time spatial tracking of active incidents, deployable responder teams, relief shelters, and logistics inventories on an interactive multi-layer GIS map.
2. **Multi-Agent AI Decision Support:** A 7-agent swarm orchestrated by a Chief Intelligence Orchestrator that continuously monitors weather, hydrology, spatial impact, shelter saturation, and resource deficits to produce actionable Incident Action Plans (IAPs).
3. **Explainable Multi-Factor Risk Scoring:** Transparent, mathematical risk calculations that decompose hazard severity, demographic vulnerability, shelter deficit, and response distance into weighted, auditable metrics.
4. **Human-in-the-Loop Safeguards:** AI models only propose; authorized human commanders retain exclusive authority to dispatch teams, requisition resources, or broadcast Common Alerting Protocol (CAP) public warnings.
5. **Resilient Offline Architecture:** Graceful degradation to local indexed state and mathematical simulation models if upstream cloud APIs or cellular networks fail.

---

## 2. Key Capabilities by Operational Role

| Role | Operational Scope & Capabilities |
| :--- | :--- |
| **Administrator** | Master system configuration, global user lifecycle management, agency provisioning, security policy enforcement, and immutable audit log inspection. |
| **Incident Commander** | Strategic disaster command, AI multi-agent swarm activation, Common Alerting Protocol (CAP) emergency broadcast authoring, tactical team dispatch, and priority resource allocation vouchers. |
| **Logistics Officer** | Real-time shelter occupancy management, critical relief supply inventory tracking, replenishment request processing, and supply deficit balancing. |
| **Field Responder** | Real-time GPS-located field incident reporting, task status progress updates, survivor casualty counts, and on-scene hazard assessments. |
| **Read-Only Analyst** | Situational telemetry observation, geospatial heatmap inspection, historical disaster post-mortem analysis, and analytical data export without mutation privileges. |
| **Public Citizen** | Public disaster portal access, verified active emergency alerts, nearest relief shelter lookup with available capacity, emergency helpline directory, and immediate self-evacuation routing. |

---

## 3. Technology Stack

- **Frontend Core:** React 19, TypeScript 7.0, Vite 8.3
- **Styling & UI:** Tailwind CSS v4, Motion (Framer Motion v12), Lucide React
- **Geospatial & GIS:** Leaflet 1.9, Turf.js 7.4 (geodesic distance, spatial buffers, point-in-polygon)
- **Data Visualizations:** Recharts 3.10
- **AI & Reasoning:** Google Gemini API (`@google/genai` v2.4.0), Multi-Agent Deterministic Fallback Engine
- **Backend & Database:** Supabase JS v2.118, PostgreSQL, Row-Level Security (RLS), Supabase Realtime
- **Resilience Layer:** In-memory fallback cache with localStorage persistence and offline detection
- **Testing & Verification:** Node.js Native Test Runner (`tsx --test`) with 29 passing automated test suites
