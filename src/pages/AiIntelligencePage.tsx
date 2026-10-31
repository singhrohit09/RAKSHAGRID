import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  BrainCircuit, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Play, 
  RotateCw, 
  Activity, 
  Layers, 
  Sliders, 
  Flame, 
  Boxes, 
  Check, 
  X, 
  Compass, 
  SendHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { 
  AgentDescriptor, 
  DisasterRiskOutput, 
  IncidentPrioritizationOutput, 
  ResourceAllocationOutput, 
  ResponseCoordinatorOutput, 
  DisasterSimulationOutput, 
  ExecutionRecord, 
  RecommendationRecord, 
  AiHealthResponse 
} from '../types/ai';

export const AiIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agents' | 'coordinator' | 'simulation' | 'history'>('agents');
  
  // State for system health & agents
  const [health, setHealth] = useState<AiHealthResponse | null>(null);
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // State for agent outputs
  const [riskData, setRiskData] = useState<DisasterRiskOutput | null>(null);
  const [incidentData, setIncidentData] = useState<IncidentPrioritizationOutput | null>(null);
  const [resourceData, setResourceData] = useState<ResourceAllocationOutput | null>(null);
  const [coordinatorData, setCoordinatorData] = useState<ResponseCoordinatorOutput | null>(null);
  const [simulationData, setSimulationData] = useState<DisasterSimulationOutput | null>(null);
  
  // Executions & Recommendations
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<ExecutionRecord | null>(null);
  
  // Loading states
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Coordinator Query Bar
  const [coordinatorQuery, setCoordinatorQuery] = useState('Analyze current flood risk and recommend emergency resources');
  
  // Simulation Inputs
  const [simParams, setSimParams] = useState({
    scenarioName: 'Monsoon Cloudburst & River Surge Stress Test',
    rainfallIntensityMmPerHour: 65,
    riverGaugeRiseMeters: 2.2,
    simultaneousIncidentsCount: 4,
    targetRegion: 'Yamuna Floodplain Corridor (Zone O)'
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Initial Data Fetch
  useEffect(() => {
    loadHealthAndAgents();
    loadRecommendations();
    loadExecutions();
  }, []);

  const loadHealthAndAgents = async () => {
    setLoadingAgents(true);
    try {
      const [hRes, aRes] = await Promise.all([
        api.getAiHealth().catch(() => null),
        api.getAiAgents().catch(() => ({ data: [] }))
      ]);
      if (hRes) setHealth(hRes);
      if (aRes?.data) setAgents(aRes.data);
    } catch (err: any) {
      console.error('Failed to load AI system status:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await api.getAiRecommendations({ status: 'pending', limit: 20 });
      if (res?.data) setRecommendations(res.data);
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    }
  };

  const loadExecutions = async () => {
    try {
      const res = await api.getAiExecutions({ page: 1, limit: 15 });
      if (res?.executions) setExecutions(res.executions);
    } catch (err) {
      console.error('Failed to load AI execution history:', err);
    }
  };

  // Trigger Individual Agents
  const runRiskAgent = async () => {
    setRunningAgent('disaster_risk');
    try {
      const res = await api.runDisasterRiskAnalysis();
      setRiskData(res.data);
      showToast('Disaster Risk Intelligence assessment completed.', 'success');
      loadExecutions();
    } catch (err: any) {
      showToast(`Risk Agent error: ${err.message}`, 'error');
    } finally {
      setRunningAgent(null);
    }
  };

  const runIncidentAgent = async () => {
    setRunningAgent('incident_prioritization');
    try {
      const res = await api.runIncidentPrioritization();
      setIncidentData(res.data);
      showToast('Incident Prioritization analysis completed.', 'success');
      loadExecutions();
      loadRecommendations();
    } catch (err: any) {
      showToast(`Incident Agent error: ${err.message}`, 'error');
    } finally {
      setRunningAgent(null);
    }
  };

  const runResourceAgent = async () => {
    setRunningAgent('resource_allocation');
    try {
      const res = await api.runResourceAllocation();
      setResourceData(res.data);
      showToast('Smart Resource Allocation recommendations generated.', 'success');
      loadExecutions();
      loadRecommendations();
    } catch (err: any) {
      showToast(`Resource Agent error: ${err.message}`, 'error');
    } finally {
      setRunningAgent(null);
    }
  };

  const runCoordinator = async () => {
    if (!coordinatorQuery.trim()) return;
    setRunningAgent('response_coordinator');
    try {
      const res = await api.runAiCoordinator({ query: coordinatorQuery });
      setCoordinatorData(res.data);
      showToast('Response Coordinator operational plan synthesized.', 'success');
      loadExecutions();
      loadRecommendations();
    } catch (err: any) {
      showToast(`Coordinator error: ${err.message}`, 'error');
    } finally {
      setRunningAgent(null);
    }
  };

  const runSimulation = async () => {
    setRunningAgent('disaster_simulation');
    try {
      const res = await api.runDisasterSimulation(simParams);
      setSimulationData(res.data);
      showToast('Disaster sandbox simulation generated successfully.', 'success');
      loadExecutions();
    } catch (err: any) {
      showToast(`Simulation error: ${err.message}`, 'error');
    } finally {
      setRunningAgent(null);
    }
  };

  // Approval Actions
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await api.approveAiRecommendation(id);
      showToast(res.message || 'Recommendation approved and executed.', 'success');
      setRecommendations(prev => prev.filter(r => r.id !== id));
      loadExecutions();
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await api.rejectAiRecommendation(id, 'Declined by Incident Commander in AI Center.');
      showToast(res.message || 'Recommendation rejected.', 'info');
      setRecommendations(prev => prev.filter(r => r.id !== id));
      loadExecutions();
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-safety/20 border-safety/50 text-safety' 
            : toastMessage.type === 'error'
            ? 'bg-emergency/20 border-emergency/50 text-emergency'
            : 'bg-panel-subtle border-border text-primary'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Intelligence Center Status */}
      <div className="bg-panel rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                  AI Disaster Intelligence Center
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                    Phase 4
                  </span>
                </h1>
                <p className="text-sm text-primary-muted">
                  Multi-Agent Neural & Deterministic Decision Support System with Human-in-the-Loop Governance
                </p>
              </div>
            </div>
          </div>

          {/* Engine & Provider Status Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-charcoal px-3.5 py-2 rounded-lg border border-border flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health?.provider.status === 'operational' ? 'bg-safety animate-pulse' : 'bg-hazard'}`} />
                <span className="text-xs font-medium text-primary-muted">Provider:</span>
                <span className="text-xs font-semibold text-primary">{health?.provider.name || 'Deterministic Rule Engine'}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-xs text-primary-muted">
                <span className="font-semibold text-primary">{agents.length}</span> Active Agents
              </div>
            </div>

            <button 
              onClick={loadHealthAndAgents}
              disabled={loadingAgents}
              className="p-2 rounded-lg bg-charcoal hover:bg-panel-subtle border border-border text-primary-muted hover:text-primary transition-colors"
              title="Refresh AI Status"
            >
              <RotateCw className={`w-4 h-4 ${loadingAgents ? 'animate-spin text-accent-blue' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border mt-6 overflow-x-auto">
          {[
            { id: 'agents', label: 'Agent Control Center & Triage', icon: Bot, badge: recommendations.length > 0 ? `${recommendations.length} pending` : undefined },
            { id: 'coordinator', label: 'Response Coordinator (NLP)', icon: Sparkles },
            { id: 'simulation', label: 'Disaster Simulation Lab', icon: Sliders },
            { id: 'history', label: 'Execution & Approval Ledger', icon: Layers, badge: executions.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-accent-blue text-accent-blue bg-accent-blue/5'
                    : 'border-transparent text-primary-muted hover:text-primary hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold ${
                    tab.id === 'agents' && recommendations.length > 0 
                      ? 'bg-hazard/20 text-hazard border border-hazard/30' 
                      : 'bg-panel-subtle text-primary-muted border border-border'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AGENT CONTROL CENTER & OPERATIONS */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* SECTION A: AGENT CONTROL CENTER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Agent 1: Disaster Risk */}
            <div className="bg-panel rounded-xl border border-border p-5 flex flex-col justify-between hover:border-border-accent transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-hazard/10 border border-hazard/20 text-hazard">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary text-sm">Disaster Risk Intelligence</h3>
                      <p className="text-xs text-primary-muted">Agent 1 • Multi-Hazard Exposure</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-safety/10 text-safety border border-safety/20">
                    Online
                  </span>
                </div>
                <p className="text-xs text-primary-muted mb-4 line-clamp-2">
                  Correlates live Open-Meteo precipitation, river gauge baselines, and active GIS geofences to compute regional risk scores.
                </p>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-primary-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {riskData ? 'Assessed' : 'Standby'}
                </span>
                <button
                  onClick={runRiskAgent}
                  disabled={runningAgent === 'disaster_risk'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-charcoal hover:bg-panel-subtle border border-border text-primary hover:text-accent-blue transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${runningAgent === 'disaster_risk' ? 'animate-spin' : ''}`} />
                  {runningAgent === 'disaster_risk' ? 'Analyzing...' : 'Assess Risk'}
                </button>
              </div>
            </div>

            {/* Agent 2: Incident Intelligence */}
            <div className="bg-panel rounded-xl border border-border p-5 flex flex-col justify-between hover:border-border-accent transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emergency/10 border border-emergency/20 text-emergency">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary text-sm">Incident Intelligence & Prioritization</h3>
                      <p className="text-xs text-primary-muted">Agent 2 • Dynamic Triage Advisor</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-safety/10 text-safety border border-safety/20">
                    Online
                  </span>
                </div>
                <p className="text-xs text-primary-muted mb-4 line-clamp-2">
                  Ranks live incidents by urgency score, casualties, population density, aging hours, and geofenced hazard containment.
                </p>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-primary-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {incidentData ? `${incidentData.prioritizedIncidents.length} Triaged` : 'Standby'}
                </span>
                <button
                  onClick={runIncidentAgent}
                  disabled={runningAgent === 'incident_prioritization'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-charcoal hover:bg-panel-subtle border border-border text-primary hover:text-emergency transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${runningAgent === 'incident_prioritization' ? 'animate-spin' : ''}`} />
                  {runningAgent === 'incident_prioritization' ? 'Triaging...' : 'Triage Incidents'}
                </button>
              </div>
            </div>

            {/* Agent 3: Resource Allocation */}
            <div className="bg-panel rounded-xl border border-border p-5 flex flex-col justify-between hover:border-border-accent transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary text-sm">Smart Resource Allocation</h3>
                      <p className="text-xs text-primary-muted">Agent 3 • Tactical Logistics Matching</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-safety/10 text-safety border border-safety/20">
                    Online
                  </span>
                </div>
                <p className="text-xs text-primary-muted mb-4 line-clamp-2">
                  Matches available response teams and warehouse supplies to active incidents with spatial Haversine distance calculations.
                </p>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-primary-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {resourceData ? 'Matched' : 'Standby'}
                </span>
                <button
                  onClick={runResourceAgent}
                  disabled={runningAgent === 'resource_allocation'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-charcoal hover:bg-panel-subtle border border-border text-primary hover:text-accent-blue transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${runningAgent === 'resource_allocation' ? 'animate-spin' : ''}`} />
                  {runningAgent === 'resource_allocation' ? 'Matching...' : 'Match Resources'}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION B: DISASTER RISK OVERVIEW */}
          {riskData ? (
            <div className="bg-panel rounded-xl border border-border p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Compass className="w-5 h-5 text-hazard" />
                    Regional Disaster Risk Assessment
                  </h2>
                  <p className="text-xs text-primary-muted">
                    Evaluated at {new Date(riskData.assessmentTimestamp).toLocaleTimeString()} • Confidence Score: {riskData.confidenceScore}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-lg font-bold text-sm border flex items-center gap-2 ${
                    riskData.overallRiskLevel === 'CRITICAL' 
                      ? 'bg-emergency/20 text-emergency border-emergency/40' 
                      : riskData.overallRiskLevel === 'HIGH'
                      ? 'bg-hazard/20 text-hazard border-hazard/40'
                      : 'bg-safety/20 text-safety border-safety/40'
                  }`}>
                    <Activity className="w-4 h-4" />
                    Risk Level: {riskData.overallRiskLevel} ({riskData.overallRiskScore}/100)
                  </div>
                </div>
              </div>

              {/* Factors & Precautions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-muted mb-3">
                    Primary Contributing Factors
                  </h4>
                  <div className="space-y-2">
                    {riskData.primaryContributingFactors.map((f, idx) => (
                      <div key={idx} className="bg-charcoal p-3 rounded-lg border border-border flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-hazard flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-primary">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-muted mb-3">
                    Recommended Operational Precautions
                  </h4>
                  <div className="space-y-2">
                    {riskData.recommendedPrecautions.map((p, idx) => (
                      <div key={idx} className="bg-charcoal p-3 rounded-lg border border-border flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-safety flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-primary">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Area-Wise Exposure Cards */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-muted mb-3">
                  Evaluated Geographic Sectors
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {riskData.affectedAreas.map((area, idx) => (
                    <div key={idx} className="bg-charcoal rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-primary">{area.areaName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                          area.riskLevel === 'HIGH' || area.riskLevel === 'CRITICAL'
                            ? 'bg-emergency/10 text-emergency border-emergency/30'
                            : 'bg-safety/10 text-safety border-safety/30'
                        }`}>
                          {area.riskLevel} ({area.riskScore}/100)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {area.hazardTypes.map((ht, hIdx) => (
                          <span key={hIdx} className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-panel-subtle text-primary-muted border border-border">
                            {ht}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-primary-muted line-clamp-2">
                        {area.recommendedPrecautions[0] || 'Maintain regular monitoring.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provenance Strip */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-primary-muted">Data Provenance:</span>
                {riskData.dataSources.map((ds, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-2xs font-medium bg-charcoal border border-border text-primary-muted">
                    <span className={`w-1.5 h-1.5 rounded-full ${ds.isLive ? 'bg-safety' : 'bg-hazard'}`} />
                    {ds.source} {ds.isSimulated && '(Simulated)'}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-panel rounded-xl border border-dashed border-border p-8 text-center">
              <Compass className="w-8 h-8 text-primary-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-primary-muted">Disaster Risk Intelligence has not been executed yet.</p>
              <button 
                onClick={runRiskAgent}
                disabled={runningAgent === 'disaster_risk'}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:bg-accent-blue-hover transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Run Regional Assessment
              </button>
            </div>
          )}

          {/* SECTION C & D: INCIDENT TRIAGE & RESOURCE RECOMMENDATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* INCIDENT INTELLIGENCE */}
            <div className="bg-panel rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-primary flex items-center gap-2 text-base">
                  <Flame className="w-5 h-5 text-emergency" />
                  Incident Intelligence & Triage
                </h3>
                {incidentData && (
                  <span className="text-xs text-primary-muted">
                    {incidentData.criticalCount} Critical P1 • {incidentData.escalationsCount} Escalations
                  </span>
                )}
              </div>

              {incidentData && incidentData.prioritizedIncidents.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {incidentData.prioritizedIncidents.map((inc, idx) => (
                    <div key={idx} className="bg-charcoal p-4 rounded-lg border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-primary line-clamp-1">{inc.title}</span>
                        <div className="flex items-center gap-2">
                          {inc.priorityChanged && (
                            <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-hazard/20 text-hazard border border-hazard/30">
                              Escalated from {inc.currentPriority}
                            </span>
                          )}
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            inc.recommendedPriority === 'P1'
                              ? 'bg-emergency/20 text-emergency border-emergency/40'
                              : inc.recommendedPriority === 'P2'
                              ? 'bg-hazard/20 text-hazard border-hazard/40'
                              : 'bg-panel-subtle text-primary border-border'
                          }`}>
                            {inc.recommendedPriority}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-primary-muted">{inc.reason}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {inc.supportingEvidence.map((ev, eIdx) => (
                          <span key={eIdx} className="text-2xs px-2 py-0.5 rounded bg-panel-subtle text-primary-muted border border-border">
                            {ev}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-2xs text-primary-muted">
                        <span>Urgency Score: {inc.urgencyScore}/100</span>
                        <span className="text-accent-blue font-medium">{inc.suggestedNextAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-primary-muted text-sm border border-dashed border-border rounded-lg">
                  No incident triage data available. Click "Triage Incidents" above.
                </div>
              )}
            </div>

            {/* RESOURCE RECOMMENDATIONS & APPROVAL WORKFLOW */}
            <div className="bg-panel rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-primary flex items-center gap-2 text-base">
                  <Boxes className="w-5 h-5 text-accent-blue" />
                  Tactical Resource Allocations
                </h3>
                {recommendations.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-hazard/20 text-hazard border border-hazard/30 font-semibold">
                    {recommendations.length} Pending Approval
                  </span>
                )}
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {recommendations.map(rec => {
                    const recData = JSON.parse(rec.recommendation_data || '{}');
                    return (
                      <div key={rec.id} className="bg-charcoal p-4 rounded-lg border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase font-semibold text-accent-blue tracking-wider">
                            {rec.recommendation_type.replace('_', ' ')}
                          </span>
                          <span className="text-2xs px-2 py-0.5 rounded bg-panel-subtle text-primary-muted border border-border">
                            Confidence: {rec.confidence}%
                          </span>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-primary">{rec.recommendation_title}</h4>
                          <p className="text-xs text-primary-muted mt-1">{rec.reasoning}</p>
                        </div>

                        {recData.estimatedDistanceKm !== undefined && (
                          <div className="text-2xs text-primary-muted flex items-center gap-1">
                            <Compass className="w-3 h-3 text-accent-blue" />
                            Estimated Road Distance: <span className="font-medium text-primary">{recData.estimatedDistanceKm} km</span>
                          </div>
                        )}

                        {/* Human Approval Action Buttons */}
                        <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReject(rec.id)}
                            disabled={approvingId === rec.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-panel-subtle hover:bg-emergency/20 text-primary-muted hover:text-emergency border border-border transition-colors disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleApprove(rec.id)}
                            disabled={approvingId === rec.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-safety/20 hover:bg-safety/30 text-safety border border-safety/40 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {approvingId === rec.id ? 'Executing...' : 'Authorize & Dispatch'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-primary-muted text-sm border border-dashed border-border rounded-lg">
                  {resourceData ? 'All generated resource recommendations have been resolved.' : 'Click "Match Resources" above to generate tactical matching recommendations.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESPONSE COORDINATOR (NLP) */}
      {activeTab === 'coordinator' && (
        <div className="bg-panel rounded-xl border border-border p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-blue" />
              Emergency Response Coordinator
            </h2>
            <p className="text-sm text-primary-muted">
              Central orchestration agent: queries specialized sub-agents and synthesizes consolidated action plans.
            </p>
          </div>

          {/* Operational Query Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={coordinatorQuery}
                onChange={e => setCoordinatorQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runCoordinator()}
                placeholder="Ask an operational coordination question..."
                className="flex-1 bg-charcoal border border-border rounded-lg px-4 py-3 text-sm text-primary placeholder-primary-muted focus:outline-none focus:border-accent-blue transition-colors"
              />
              <button
                onClick={runCoordinator}
                disabled={runningAgent === 'response_coordinator' || !coordinatorQuery.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-accent-blue hover:bg-accent-blue-hover text-white transition-all disabled:opacity-50"
              >
                <SendHorizontal className="w-4 h-4" />
                {runningAgent === 'response_coordinator' ? 'Synthesizing...' : 'Dispatch'}
              </button>
            </div>

            {/* Query Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-primary-muted">Suggested Queries:</span>
              {[
                'Analyze current flood risk and recommend emergency resources',
                'Triage all high-priority incidents and assess team availability',
                'Check municipal shelter capacity against active flood zones'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setCoordinatorQuery(chip)}
                  className="px-3 py-1 rounded-full bg-charcoal hover:bg-panel-subtle border border-border text-primary-muted hover:text-primary transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinator Results Display */}
          {coordinatorData && (
            <div className="space-y-6 pt-4 border-t border-border">
              {/* Agent Traces */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-muted mb-3">
                  Multi-Agent Dispatch Traces
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {coordinatorData.agentsInvoked.map((tr, idx) => (
                    <div key={idx} className="bg-charcoal p-4 rounded-lg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-primary">{tr.agentName}</span>
                        <span className={`text-2xs px-2 py-0.5 rounded font-bold border ${
                          tr.status === 'COMPLETED' ? 'bg-safety/10 text-safety border-safety/30' : 'bg-hazard/10 text-hazard border-hazard/30'
                        }`}>
                          {tr.status}
                        </span>
                      </div>
                      <p className="text-xs text-primary-muted line-clamp-2">{tr.summary}</p>
                      <div className="text-2xs text-primary-muted pt-1 flex items-center justify-between">
                        <span>Latency: {tr.durationMs}ms</span>
                        <span>Confidence: {tr.confidenceScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgent Situations Alert Banner */}
              {coordinatorData.urgentSituations.length > 0 && (
                <div className="bg-emergency/10 border border-emergency/30 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emergency flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Urgent Operational Situations Highlighted
                  </h4>
                  <ul className="space-y-1">
                    {coordinatorData.urgentSituations.map((u, idx) => (
                      <li key={idx} className="text-xs text-primary flex items-start gap-2">
                        <span className="text-emergency mt-0.5">•</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Synthesized 3-Phase Action Plan */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-muted mb-3">
                  Synthesized Operational Action Plan
                </h4>
                <div className="space-y-3">
                  {coordinatorData.synthesizedActionPlan.map(step => (
                    <div key={step.stepNumber} className="bg-charcoal p-4 rounded-lg border border-border flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-panel-subtle border border-border flex items-center justify-center font-bold text-sm text-accent-blue flex-shrink-0">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs uppercase tracking-wider font-semibold text-primary-muted">
                            {step.phase.replace('_', ' ')} Phase • Assigned: {step.assignedRole}
                          </span>
                          <div className="flex items-center gap-2">
                            {step.requiresHumanApproval && (
                              <span className="text-2xs px-2 py-0.5 rounded font-semibold bg-hazard/20 text-hazard border border-hazard/30">
                                Requires Human Authorization
                              </span>
                            )}
                            <span className="text-2xs px-2 py-0.5 rounded font-bold bg-panel-subtle text-primary border border-border">
                              {step.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-primary">{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISASTER SIMULATION LAB */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {/* Unmissable Amber Sandbox Warning Banner */}
          <div className="bg-hazard/10 border border-hazard/40 rounded-xl p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-hazard/20 text-hazard flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-hazard text-sm uppercase tracking-wider">
                Isolated Sandbox Simulation Lab
              </h3>
              <p className="text-xs text-primary-muted">
                All generated incidents, flood crests, casualties, and supply shortfalls are completely synthetic. Zero production database tables are modified and no public alerts are dispatched.
              </p>
            </div>
          </div>

          <div className="bg-panel rounded-xl border border-border p-6 space-y-6">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-accent-blue" />
              Scenario Configuration
            </h2>

            {/* Parameter Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-primary-muted block mb-2">
                  Rainfall Intensity: <span className="text-primary font-bold">{simParams.rainfallIntensityMmPerHour} mm/hr</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={simParams.rainfallIntensityMmPerHour}
                  onChange={e => setSimParams(prev => ({ ...prev, rainfallIntensityMmPerHour: parseInt(e.target.value) }))}
                  className="w-full accent-accent-blue cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary-muted block mb-2">
                  River Gauge Rise: <span className="text-primary font-bold">+{simParams.riverGaugeRiseMeters} m</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="4.5"
                  step="0.1"
                  value={simParams.riverGaugeRiseMeters}
                  onChange={e => setSimParams(prev => ({ ...prev, riverGaugeRiseMeters: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-blue cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary-muted block mb-2">
                  Simultaneous Incidents: <span className="text-primary font-bold">{simParams.simultaneousIncidentsCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={simParams.simultaneousIncidentsCount}
                  onChange={e => setSimParams(prev => ({ ...prev, simultaneousIncidentsCount: parseInt(e.target.value) }))}
                  className="w-full accent-accent-blue cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={runSimulation}
                disabled={runningAgent === 'disaster_simulation'}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-accent-blue hover:bg-accent-blue-hover text-white transition-all disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${runningAgent === 'disaster_simulation' ? 'animate-spin' : ''}`} />
                {runningAgent === 'disaster_simulation' ? 'Simulating Sandbox...' : 'Run Sandbox Simulation'}
              </button>
            </div>

            {/* Simulation Results */}
            {simulationData && (
              <div className="pt-6 border-t border-border space-y-6">
                {/* Projected Bottlenecks */}
                {simulationData.potentialBottlenecks.length > 0 && (
                  <div className="bg-charcoal p-4 rounded-lg border border-hazard/30 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-hazard flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Projected Capacity Deficits & Logistics Bottlenecks
                    </h4>
                    <ul className="space-y-1.5">
                      {simulationData.potentialBottlenecks.map((b, idx) => (
                        <li key={idx} className="text-xs text-primary flex items-start gap-2">
                          <span className="text-hazard mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strategy Comparisons */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-muted mb-3">
                    Comparative Response Strategies
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simulationData.strategyComparisons.map((strat, idx) => (
                      <div key={idx} className={`p-5 rounded-xl border space-y-3 ${
                        strat.recommended 
                          ? 'bg-panel-subtle border-safety/50' 
                          : 'bg-charcoal border-border'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-primary">{strat.strategyName}</h5>
                          {strat.recommended && (
                            <span className="text-2xs px-2.5 py-0.5 rounded-full font-bold bg-safety/20 text-safety border border-safety/40">
                              Recommended
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-primary-muted">{strat.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-2xs pt-2 border-t border-border">
                          <div>
                            <span className="text-primary-muted">Evacuation Efficiency:</span>
                            <span className="font-semibold text-primary ml-1">{strat.evacuationEfficiencyPct}%</span>
                          </div>
                          <div>
                            <span className="text-primary-muted">Response Time:</span>
                            <span className="font-semibold text-primary ml-1">{strat.estimatedResponseTimeHours} hrs</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-2xs pt-2">
                          <span className="font-semibold text-safety">Pros:</span>
                          <ul className="list-disc list-inside text-primary-muted">
                            {strat.pros.map((pro, pIdx) => <li key={pIdx}>{pro}</li>)}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EXECUTION & APPROVAL LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-panel rounded-xl border border-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-blue" />
                AI Execution Audit History
              </h2>
              <p className="text-xs text-primary-muted">
                Immutable trace ledger tracking agent runtimes, provider attributions, confidence scores, and structured outputs.
              </p>
            </div>
            <button
              onClick={loadExecutions}
              className="p-2 rounded-lg bg-charcoal hover:bg-panel-subtle border border-border text-primary-muted hover:text-primary transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal text-primary-muted uppercase tracking-wider border-y border-border">
                <tr>
                  <th className="py-3 px-4">Execution ID</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executions.map(exec => (
                  <tr key={exec.id} className="hover:bg-charcoal/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-primary font-medium">{exec.execution_id}</td>
                    <td className="py-3 px-4 text-primary">{exec.agent_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-2xs border ${
                        exec.status === 'COMPLETED' ? 'bg-safety/10 text-safety border-safety/30' : 'bg-hazard/10 text-hazard border-hazard/30'
                      }`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-primary-muted">{exec.execution_duration}ms</td>
                    <td className="py-3 px-4 text-primary font-medium">{exec.confidence}%</td>
                    <td className="py-3 px-4 text-primary-muted">{exec.provider}</td>
                    <td className="py-3 px-4 text-primary-muted">{new Date(exec.created_at).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTrace(exec)}
                        className="px-2.5 py-1 rounded bg-charcoal hover:bg-panel-subtle border border-border text-primary-muted hover:text-primary transition-colors text-2xs font-semibold"
                      >
                        Inspect Trace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trace Inspection Modal */}
          {selectedTrace && (
            <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-panel rounded-xl border border-border max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-bold text-primary text-base">Execution Trace: {selectedTrace.execution_id}</h3>
                  <button onClick={() => setSelectedTrace(null)} className="text-primary-muted hover:text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-primary-muted block">Agent Name:</span>
                    <span className="font-medium text-primary">{selectedTrace.agent_name}</span>
                  </div>
                  <div>
                    <span className="text-primary-muted block">Provider:</span>
                    <span className="font-medium text-primary">{selectedTrace.provider}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-primary-muted block mb-1">Input Summary:</span>
                  <pre className="p-3 bg-charcoal rounded-lg border border-border text-2xs text-primary-muted overflow-x-auto">
                    {selectedTrace.input_summary || 'No input summary recorded'}
                  </pre>
                </div>

                <div>
                  <span className="text-xs text-primary-muted block mb-1">Full Structured Output:</span>
                  <pre className="p-3 bg-charcoal rounded-lg border border-border text-2xs text-accent-blue overflow-x-auto max-h-60">
                    {selectedTrace.full_output || selectedTrace.output_summary || 'No output recorded'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiIntelligencePage;
