# RakshaGrid — Phase 4 AI Architecture Specification

**Project**: RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform  
**Tagline**: "Disaster Intelligence. Coordinated Response. Safer Communities."  
**Active Phase**: Phase 4 — Multi-Agent AI & Disaster Intelligence  
**Authorized Repository**: `https://github.com/singhrohit09/RAKSHAGRID.git`  
**Active Branch**: `main`

---

## 1. Architectural Philosophy

In mission-critical disaster management and civil defense, artificial intelligence must never operate as an autonomous, unconstrained decision-maker. Autonomous dispatches, unvetted alert sirens, or automatic inventory depletion in disaster environments can cost human lives and create chaos.

RakshaGrid Phase 4 introduces a **modular, multi-agent AI architecture with deterministic analytical fallback and strict human-in-the-loop governance**. Every agent operates within clear boundary controls, produces structured explainable outputs with data provenance, and surfaces actionable recommendations that require explicit human commander approval before triggering real-world actions.

```
+-----------------------------------------------------------------------------------------+
|                                    OPERATIONS COMMAND                                   |
|                     (Incident Commander / State Authority / Logistics)                  |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|                         AI EMERGENCY RESPONSE COORDINATOR (Agent 4)                     |
|      - Natural language intent parsing & operational question answering                 |
|      - Parallel/sequential multi-agent dispatch                                         |
|      - Cross-domain conflict detection & 3-phase action plan synthesis                  |
+-----------------------------------------------------------------------------------------+
               |                               |                              |
               v                               v                              v
+-------------------------------+ +----------------------------+ +------------------------+
| DISASTER RISK INTEL (Agent 1) | | INCIDENT INTEL (Agent 2)   | | RESOURCE ALLOC (Agent 3|
| - Live Open-Meteo telemetry   | | - Dynamic triage ranking   | | - Tactical team match  |
| - CWC/GloFAS river telemetry  | | - Urgency scoring (0-100)  | | - Supply distribution  |
| - Active GIS geofences        | | - Aging & casualty impact  | | - Haversine proximity  |
| - Multi-hazard exposure score | | - Escalation advisory      | | - Shortage detection   |
+-------------------------------+ +----------------------------+ +------------------------+
               |                               |                              |
               +-------------------------------+------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------+
|                               CENTRAL AGENT ORCHESTRATOR                                |
|      - Execution lifecycle (PENDING -> RUNNING -> COMPLETED / DEGRADED / FAILED)       |
|      - 15,000ms timeout guards, max call boundaries, and execution ID tracing           |
|      - Database persistence (ai_agent_executions, ai_recommendations)                   |
+-----------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------+
|                                  AI PROVIDER ABSTRACTION                                |
|  [External LLM Integration]                   [Deterministic Analytical Engine]         |
|  - Google Gemini 1.5 Flash / OpenAI           - High-performance local heuristics       |
|  - Backend-only keys, timeout & retries       - Zero external network dependency        |
|  - Fallback on unconfigured or failure        - Always available & transparently tagged |
+-----------------------------------------------------------------------------------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------+
|                             HUMAN-IN-THE-LOOP APPROVAL GATE                             |
|  - Recommendations staged as 'pending'                                                  |
|  - Commander authorization required (POST /api/ai/recommendations/:id/approve)           |
|  - Atomic domain execution (incidents, teams, inventory, shelters)                      |
|  - Comprehensive audit trail recorded (audit_events)                                    |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Multi-Agent Ecosystem

The system comprises five dedicated, specialized agents:

| Agent Identifier | Name | Core Responsibility | Permitted Tools |
|---|---|---|---|
| `disaster_risk` | **Disaster Risk Intelligence Agent** | Correlates atmospheric weather, river gauges, active incidents, and GIS geofences to compute regional risk scores (0–100) and identify flood/storm exposure. | `OpenMeteoWeather`, `HydrologyTelemetricEngine`, `GeofenceSpatialEvaluator`, `IncidentRegistry` |
| `incident_prioritization` | **Incident Intelligence & Prioritization Agent** | Dynamically triages active emergency incidents (P1–P4) based on reported severity, casualties, population density, unaddressed age, and hazard containment. | `IncidentRegistry`, `GeofenceSpatialEvaluator`, `IncidentTimeline` |
| `resource_allocation` | **Smart Resource Allocation Agent** | Matches available response teams, emergency inventory stock, and municipal shelters to active incidents with spatial distance calculations. | `TeamsRegistry`, `ResourceInventory`, `ShelterCapacityLedger`, `HaversineSpatialEngine` |
| `response_coordinator` | **AI Emergency Response Coordinator** | Central command agent that parses operational questions, dispatches specialized agents, flags conflicting recommendations, and synthesizes 3-phase action plans. | `MultiAgentDispatcher`, `ConflictDetector`, `ActionPlanSynthesizer` |
| `disaster_simulation` | **Disaster Simulation Agent** | Pure isolated sandbox to simulate extreme cloudbursts, embankment breaches, simultaneous incidents, and logistics bottlenecks. | `SyntheticScenarioSandbox`, `CountermeasureEvaluator`, `BottleneckSimulator` |

---

## 3. Provider Abstraction & Deterministic Fallback

External LLM APIs (such as Gemini 1.5 Flash or OpenAI GPT-4o-mini) provide fluid semantic summarization and multi-factor synthesis. However, in emergency operations, external cloud APIs may experience rate limiting, internet disconnections, or lack configured credentials.

### Fallback Guarantee:
1. **Zero-Configuration Operation**: When `AI_API_KEY` is omitted, the platform automatically activates the **RakshaGrid Deterministic Analytical Engine (`RuleBasedEngine`)**.
2. **Honest Provenance Attribution**: The provider name is clearly logged as `rule-based-engine` (`RakshaGrid Deterministic Analytical Engine (Local Operational Intelligence)`). The system **never** fabricates LLM reasoning.
3. **Automatic Fault Tolerance**: If external API calls fail or exceed the 10-second timeout, the system executes two retries with exponential backoff before cleanly falling back to the deterministic engine.
4. **Credential Security**: All AI keys reside exclusively in backend environment variables (`AI_API_KEY`). They are never exposed in frontend bundles, browser console output, or client API responses.

---

## 4. Central Orchestrator & Execution Lifecycle

The central orchestrator (`server/services/ai/orchestrator.ts`) manages all agent invocations:

### Execution States:
- `PENDING`: Initial registration and parameter validation.
- `RUNNING`: Execution dispatched to provider or analytical engine.
- `COMPLETED`: Agent executed cleanly within timeout constraints.
- `DEGRADED`: Agent executed successfully, but underlying data (such as live weather) was simulated or partially offline.
- `FAILED`: Agent threw an uncaught error; captured in execution ledger without crashing the server.

### Safety Boundaries:
- **Maximum Execution Time**: Enforces a strict 15,000 ms timeout per agent via `Promise.race()`.
- **Recursion Guard**: Agents cannot execute recursive sub-agent loops; all dispatches are centrally managed by the Orchestrator.
- **Input Sanitization**: Geographic coordinates are bounded (-90 to +90 lat, -180 to +180 lng), query lengths are capped at 1,000 characters, and simulation parameters are clamped within realistic ranges.

---

## 5. Human-in-the-Loop Governance & Audit Trail

AI agents are strictly forbidden from performing autonomous operational mutations.

### Restricted Autonomous Operations:
- ❌ Direct dispatch of emergency response teams.
- ❌ Direct broadcast of public alert sirens or cellular SMS.
- ❌ Direct changes to official incident priorities or status.
- ❌ Direct allocation or deduction of warehouse inventory stock.
- ❌ Direct alterations to municipal shelter occupancy.

### High-Impact Approval Workflow:
1. When Agent 2 (Incident Triage) or Agent 3 (Resource Allocation) identifies required actions, recommendations are staged into the `ai_recommendations` table with `approval_status = 'pending'`.
2. The recommendation is presented in the **AI Disaster Intelligence Center** with supporting evidence, matching rationale, and estimated travel distances.
3. An authorized Incident Commander or State Administrator approves the recommendation via `POST /api/ai/recommendations/:id/approve`.
4. The backend executes the real database mutation atomically inside `db.transaction()`:
   - Updates `incidents.assigned_team_id`.
   - Updates `teams.status = 'Deployed'`.
   - Records inventory allocation in `inventory_movements`.
   - Appends an entry to `incident_timeline`.
   - Marks the recommendation as `approval_status = 'approved'`.
5. An immutable audit record is recorded in `audit_events` with actor metadata, timestamp, and entity details.

---

## 6. Disaster Simulation Sandbox Isolation

The Disaster Simulation Agent (`Agent 5`) provides a stress-testing laboratory to evaluate emergency countermeasure strategies under extreme scenarios (e.g., 90 mm/hr cloudburst with a +3.0m river gauge rise).

### Sandbox Isolation Rules:
- **Read-Only Production Context**: The simulation agent reads current production baseline numbers (e.g. available teams, total warehouse stock, shelter bed counts) for comparative contrast, but **never writes** to production tables (`incidents`, `teams`, `resources`, `shelters`, `alerts`).
- **Simulated Ledgers Only**: Outputs are stored exclusively in the `ai_simulation_records` audit table.
- **Notification Suppression**: Under no circumstances can a simulated scenario trigger SMS broadcasts, webhook relays, or in-app alerts.
- **Visual Warning**: Every simulation result carries an explicit `isSimulatedSandbox: true` flag and renders an unmissable amber banner in the user interface.

