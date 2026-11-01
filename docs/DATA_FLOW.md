# RakshaGrid — End-to-End Data Flow Specification

---

## 1. Incident Lifecycle & Event Propagation

```
 [Citizen / Field Responder]
              |
              | 1. Submit Incident (GPS, Disaster Type, Severity, Population)
              v
     [DataService / API]
              |
              | 2. Validate bounds & sanitize input
              v
  +-----------+-----------+
  |                       |
  v                       v
[Local Cache / Store]   [Supabase PostgreSQL]
  |                       |
  | (Instant UI Update)   | 3. Triggers RLS policy & Realtime Event
  v                       v
[UI Viewports]         [Supabase Realtime Stream]
  - Map Page Markers      |
  - Dashboard Tickers     | 4. Broadcasts to all connected EOC workstations
  - Incident Queue        v
                       [Connected Operator Clients]
```

---

## 2. Multi-Agent AI Assessment Pipeline

```
 [Weather / Hydrology Telemetry] + [Active Incidents] + [Shelter & Resource State]
                                  |
                                  v
                    [Agent Swarm Execution Engine]
          +-----------------------+-----------------------+
          |                       |                       |
          v                       v                       v
   [Weather Agent]         [Flood Agent]           [Shelter Agent]
          |                       |                       |
          +-----------------------+-----------------------+
                                  |
                                  v
                   [Chief Intelligence Orchestrator]
                                  |
            +---------------------+---------------------+
            |                                           |
     (Gemini API Online)                       (Gemini API Offline)
            |                                           |
            v                                           v
[Generative Strategic Synthesis]             [Rule-Based Heuristic SAR]
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    [Situation Awareness Report]
                                  |
                                  v
                    [AI Intelligence Command Center]
            (Commander reviews, modifies, or adopts recommendations)
```

---

## 3. Human-in-the-Loop Action Dispatch & Audit Trail

```
[AI Recommendation: Mobilize Team Alpha-1 to Sector 4 Flood]
                       |
                       v
     [Commander Action: Click "Authorize Dispatch"]
                       |
                       v
      [DataService.updateTeamStatus('TEAM-01', 'deployed')]
                       |
                       v
         [DataService.logCustomEvent(...)]
                       |
  +--------------------+--------------------+
  |                                         |
  v                                         v
[Audit Event Created]                [Team State Updated]
  - Actor: Commander Sharma             - Status: Deployed
  - Action: DISPATCH_TEAM               - Target: Sector 4 Flood
  - Timestamp: 2026-11-01T...           - Viewable across GIS Map
  - Non-repudiation Hash
```
