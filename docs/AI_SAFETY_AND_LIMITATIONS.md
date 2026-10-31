# RakshaGrid — Phase 4 AI Safety, Governance & Limitations

**Project**: RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform  
**Active Phase**: Phase 4 — Multi-Agent AI & Disaster Intelligence  
**Authorized Repository**: `https://github.com/singhrohit09/RAKSHAGRID.git`

---

## 1. Safety Principles & Guardrails

Disaster coordination requires high-reliability engineering. Misleading predictions, uncalibrated risk scores, or autonomous dispatching during extreme events create liability and direct threat to human life.

RakshaGrid adheres to five non-negotiable safety guardrails:

```
                    +------------------------------------+
                    |        5 SAFETY GUARDRAILS         |
                    +------------------------------------+
                                      |
         +----------------------------+---------------------------+
         |                            |                           |
         v                            v                           v
+------------------+         +------------------+        +------------------+
| 1. NO AUTONOMOUS |         | 2. HUMAN-IN-THE- |        | 3. TRUTHFUL DATA |
|    MUTATIONS     |         |    LOOP APPROVAL |        |    PROVENANCE    |
| - Zero auto-team |         | - Recommendations|        | - Clear Live vs  |
|   dispatch       |         |   staged pending |        |   Simulated tags |
| - Zero auto-SMS  |         | - Commander gate |        | - Never invent   |
| - Zero inventory |         | - Real audit log |        |   telemetry      |
|   depletion      |         |   attribution    |        | - Honest fallback|
+------------------+         +------------------+        +------------------+
         |                                                        |
         +----------------------------+---------------------------+
                                      |
         +----------------------------+---------------------------+
         |                                                        |
         v                                                        v
+------------------+                                     +------------------+
| 4. ISOLATED      |                                     | 5. BOUNDED TIME  |
|    SANDBOX LAB   |                                     |    & RECURSION   |
| - Read-only live |                                     | - 15s max timeout|
|   production data|                                     | - Input sanit-   |
| - Zero alerts in |                                     |   ization guards |
|   simulation     |                                     | - No recursion   |
+------------------+                                     +------------------+
```

---

## 2. Permitted Actions vs. Strict Prohibitions

| Capability Domain | Permitted for AI Agents | Strictly Prohibited for AI Agents |
|---|---|---|
| **Incident Management** | Ingest telemetry, compute urgency score, recommend priority (P1–P4), suggest next operational steps. | Changing official incident status (`Reported` -> `Closed`), altering incident coordinates, or deleting incidents. |
| **Team Operations** | Match skills to categories, compute spherical distance, recommend candidate teams. | Dispatching teams, modifying team status to `Deployed` autonomously, overriding commander orders. |
| **Logistics & Inventory** | Suggest kit quantities, detect shortages, flag low thresholds. | Deducting warehouse inventory or creating inventory movements without approval. |
| **Public Alerting** | Formulate recommended safety precautions, draft civil advisories. | Dispatching public siren alerts, sending cellular SMS, or broadcasting webhooks. |
| **Disaster Simulation** | Synthesize stress-test scenarios, project bottlenecks, compare countermeasure strategies in sandbox. | Modifying live database records, injecting synthetic records into production feeds. |

---

## 3. Truthful Data Provenance

1. **Hydrological Data**: If Central Water Commission (CWC) or GloFAS physical IoT sensor streams are operating from baseline models rather than live hardware, the system explicitly marks:
   - `isLive: false`
   - `isSimulated: true`
   - `source: "Central Water Commission (CWC) Monitored Baseline (Simulated)"`
2. **Meteorological Data**: If the Open-Meteo external service experiences a network outage, the system falls back to the offline baseline with:
   - `isLive: false`
   - `isSimulated: true`
   - `source: "RakshaGrid Offline Meteorological Baseline (Simulated)"`
   - `isDegraded: true`
3. **Provider Attribution**: When running without external API credentials or during LLM failures, the system labels responses as:
   - `provider: "rule-based-engine"`
   - `providerDescription: "RakshaGrid Deterministic Analytical Engine (Local Operational Intelligence)"`
   - **Never** falsely describes deterministic rule analysis as neural LLM generation.

---

## 4. Known Technical Limitations

1. **Spherical Distance vs. Real-Time Navigational Routing**:
   - The Resource Allocation Agent currently computes great-circle distance using the **Haversine formula**.
   - In actual flood scenarios, bridges may be submerged or roads washed out. True travel time requires real-time integration with road transport graph networks (e.g. OpenStreetMap OSRM routing with road inundation overlays).
2. **Hydrological IoT Sensor Access**:
   - Live GloFAS catchments provide runoff modeling, but direct physical stage gauges along Indian river embankments currently operate from baseline models unless authenticated CWC IoT credentials are provided.
3. **Single-Process Rate Limiter**:
   - The Express middleware rate limiter uses an in-memory `Map`.
   - In horizontal multi-node Kubernetes clusters, synchronization requires an external Redis store.
4. **LLM Context Window & Token Latency**:
   - Under heavy external LLM network latency (2–4 seconds), the system gracefully uses local deterministic heuristics. Operators can explicitly configure `AI_PROVIDER="none"` to enforce zero-latency local analytical operations.

