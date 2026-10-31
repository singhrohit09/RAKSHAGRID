import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { orchestrator } from '../services/ai/orchestrator.js';
import { providerFactory } from '../services/ai/providers/providerFactory.js';
import { AgentId } from '../services/ai/types.js';

const router = Router();

/**
 * GET /api/ai/health
 * Public or authenticated health status check of AI Provider and registered agents.
 */
router.get('/health', (_req: Request, res: Response) => {
  try {
    const providerHealth = providerFactory.getHealth();
    const agents = orchestrator.getAgents();

    res.json({
      success: true,
      service: 'RakshaGrid Multi-Agent AI Intelligence Engine',
      provider: providerHealth,
      registeredAgentsCount: agents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI system health status',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/agents
 * Lists all registered AI agents with status and capabilities.
 */
router.get('/agents', authenticate, (_req: Request, res: Response) => {
  try {
    const agents = orchestrator.getAgents();
    res.json({
      success: true,
      data: agents
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to list registered agents'
    });
  }
});

/**
 * GET /api/ai/agents/:id
 * Retrieves specific agent metadata and descriptor.
 */
router.get('/agents/:id', authenticate, (req: Request, res: Response) => {
  const agentId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as AgentId;
  const agent = orchestrator.getAgent(agentId);

  if (!agent) {
    res.status(404).json({
      success: false,
      error: `Agent '${agentId}' not found.`
    });
    return;
  }

  res.json({
    success: true,
    data: agent
  });
});

/**
 * POST /api/ai/risk/analyze
 * Triggers Agent 1: Disaster Risk Intelligence Agent.
 */
router.post('/risk/analyze', authenticate, requirePermission('run_ai_analysis'), async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radiusKm, focusRegionName } = req.body;

    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      res.status(400).json({ success: false, error: 'Invalid latitude. Must be between -90 and 90.' });
      return;
    }
    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      res.status(400).json({ success: false, error: 'Invalid longitude. Must be between -180 and 180.' });
      return;
    }

    const result = await orchestrator.executeAgent('disaster_risk', {
      latitude,
      longitude,
      radiusKm,
      focusRegionName
    }, req.user);

    res.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      durationMs: result.durationMs,
      data: result.data
    });
  } catch (error: any) {
    console.error('Disaster Risk Agent execution failure:', error);
    res.status(500).json({
      success: false,
      error: 'Disaster Risk Agent execution failed',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/incidents/prioritize
 * Triggers Agent 2: Incident Intelligence & Prioritization Agent.
 */
router.post('/incidents/prioritize', authenticate, requirePermission('run_ai_analysis'), async (req: Request, res: Response) => {
  try {
    const result = await orchestrator.executeAgent('incident_prioritization', {}, req.user);

    res.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      durationMs: result.durationMs,
      data: result.data
    });
  } catch (error: any) {
    console.error('Incident Prioritization Agent failure:', error);
    res.status(500).json({
      success: false,
      error: 'Incident Prioritization Agent failed',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/resources/recommend
 * Triggers Agent 3: Smart Resource Allocation Agent.
 */
router.post('/resources/recommend', authenticate, requirePermission('run_ai_analysis'), async (req: Request, res: Response) => {
  try {
    const { targetIncidentId } = req.body;

    const result = await orchestrator.executeAgent('resource_allocation', {
      targetIncidentId
    }, req.user);

    res.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      durationMs: result.durationMs,
      data: result.data
    });
  } catch (error: any) {
    console.error('Resource Allocation Agent failure:', error);
    res.status(500).json({
      success: false,
      error: 'Resource Allocation Agent failed',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/coordinator/run
 * Triggers Agent 4: AI Emergency Response Coordinator.
 */
router.post('/coordinator/run', authenticate, requirePermission('run_ai_analysis'), async (req: Request, res: Response) => {
  try {
    const { query, focusRegion, latitude, longitude } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Operational question or command query is required.'
      });
      return;
    }

    if (query.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'Query string exceeds maximum limit of 1,000 characters.'
      });
      return;
    }

    const result = await orchestrator.executeAgent('response_coordinator', {
      query,
      focusRegion,
      latitude,
      longitude
    }, req.user);

    res.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      durationMs: result.durationMs,
      data: result.data
    });
  } catch (error: any) {
    console.error('Response Coordinator execution failure:', error);
    res.status(500).json({
      success: false,
      error: 'Response Coordinator execution failed',
      details: error.message
    });
  }
});

/**
 * POST /api/ai/simulation/run
 * Triggers Agent 5: Disaster Simulation Agent (Isolated Sandbox).
 */
router.post('/simulation/run', authenticate, requirePermission('run_disaster_simulation'), async (req: Request, res: Response) => {
  try {
    const {
      scenarioName,
      rainfallIntensityMmPerHour,
      riverGaugeRiseMeters,
      simultaneousIncidentsCount,
      disabledTeamIds,
      targetRegion,
      durationHours
    } = req.body;

    // Validate parameters
    if (rainfallIntensityMmPerHour !== undefined && (typeof rainfallIntensityMmPerHour !== 'number' || rainfallIntensityMmPerHour < 0 || rainfallIntensityMmPerHour > 500)) {
      res.status(400).json({ success: false, error: 'Rainfall intensity must be between 0 and 500 mm/hr.' });
      return;
    }
    if (riverGaugeRiseMeters !== undefined && (typeof riverGaugeRiseMeters !== 'number' || riverGaugeRiseMeters < 0 || riverGaugeRiseMeters > 15)) {
      res.status(400).json({ success: false, error: 'River gauge rise must be between 0 and 15 meters.' });
      return;
    }
    if (simultaneousIncidentsCount !== undefined && (typeof simultaneousIncidentsCount !== 'number' || simultaneousIncidentsCount < 1 || simultaneousIncidentsCount > 50)) {
      res.status(400).json({ success: false, error: 'Simultaneous incidents count must be between 1 and 50.' });
      return;
    }

    const result = await orchestrator.executeAgent('disaster_simulation', {
      scenarioName,
      rainfallIntensityMmPerHour,
      riverGaugeRiseMeters,
      simultaneousIncidentsCount,
      disabledTeamIds,
      targetRegion,
      durationHours
    }, req.user);

    res.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      durationMs: result.durationMs,
      data: result.data
    });
  } catch (error: any) {
    console.error('Disaster Simulation Agent failure:', error);
    res.status(500).json({
      success: false,
      error: 'Disaster Simulation Agent failed',
      details: error.message
    });
  }
});

