# RakshaGrid — Phase 4 AI REST API Documentation

**Base URL**: `/api/ai`  
**Authentication**: Bearer Token in `Authorization` header (`Bearer <token>`) or HttpOnly session cookie (`raksha_session`).  
**Security**: All state-mutating requests require CSRF header `X-Raksha-CSRF: 1` or standard CORS origin validation.

---

## 1. System Health & Agent Discovery

### `GET /api/ai/health`
Retrieves operational status of the AI Provider (LLM or deterministic rule-based engine) and registered agent counts.
- **Authentication**: None required (public health check).
- **Response `200 OK`**:
```json
{
  "success": true,
  "service": "RakshaGrid Multi-Agent AI Intelligence Engine",
  "provider": {
    "name": "External LLM (GEMINI)",
    "type": "external-llm",
    "model": "gemini-1.5-flash",
    "status": "operational",
    "message": "Connected to model gemini-1.5-flash with automated fallback."
  },
  "registeredAgentsCount": 5,
  "timestamp": "2026-10-31T17:48:32.000Z"
}
```

### `GET /api/ai/agents`
Lists all five registered AI agents with operational status, version, and permitted tools.
- **Permission**: Authenticated user.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "disaster_risk",
      "name": "Disaster Risk Intelligence Agent",
      "role": "Multi-Hazard Risk Assessment & Geospatial Exposure Analyzer",
      "version": "1.0.0",
      "status": "online",
      "lastExecutionAt": "2026-10-31T17:48:32.000Z",
      "lastExecutionStatus": "COMPLETED",
      "permittedTools": ["OpenMeteoWeather", "HydrologyTelemetricEngine", "GeofenceSpatialEvaluator", "IncidentRegistry"]
    }
  ]
}
```

### `GET /api/ai/agents/:id`
Retrieves detailed descriptor for a single agent (`disaster_risk`, `incident_prioritization`, `resource_allocation`, `response_coordinator`, `disaster_simulation`).

---

## 2. Agent Execution Endpoints

### `POST /api/ai/risk/analyze`
Triggers regional disaster risk analysis.
- **Permission**: `run_ai_analysis` (Admin, Commander, Analyst, Logistics, Responder).
- **Request Body**:
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "radiusKm": 35,
  "focusRegionName": "National Capital Region"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "executionId": "exec_1793449129000_abc12",
  "status": "COMPLETED",
  "durationMs": 420,
  "data": {
    "overallRiskLevel": "MODERATE",
    "overallRiskScore": 38,
    "confidenceScore": 92,
    "affectedAreas": [
      {
        "areaName": "Yamuna Floodplain (Zone O)",
        "latitude": 28.665,
        "longitude": 77.232,
        "radiusMeters": 4500,
        "riskLevel": "HIGH",
        "riskScore": 58,
        "hazardTypes": ["flood", "heavy_rainfall"],
        "recommendedPrecautions": ["Enforce non-entry into riparian low-water zones."]
      }
    ],
    "primaryContributingFactors": ["Heavy atmospheric precipitation", "River gauge surge at Old Railway Bridge"],
    "recommendedPrecautions": ["Monitor local municipal waterlogging advisories."],
    "dataSources": [
      {
        "source": "Open-Meteo Meteorological Service",
        "isLive": true,
        "isSimulated": false,
        "isCached": false
      }
    ]
  }
}
```

