# RakshaGrid — National Hackathon & Competition Demonstration Guide

**Project Name**: RakshaGrid  
**Subtitle**: Disaster Intelligence and Coordinated Emergency Response Platform  
**Tagline**: *"Disaster Intelligence. Coordinated Response. Safer Communities."*  
**Authorized Repository**: `https://github.com/singhrohit09/RAKSHAGRID.git`

---

## 1. Executive Summary & Problem Statement

India faces severe multi-hazard disaster vulnerabilities across cyclones, riverine flooding, landslides, and urban seismic threats. Emergency operations centers (EOCs) often suffer from:
1. **Fragmented situational awareness**: Weather forecasts, GIS polygons, shelter registries, and team rosters exist in disparate siloes.
2. **Decision paralysis during crisis onset**: Commanders lack real-time predictive risk scoring to allocate finite NDRF/SDRF assets before catastrophe strikes.
3. **Unsafe autonomous AI risk**: Black-box AI that takes unilateral operational actions risks lives and creates liability.

**RakshaGrid solves this with**:
- **Multi-Agent Disaster Intelligence**: 5 specialized AI agents (Risk Intelligence, Incident Prioritization, Smart Resource Allocation, Emergency Coordinator, and Isolated Simulation).
- **Human-in-the-Loop Governance**: AI generates mathematically proven recommendations with confidence scores; operational mutations require authorized Commander sign-off.
- **GIS Geofencing & Spatial Intelligence**: Interactive Leaflet maps with live Open-Meteo weather and river telemetry.
- **Enterprise Security & Concurrency Safety**: Strict RBAC, session security, atomic database transactions, and an unforgeable SQL audit ledger.

---

## 2. Presenter Preparation & Demo Persona Roster

Before presenting, ensure the local or hosted instance is running with a clean baseline state.

### Persona Accounts:

| Persona | Name & Callsign | Role & Capabilities |
|---------|-----------------|---------------------|
| **Admin** | `admin@rakshagrid.gov.in` (COMMAND-01) | Full administrative authority, demo reset, system settings, user management |
| **Commander** | `commander@rakshagrid.gov.in` (EOC-ALPHA) | Incident command, AI plan approvals, alert broadcasting, task assignment |
| **Logistics** | `logistics@rakshagrid.gov.in` (SUPPLY-BASE) | Shelter management, inventory intake/deduction, supply coordination |
| **Responder** | `responder@rakshagrid.gov.in` (RESCUE-LEAD-8) | On-the-ground NDRF team lead, field status updates, task execution |
| **Analyst** | `analyst@rakshagrid.gov.in` (IMPACT-OBSERVER) | Read-only analytics, meteorological assessment, casualty modeling |

---

## 3. High-Impact Demonstration Scenarios

```
+-----------------------------------------------------------------------------------------+
|                               HACKATHON DEMO FLOW (8 Mins)                              |
+-----------------------------------------------------------------------------------------+
| Min 0-2: Command Dashboard & Live GIS Map (Odisha Cyclone Telemetry)                    |
| Min 2-4: Multi-Agent AI Risk Scoring & Incident Prioritization                          |
| Min 4-6: Human-in-the-Loop Resource Allocation & Atomic Deduction                       |
| Min 6-7: Isolated Disaster Simulation (7.2 Richter Earthquake Sandbox)                   |
| Min 7-8: Production Architecture, RBAC, Health Probes & Instant Demo Reset              |
+-----------------------------------------------------------------------------------------+
```

---

### Scenario 1: Cyclone Warning on Odisha Coast & Automated Risk Scoring

**Presenter Narrative**:
> *"Let's examine how RakshaGrid monitors impending weather hazards before an incident escalates. On our GIS Command Map, we observe live meteorological telemetry from Open-Meteo overlaid onto our coastal geofences."*

**Click-Through Steps**:
1. Log in or select **Commander (Cmdr. Ananya Sen)** from the persona bar.
2. Navigate to **Operational Map** (`/map`).
3. Toggle the **Weather Layer** and **Geofences**. Point out:
   - High-wind warning polygon centered around Puri / Paradeep.
   - Live temperature, wind velocity, and precipitation fetched directly from Open-Meteo.
