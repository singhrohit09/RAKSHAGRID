# RakshaGrid — Hackathon Demonstration Script
**AGENTCRAFT 2026 Live Presentation & Evaluation Runbook**

---

## Demonstration Overview

- **Audience:** Hackathon Technical Judges, Disaster Management Specialists, and System Evaluators.
- **Duration:** 5 to 7 Minutes.
- **Narrative Context:** Severe Cyclonic Storm "VARUN" is making landfall along the Eastern Coastal Corridor, triggering extreme precipitation (180mm/6hr), tidal storm surge (+3.2m), and catastrophic breach threats along the Subarnarekha River Basin.
- **Objective:** Demonstrate end-to-end operational flow from citizen awareness to AI multi-agent decision support, geospatial command, what-if catastrophe simulation, and human-in-the-loop tactical execution.

---

## Act 1: The Citizen View & Public Portal (1 Minute)

1. **Starting Point:** Open the home page (`/` or `/?view=public`).
2. **Presenter Script:**
   > *"When disaster strikes, ordinary citizens need instant, clutter-free life safety instructions. This is the RakshaGrid Public Portal. No login required, highly optimized for low-bandwidth mobile devices."*
3. **Actions to Demonstrate:**
   - Point out the active **Red Alert Banner** broadcasting immediate flash flood evacuation notices.
   - Click on the **Nearest Relief Shelter** locator: Show citizens can check live capacity (e.g., Cuttack Municipal Hall: 72% full) and get immediate routing directions.
   - Point out the 24/7 verified emergency helplines (NDRF, Police, Fire, Ambulance).
4. **Transition:** Click **"Command Grid Login"** in the header.

---

## Act 2: Role-Based Access Control & EOC Command (1 Minute)

1. **Page:** `/login`
2. **Presenter Script:**
   > *"Now let's switch into the Emergency Operations Center. RakshaGrid enforces strict Role-Based Access Control across 5 distinct personas. For this demo, let's log in as Senior Incident Commander Sharma."*
3. **Actions to Demonstrate:**
   - Click the **"Incident Commander"** 1-click demo login badge.
   - Show the instant redirection to the **Operations Dashboard** (`/dashboard`).
   - Highlight the **Common Operating Picture (COP)**: Active Incidents (4 critical), Teams Deployed (8 units), Shelters Online, and Active CAP Alerts.
   - Press `Cmd+K` (or click search): Show the tactical global search indexing incidents, response teams, and relief warehouses in milliseconds.

---

## Act 3: Live Geospatial Intelligence & GIS Map (1.5 Minutes)

1. **Page:** Navigate to **Live Map** (`/map`).
2. **Presenter Script:**
   > *"Here is RakshaGrid's real-time geospatial intelligence engine. Powered by Leaflet and Turf.js, commanders can visualize compound hazards across multi-layer spatial layers."*
3. **Actions to Demonstrate:**
   - Show the **CartoDB Dark Matter** tactical base layer.
   - Toggle the layer controls:
     - Turn on **Hazard Buffer Zones** (15km critical radius around Riverfront Flash Flood).
     - Turn on **River Gauges** (Show Gauge #02 at Danger Level 44.8m).
     - Turn on **Shelter Occupancy Rings** and **Field Teams**.
   - Click on the **"Flash Flood - Riverfront Sector 4"** incident pin:
     - Show the popup displaying severity, affected population (1,450 citizens), assigned team, and the **"Analyze Spatial Proximity"** action.
   - Click **"Analyze Proximity"**:
     - Turf.js computes geodesic distances to all nearby relief shelters and available NDRF battalions in real time.

---

## Act 4: AI Multi-Agent Swarm & Situation Awareness Report (2 Minutes)

1. **Page:** Navigate to **AI Intelligence Center** (`/ai-intelligence`).
2. **Presenter Script:**
   > *"This is the brain of RakshaGrid. Rather than a fragile monolithic LLM call, we built a 7-agent hierarchical swarm orchestrated by a Chief Intelligence Orchestrator. Let's trigger a full swarm execution."*
3. **Actions to Demonstrate:**
   - Click **"Execute Multi-Agent Swarm"**.
   - Show the real-time execution animation as all 7 domain agents run in parallel:
     - Weather Intelligence Agent: Detects 180mm rain rate.
     - Hydrology Agent: Flags Gauge #02 breaching danger threshold.
     - Resource Optimization Agent: Identifies 2,000 IV packet deficit.
     - Shelter Management Agent: Flags Cuttack Relief Camp at 92% capacity.
   - Expand the **Chief Orchestrator’s Situation Awareness Report (SAR)**:
     - Point out the composite risk score (88/100 - CRITICAL).
     - Point out the **Multi-Factor Explainable Breakdown**: Every weight and calculation is 100% transparent and auditable.
     - Highlight the human-in-the-loop safeguards: AI proposes; human commanders decide.

---

## Act 5: What-If Disaster Scenario Simulator & CAP Alert Dispatch (1.5 Minutes)

1. **Actions to Demonstrate in Scenario Simulator:**
   - Scroll to the **Disaster Scenario Simulator** panel.
   - Adjust the parameters:
     - Set Rainfall Multiplier to `2.5x`
     - Set River Surge to `+3.5 meters`
     - Toggle `Power Grid Outage: ON`
     - Toggle `Key Bridge Collapse: ON`
   - Click **"Run What-If Simulation"**:
     - Emphasize to the judges: *Notice the permanent amber watermark `HYPOTHETICAL SIMULATION ONLY`. This pure function guarantees that live operational records are never corrupted.*
     - Review the projected impact: Affected population increases from 3,200 to 8,900; 3 shelters inundated; critical resource deficit identified.
2. **Human-in-the-Loop Action Execution:**
   - Scroll to **AI Recommended Tactical Actions**.
   - Click **"Authorize Tactical Dispatch"** for NDRF Battalion 04.
   - Click **"Stage CAP Emergency Alert"**:
     - Review the Common Alerting Protocol warning generated by the alert agent.
     - Click **"Broadcast Emergency Alert"**.
   - Navigate to `/audit-log`:
     - Show the judges the immutable, non-repudiable audit event recorded with actor name, role, timestamp, and action hash.

---

## Conclusion & Judge Takeaway (30 Seconds)

> *"RakshaGrid demonstrates that disaster AI does not replace human judgment—it accelerates it. By combining multi-agent situational intelligence, explainable mathematical risk modeling, real-time geospatial tracking, and resilient offline persistence, RakshaGrid delivers the next-generation operating system for disaster management."*