### `POST /api/ai/incidents/prioritize`
Triages all active, non-closed incidents.
- **Permission**: `run_ai_analysis`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "executionId": "exec_1793449130000_def34",
  "status": "COMPLETED",
  "durationMs": 280,
  "data": {
    "prioritizedIncidents": [
      {
        "incidentId": "INC-001",
        "title": "Submerged Embankment Road",
        "currentPriority": "P2",
        "recommendedPriority": "P1",
        "priorityChanged": true,
        "reason": "Urgent escalation indicated due to cumulative impact score (85/100).",
        "supportingEvidence": ["Reported as Critical severity level", "3 confirmed casualties reported"],
        "confidenceScore": 94,
        "suggestedNextAction": "Immediately authorize rapid deployment of closest available rescue squad.",
        "urgencyScore": 85,
        "escalationNeeded": true
      }
    ],
    "escalationsCount": 1,
    "criticalCount": 1,
    "confidenceScore": 94
  }
}
```

### `POST /api/ai/resources/recommend`
Matches available response teams and inventory supplies to active incidents.
- **Permission**: `run_ai_analysis`.
- **Request Body** (optional):
```json
{
  "targetIncidentId": "INC-001"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "executionId": "exec_1793449131000_ghi56",
  "status": "COMPLETED",
  "durationMs": 310,
  "data": {
    "teamRecommendations": [
      {
        "recommendationId": "rec_team_INC-001_TEAM-01",
        "targetIncidentId": "INC-001",
        "targetIncidentTitle": "Submerged Embankment Road",
        "suggestedTeamId": "TEAM-01",
        "suggestedTeamName": "NDRF Quick Response Team 1",
        "teamType": "Water Rescue",
        "teamStatus": "Available",
        "estimatedDistanceKm": 6.8,
        "confidenceScore": 92,
        "approvalStatus": "pending"
      }
    ],
    "supplyRecommendations": [
      {
        "recommendationId": "rec_res_INC-001_RES-01",
        "targetIncidentId": "INC-001",
        "resourceId": "RES-01",
        "resourceName": "Inflatable Motor Boats (Gemini)",
        "availableQuantity": 12,
        "recommendedQuantity": 4,
        "unit": "units",
        "confidenceScore": 88,
        "approvalStatus": "pending"
      }
    ],
    "shortages": [],
    "confidenceScore": 92
  }
}
```

### `POST /api/ai/coordinator/run`
Executes natural-language operational multi-agent coordination.
- **Permission**: `run_ai_analysis`.
- **Request Body**:
```json
{
  "query": "Analyze flood hazard and recommend logistics allocations"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "executionId": "coord_1793449132000_jkl78",
  "status": "COMPLETED",
  "durationMs": 680,
  "data": {
    "userQuery": "Analyze flood hazard and recommend logistics allocations",
    "intent": "Operational Coordination & Action Planning",
    "agentsInvoked": [
      { "agentId": "disaster_risk", "status": "COMPLETED", "durationMs": 280, "confidenceScore": 92 },
      { "agentId": "resource_allocation", "status": "COMPLETED", "durationMs": 310, "confidenceScore": 92 }
    ],
    "consolidatedSummary": "Multi-agent emergency coordination complete...",
    "urgentSituations": ["Regional Disaster Risk elevated to HIGH (Score: 68/100)"],
    "conflictingRecommendations": [],
    "synthesizedActionPlan": [
      {
        "stepNumber": 1,
        "phase": "immediate",
        "action": "Review and authorize pending deployment of quick-response teams to top-ranked P1 incidents.",
        "assignedRole": "Incident Commander",
        "priority": "P1",
        "requiresHumanApproval": true
      }
    ]
  }
}
```

### `POST /api/ai/simulation/run`
Runs synthetic disaster scenario simulation in an isolated sandbox.
- **Permission**: `run_disaster_simulation` (Admin, Commander, Analyst).
- **Request Body**:
```json
{
  "scenarioName": "Yamuna Cloudburst Stress Test",
  "rainfallIntensityMmPerHour": 80,
  "riverGaugeRiseMeters": 2.5,
  "simultaneousIncidentsCount": 4,
  "targetRegion": "Yamuna Riparian Corridor (Zone O)"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "executionId": "exec_1793449133000_mno90",
  "status": "COMPLETED",
  "durationMs": 350,
  "data": {
    "simulationId": "sim_1793449133000_xyz12",
    "scenarioName": "Yamuna Cloudburst Stress Test",
    "isSimulatedSandbox": true,
    "warningNotice": "SANDBOX SIMULATION ENVIRONMENT — ALL SCENARIOS, ELEVATIONS, AND CASUALTIES ARE SYNTHETIC. ZERO LIVE PRODUCTION INCIDENTS OR RESOURCES MODIFIED.",
    "simulatedIncidents": [
      { "id": "sim_inc_1", "title": "[SIMULATED] Simulated Embankment Breach at Usmanpur", "severity": "Critical", "lat": 28.675, "lng": 77.251, "estimatedAffectedPopulation": 1200 }
    ],
    "potentialBottlenecks": ["Shelter Bed Deficit: Projected evacuee surge exceeds available operational beds."],
    "strategyComparisons": [
      {
        "strategyName": "Strategy A: Pre-Emptive Evacuation & Upstream Relief Staging",
        "evacuationEfficiencyPct": 91,
        "recommended": true
      }
    ]
  }
}
```

---

## 3. Human Approval Workflow Endpoints

### `GET /api/ai/recommendations`
Lists recommendations filtered by approval status.
- **Query Parameters**: `status` (`pending` | `approved` | `rejected`), `limit` (default: 25).
- **Response `200 OK`**: Array of `RecommendationRecord`.

### `POST /api/ai/recommendations/:id/approve`
Authorizes an AI recommendation and atomically executes the real domain action.
- **Permission**: `approve_ai_recommendations` (Admin, Commander).
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Recommendation 'Deploy NDRF Team 1 to Submerged Embankment Road' approved and executed successfully."
}
```

### `POST /api/ai/recommendations/:id/reject`
Rejects an AI recommendation with an explanation.
- **Permission**: `approve_ai_recommendations`.
- **Request Body**:
```json
{
  "reason": "Tactical priority overridden by field commander."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Recommendation has been rejected."
}
```

---

## 4. Execution & Simulation Ledgers

### `GET /api/ai/executions`
Paginated execution history with filter options.
- **Query Parameters**: `page`, `limit`, `agentName`, `status`.

### `GET /api/ai/executions/:id`
Retrieves full execution trace, including input summary, output summary, and structured output.

### `GET /api/ai/simulations`
Paginated history of past sandbox simulation runs.

### `GET /api/ai/simulations/:id`
Retrieves a specific simulation record.