4. Navigate to **AI Intelligence** (`/ai-intelligence`).
5. Under **Agent 1: Disaster Risk Intelligence Agent**:
   - Focus coordinates: Odisha Coast (`20.2961`, `85.8245`).
   - Click **Run Risk Analysis**.
6. **Key Highlights to Show Judges**:
   - Risk score (e.g. `84/100 - SEVERE`).
   - Provenance badge clearly indicating live weather inputs vs baseline topological factors.
   - Identified high-risk sectors and actionable mitigation recommendations.

---

### Scenario 2: Urban Flash Flood & Smart Resource Allocation with Human-in-the-Loop

**Presenter Narrative**:
> *"When a sudden urban flash flood strikes Guwahati, multiple high-priority requests arrive simultaneously. Notice how our Smart Resource Allocation Agent optimizes rescue boat and inflatable shelter deployment, but mandates Commander approval before any warehouse inventory is altered."*

**Click-Through Steps**:
1. Navigate to **Incidents** (`/incidents`).
2. Select incident **INC-002: Brahmaputra River Flash Flood** (Status: Active, Priority: Critical).
3. Open the **AI Resource Recommender** card.
4. Click **Generate Allocation Plan**.
5. **Key Highlights to Show Judges**:
   - Agent 3 calculates optimal quantities of Inflatable Rescue Boats and High-Capacity Water Pumps based on affected population (4,200 people) and current warehouse proximity.
   - Notice the status: **PENDING COMMANDER APPROVAL**.
6. Click **Approve Allocation**.
7. Navigate to **Resources** (`/resources`).
   - Demonstrate that the warehouse inventory for Rescue Boats was atomically deducted.
   - Show the **Audit Log** (`/audit`): An immutable audit record `RESOURCE_ALLOCATION_APPROVED` was recorded with actor `Cmdr. Ananya Sen`, timestamp, and target incident ID.

---

### Scenario 3: Disaster Simulation Agent (Isolated Sandbox) for Earthquake Evacuation

**Presenter Narrative**:
> *"How do disaster planners test evacuation strategies without risking live operations? RakshaGrid provides an isolated simulation sandbox powered by Agent 5."*

**Click-Through Steps**:
1. Navigate to **AI Intelligence** (`/ai-intelligence`) -> **Agent 5: Simulation Sandbox**.
2. Select preset scenario: **7.2 Richter Earthquake — Delhi NCR**.
3. Click **Execute Simulation**.
4. **Key Highlights to Show Judges**:
   - Shows predicted secondary hazards: bridge blockages, transformer fires, and hospital overload.
   - **Crucial Safety Guarantee**: The simulation operates in a read-only sandboxed clone. Show the judges the live incidents list — no synthetic simulated incidents leak into the live operational database.

---

## 4. Resetting the Demonstration for Next Judge Panel

Between judging rounds, immediately restore the database to its pristine state:

1. Switch to **Admin (Director Rajesh Verma)**.
2. In the browser or terminal, trigger:
   ```bash
   curl -X POST http://localhost:5000/api/system/reset-demo \
     -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```
   Or click **Reset Demo Environment** in the Admin Settings panel.
3. System responds with HTTP 200: all incident statuses, team positions, warehouse inventories, and shelter occupancies are reset to benchmark initial values in less than 100 milliseconds.

---

## 5. Judge Q&A Cheat Sheet

| Question | Winning Answer |
|----------|----------------|
| **"What if the internet or Open-Meteo goes down during a flood?"** | "RakshaGrid implements graceful degradation. Telemetry is cached with a 30-minute stale window, and offline fallback heuristics activate automatically. The UI clearly labels cached vs live data so commanders never make life-or-death decisions on fabricated numbers." |
| **"Can an AI agent hallucinate and accidentally deploy all rescue boats to the wrong district?"** | "No. We enforce strict Human-in-the-Loop governance. AI agents only produce recommendations with confidence ratings and audit provenance. Physical dispatch and database inventory deduction strictly require authenticated Commander cryptographic approval." |
| **"How does this scale across multiple state disaster agencies?"** | "RakshaGrid is built on portable ANSI SQL supporting PostgreSQL with connection pooling, Docker containerization, route code splitting under 400 kB, and granular RBAC covering Admin, Commander, Responder, Logistics, and Analyst personas." |
