# RakshaGrid — AI Agent Architecture & Multi-Agent Swarm

---

## 1. Multi-Agent System Overview

RakshaGrid’s AI subsystem does not rely on a monolithic prompt or single LLM call. Instead, it employs a **Hierarchical Multi-Agent Swarm** composed of 7 specialized domain agents and 1 Chief Intelligence Orchestrator.

```
                          +-----------------------------------+
                          |   Chief Intelligence Orchestrator |
                          |  (Synthesizer & Consensus Engine) |
                          +-----------------+-----------------+
                                            |
         +-----------------+----------------+----------------+-----------------+
         |                 |                |                |                 |
+--------v-------+ +-------v-------+ +------v------+ +-------v-------+ +-------v-------+
|  Weather Agent | |  Flood Agent  | | Spatial Agt | | Resource Agt  | | Shelter Agent |
| (Precipitation)| | (River Gauges)| | (Hotspots)  | | (Deficits)    | | (Saturation)  |
+----------------+ +---------------+ +-------------+ +---------------+ +---------------+
         |                 |                                 |                 |
         +--------+--------+                                 +--------+--------+
                  |                                                   |
         +--------v-------+                                  +--------v-------+
         | Emergency Plan |                                  | Infrastructure |
         | (Action Items) |                                  | (Bridge/Grid)  |
         +----------------+                                  +----------------+
```

---

## 2. Specialized Agent Profiles

| Agent Name | Primary Mission | Inputs | Output Artifacts |
| :--- | :--- | :--- | :--- |
| **Weather Intelligence Agent** | Analyzes precipitation rates, wind velocity, barometric pressure trends, and cyclone progression. | OpenWeather API telemetry, meteorological feeds | Threat indicators, precipitation alerts, storm track analysis |
| **Hydrological & Flood Agent** | Monitors river gauge water levels against Warning, Danger, and Historic Record High marks. | CWC/hydrology river gauge sensors, dam discharge rates | Crest alerts, downstream surge forecasts, levee warnings |
| **Disaster Intelligence Agent** | Identifies incident clusters, escalating emergency severity, and geographic hotspot centers. | Active incident reports, casualty counts | Compound disaster classification, hotspot coordinates |
| **Resource Optimization Agent** | Analyzes warehouse stocks vs. field requirements; detects critical deficits before stockouts. | Equipment, rations, medical supplies, water tanks | Prioritized replenishment requests, allocation vouchers |
| **Shelter Management Agent** | Forecasts shelter saturation thresholds, identifies overrun risks, and recommends diversions. | Shelter capacity, current occupancy, vulnerable populations | Evacuation corridor recommendations, overflow alerts |
| **Emergency Planning Agent** | Drafts actionable Incident Action Plans (IAP) aligning available responder units with priority tasks. | Active incidents, available teams, task completion states | Priority operational directives, team task assignments |
| **Infrastructure Risk Agent** | Models road, power grid, telecommunication, and bridge vulnerabilities under hazard load. | Power grid status, transport network data, water depth | Route severances, alternative evacuation corridors |

---

## 3. Grounding & Zero-Hallucination Guardrails

1. **Deterministic Heuristic Fallbacks:**
   Every single agent possesses a deterministic rule-based calculation engine. Even if the Google Gemini API key is absent, rate-limited, or network-disconnected, all agents execute successfully and output accurate mathematical assessments.
2. **Ground-Truth Citations:**
   The AI Assistant (`AIAssistantService`) parses active incident records and binds every recommendation to verified entity IDs (e.g. `[Incident #INC-2026-1042]`, `[River Gauge GAUGE-002: 44.8m]`).
3. **Prompt Injection Defense:**
   Inbound natural language prompts pass through `sanitizePromptInput()`, neutralizing escape sequences, SQL injection phrases (`DROP TABLE`), and system override attempts (`ignore all previous instructions`).
4. **Human-in-the-Loop Sovereign Authority:**
   The AI system is strictly advisory. Dispatching a rescue team, requisitions, or transmitting a Common Alerting Protocol (CAP) warning requires the authenticated physical action of an authorized Incident Commander or Administrator.