/**
 * GET /api/ai/executions
 * Paginated execution history.
 */
router.get('/executions', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '15', 10);
    const agentName = req.query.agentName as string | undefined;
    const status = req.query.status as string | undefined;

    const data = await orchestrator.getExecutionHistory({
      page,
      limit,
      agentName,
      status
    });

    res.json({
      success: true,
      ...data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI execution history'
    });
  }
});

/**
 * GET /api/ai/executions/:id
 * Retrieve details of a specific execution trace.
 */
router.get('/executions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const execution = await orchestrator.getExecutionById(id);
    if (!execution) {
      res.status(404).json({
        success: false,
        error: `Execution '${id}' not found.`
      });
      return;
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve execution record'
    });
  }
});

/**
 * GET /api/ai/recommendations
 * List AI recommendations with filter by approval status.
 */
router.get('/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
    const limit = parseInt(req.query.limit as string || '25', 10);

    const recommendations = await orchestrator.getRecommendations({ status, limit });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recommendations'
    });
  }
});

/**
 * POST /api/ai/recommendations/:id/approve
 * Human-in-the-loop authorization to approve and execute an AI recommendation.
 */
router.post('/recommendations/:id/approve', authenticate, requirePermission('approve_ai_recommendations'), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await orchestrator.approveRecommendation(id, req.user!);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to approve AI recommendation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve recommendation.'
    });
  }
});

/**
 * POST /api/ai/recommendations/:id/reject
 * Reject an AI recommendation.
 */
router.post('/recommendations/:id/reject', authenticate, requirePermission('approve_ai_recommendations'), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reason = req.body?.reason || 'Declined by Incident Commander.';
    const result = await orchestrator.rejectRecommendation(id, req.user!, reason);
    res.json(result);
  } catch (error: any) {
    console.error('Failed to reject AI recommendation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject recommendation.'
    });
  }
});

/**
 * GET /api/ai/simulations
 * List simulation history.
 */
router.get('/simulations', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);

    const history = await orchestrator.getSimulations({ page, limit });
    res.json({
      success: true,
      ...history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve simulation history'
    });
  }
});

/**
 * GET /api/ai/simulations/:id
 * Retrieve specific simulation record.
 */
router.get('/simulations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const simulation = await orchestrator.getSimulationById(id);
    if (!simulation) {
      res.status(404).json({
        success: false,
        error: `Simulation '${id}' not found.`
      });
      return;
    }

    res.json({
      success: true,
      data: simulation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve simulation record'
    });
  }
});

export default router;
