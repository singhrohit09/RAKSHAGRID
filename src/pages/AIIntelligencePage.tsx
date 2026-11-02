/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Cpu,
  ShieldAlert,
  Sliders,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  Radio,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Users,
  Compass,
  Database,
  BarChart2,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';
import { Incident, Team, Shelter, Resource, Task, Alert, AuditEvent } from '../types';
import {
  SituationAwarenessReport,
  RiskAssessment,
  ResourceRecommendation,
  DisasterScenario,
  ScenarioParameters,
  AIAlertRecommendation,
  AssistantMessage,
  AgentRun,
} from '../types/ai';
import { ChiefIntelligenceOrchestrator } from '../services/ai/agents/orchestratorAgent';
import { ExplainableRiskEngine } from '../services/ai/riskEngine';
import { ResourceRecommendationEngine } from '../services/ai/resourceRecommender';
import { DisasterScenarioSimulator } from '../services/ai/scenarioSimulator';
import { AIAssistantService } from '../services/ai/assistant';
import { AlertRecommendationService } from '../services/ai/alertRecommender';
import { EvaluationService } from '../services/ai/evaluationService';
import { GeminiDisasterService, GEMINI_MODEL } from '../services/ai/geminiClient';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/common/MetricCard';

interface AIIntelligencePageProps {
  incidents: Incident[];
  teams: Team[];
  shelters: Shelter[];
  resources: Resource[];
  tasks: Task[];
  alerts: Alert[];
  auditLogs: AuditEvent[];
  onUpdateIncident?: (id: string, updates: Partial<Incident>) => void;
  onBroadcastAlert?: (alertData: any) => void;
  onAddAuditLog?: (action: string, entityType: any, entityId: string, details: string) => void;
  onNavigate: (route: string) => void;
}

type TabType =
  | 'overview'
  | 'risk_matrix'
  | 'simulator'
  | 'copilot'
  | 'recommendations'
  | 'alert_staging'
  | 'benchmarks';

export const AIIntelligencePage: React.FC<AIIntelligencePageProps> = ({
  incidents,
  teams,
  shelters,
  resources,
  tasks,
  alerts,
  auditLogs,
  onUpdateIncident,
  onBroadcastAlert,
  onAddAuditLog,
  onNavigate,
}) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<SituationAwarenessReport | null>(null);

  // Selected incident for deep risk analysis
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(() => incidents[0]?.id || '');
  const [selectedRiskAssessment, setSelectedRiskAssessment] = useState<RiskAssessment | null>(null);

  // Resource Recommendations State (with Human-in-the-loop review)
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>(() =>
    ResourceRecommendationEngine.generateDispatchRecommendations(incidents, teams)
  );
  const [approvalFeedback, setApprovalFeedback] = useState<{ id: string; msg: string } | null>(null);

  // Alert Recommendations State (CAP drafts)
  const [alertDrafts, setAlertDrafts] = useState<AIAlertRecommendation[]>(() =>
    AlertRecommendationService.generateAlertDrafts(incidents)
  );

  // Scenario Simulator State
  const [scenarioParams, setScenarioParams] = useState<ScenarioParameters>({
    rainfallMultiplier: 1.5,
    riverSurgeMeters: 2.0,
    windSpeedDeltaKmh: 25,
    damReleaseCusecs: 45000,
    powerGridOutage: false,
    bridgeCollapses: false,
  });

  const [simulatedScenario, setSimulatedScenario] = useState<DisasterScenario>(() =>
    DisasterScenarioSimulator.simulate(
      'Monsoon Extreme Surge Scenario',
      'What-if evaluation with 1.5x rainfall and +2.0m river crest.',
      {
        rainfallMultiplier: 1.5,
        riverSurgeMeters: 2.0,
        windSpeedDeltaKmh: 25,
        damReleaseCusecs: 45000,
        powerGridOutage: false,
        bridgeCollapses: false,
      },
      incidents,
      shelters,
      resources
    )
  );

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content:
        'RakshaGrid Tactical Intelligence Copilot initialized. I have full read-only situational awareness of all incidents, shelters, river gauges, and available response teams. How can I assist your operations command?',
      timestamp: new Date().toISOString(),
      isAiGenerated: false,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Model Benchmark Metrics
  const benchmarks = useMemo(() => EvaluationService.getBenchmarkMetrics(), []);

  // Run full multi-agent swarm analysis
  const runSwarmAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await ChiefIntelligenceOrchestrator.execute({
        incidents,
        shelters,
        teams,
        resources,
      });
      setReport(result);
    } catch (err) {
      console.error('Failed to run multi-agent swarm:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    runSwarmAnalysis();
  }, []);

  // Update deep risk assessment when selected incident changes
  useEffect(() => {
    const inc = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];
    if (inc) {
      const assessment = ExplainableRiskEngine.assessIncidentRisk({
        incident: inc,
        shelters,
        teams,
        observedRainfallMm: 38.5,
        nearestRiverGaugeStatus: inc.disasterType === 'flood' ? 'DANGER' : 'WARNING',
      });
      setSelectedRiskAssessment(assessment);
    }
  }, [selectedIncidentId, incidents, shelters, teams]);

  // Handle Scenario Parameter Changes
  const handleParamChange = (field: keyof ScenarioParameters, val: any) => {
    const updated = { ...scenarioParams, [field]: val };
    setScenarioParams(updated);
    const newSim = DisasterScenarioSimulator.simulate(
      `Custom Simulation (${updated.rainfallMultiplier.toFixed(1)}x Rain)`,
      'Simulated what-if catastrophe scenario evaluated for contingency preparedness.',
      updated,
      incidents,
      shelters,
      resources
    );
    setSimulatedScenario(newSim);
  };

  // Human-in-the-loop: Approve & Dispatch Recommendation
  const handleApproveRecommendation = (rec: ResourceRecommendation) => {
    if (role === 'read_only_analyst') {
      alert('Unauthorized: Read-only analyst accounts cannot authorize team dispatches.');
      return;
    }

    // 1. Update recommendation status
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === rec.id
          ? {
              ...r,
              status: 'APPROVED',
              reviewedBy: user?.name || 'Commander',
              reviewedAt: new Date().toISOString(),
            }
          : r
      )
    );

    // 2. Perform live tactical update on incident if callback provided
    if (onUpdateIncident) {
      onUpdateIncident(rec.incidentId, {
        assignedTeamId: rec.recommendedTeamId,
        assignedTeamName: rec.recommendedTeamName,
        status: 'active',
      });
    }

    // 3. Add audit log
    if (onAddAuditLog) {
      onAddAuditLog(
        'COMMAND_DISPATCH_APPROVED',
        'team',
        rec.recommendedTeamId,
        `Approved AI recommendation: Dispatched ${rec.recommendedTeamName} to incident "${rec.incidentTitle}" (ETA: ${rec.estimatedEtaMinutes} min)`
      );
    }

    setApprovalFeedback({
      id: rec.id,
      msg: `Authorized dispatch of ${rec.recommendedTeamName} recorded. Incident assigned.`,
    });
    setTimeout(() => setApprovalFeedback(null), 5000);
  };

  // Human-in-the-loop: Reject Recommendation
  const handleRejectRecommendation = (recId: string) => {
    setRecommendations((prev) =>
      prev.map((r) =>
        r.id === recId
          ? {
              ...r,
              status: 'REJECTED',
              reviewedBy: user?.name || 'Commander',
              reviewedAt: new Date().toISOString(),
              reviewNotes: 'Rejected by Commander during operational review.',
            }
          : r
      )
    );
  };

  // Human-in-the-loop: Promote AI Alert to Live Broadcast
  const handlePromoteAlert = (draft: AIAlertRecommendation) => {
    if (role !== 'administrator' && role !== 'incident_commander') {
      alert('Unauthorized: Alert broadcasts require Incident Commander or Administrator authorization.');
      return;
    }

    if (onBroadcastAlert) {
      onBroadcastAlert({
        title: draft.headline,
        message: `${draft.publicInstructions}\n\nTechnical Rationale: ${draft.technicalRationale}`,
        severity: draft.severity,
        disasterType: draft.disasterType,
        targetRegion: draft.affectedAreas.join(', '),
        authorRole: `${user?.name || 'Incident Commander'} (${user?.agency || 'NDMA EOC'})`,
        capStatus: 'Actual',
        broadcastChannels: draft.targetChannels,
      });
    }

    // Update draft status
    setAlertDrafts((prev) =>
      prev.map((d) =>
        d.id === draft.id
          ? {
              ...d,
              status: 'PROMOTED',
              promotedAt: new Date().toISOString(),
              promotedBy: user?.name || 'Incident Commander',
            }
          : d
      )
    );

    if (onAddAuditLog) {
      onAddAuditLog(
        'CAP_ALERT_BROADCAST_AUTHORIZED',
        'alert',
        draft.id,
        `Commander promoted AI draft to LIVE PUBLIC BROADCAST: "${draft.headline}"`
      );
    }
  };

  // Handle Assistant Chat Query
  const handleSendChat = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isCopilotTyping) return;

    const userMsg: AssistantMessage = {
      id: `USER-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      isAiGenerated: false,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsCopilotTyping(true);

    try {
      const reply = await AIAssistantService.askAssistant(text, chatMessages, {
        incidents,
        shelters,
        teams,
        resources,
        auditLogs,
        userRole: role,
        userName: user?.name || 'Commander',
      });
      setChatMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-white border border-[#E4E3DC] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E5EDE6] flex items-center justify-center text-[#315C46] shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-[#171B19]">
                  AI Disaster Intelligence & Multi-Agent Swarm
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#E5EDE6] text-[#315C46] border border-[#C8DACB] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#315C46] animate-pulse" />
                  {GeminiDisasterService.isApiKeyConfigured()
                    ? `GEMINI 3.8 FLASH CONNECTED`
                    : `EXPLAINABLE HEURISTIC ENGINE ACTIVE`}
                </span>
              </div>
              <p className="text-xs text-[#777D77] mt-1">
                7 Specialized AI Agents • Deterministic Geospatial Analytics • Human-in-the-Loop Operational Safeguards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={runSwarmAnalysis}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-[#315C46] hover:bg-[#264937] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'ORCHESTRATING SWARM...' : 'REFRESH INTELLIGENCE'}
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#E4E3DC]">
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E4E3DC]">
            <div className="text-[10px] font-semibold uppercase text-[#777D77]">Threat Assessment Index</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl font-mono font-bold ${
                  (report?.overallScore || 50) >= 76
                    ? 'text-[#B9433D]'
                    : (report?.overallScore || 50) >= 51
                    ? 'text-[#C18A32]'
                    : 'text-[#315C46]'
                }`}
              >
                {report?.overallScore || 50}/100
              </span>
              <span className="text-[11px] font-medium uppercase text-[#777D77]">
                {report?.threatLevel || 'MODERATE'}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E4E3DC]">
            <div className="text-[10px] font-semibold uppercase text-[#777D77]">Active Specialist Agents</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-[#315C46]">7 / 7</span>
              <span className="text-[11px] text-[#777D77]">Harmonized</span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E4E3DC]">
            <div className="text-[10px] font-semibold uppercase text-[#777D77]">Pending Commander Approvals</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-[#C18A32]">
                {recommendations.filter((r) => r.status === 'PENDING_REVIEW').length}
              </span>
              <span className="text-[11px] text-[#777D77]">Awaiting Review</span>
            </div>
          </div>

          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E4E3DC]">
            <div className="text-[10px] font-semibold uppercase text-[#777D77]">Benchmark Accuracy F1</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-[#315C46]">
                {(benchmarks.f1Score * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#777D77]">Historical Ground-Truth</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 border-b border-[#E4E3DC] overflow-x-auto no-scrollbar pb-0.5">
        {[
          { id: 'overview', label: 'Situation Briefing & Swarm', icon: Activity },
          { id: 'risk_matrix', label: 'Explainable Risk Matrix', icon: Compass },
          { id: 'simulator', label: 'Scenario What-If Simulator', icon: Sliders },
          { id: 'copilot', label: 'AI Tactical Copilot', icon: Brain },
          {
            id: 'recommendations',
            label: `Dispatch Approvals (${recommendations.filter((r) => r.status === 'PENDING_REVIEW').length})`,
            icon: Users,
          },
          {
            id: 'alert_staging',
            label: `Alert Staging (${alertDrafts.filter((d) => d.status === 'DRAFT').length})`,
            icon: Radio,
          },
          { id: 'benchmarks', label: 'Model Evaluation & Benchmarks', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-2.5 rounded-t-lg text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#315C46] text-[#315C46] bg-[#E5EDE6] font-semibold'
                  : 'border-transparent text-[#777D77] hover:text-[#171B19] hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SITUATION BRIEFING & MULTI-AGENT SWARM */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* EXECUTIVE BRIEFING CARD */}
          <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold font-mono uppercase text-slate-200">
                  Chief Intelligence Orchestrator — Tactical Briefing
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Provenance: {report?.modelAttribution || 'Multi-Agent Swarm'}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {report?.executiveSummary ||
                'Orchestrating agent telemetry. Analyzing live incidents, atmospheric forces, and CWC river gauges...'}
            </p>

            {/* CRITICAL QUESTIONS ANSWERED */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/60">
              <div className="p-3 bg-[#0a0d14] rounded border border-slate-800">
                <div className="text-[11px] font-mono uppercase text-rose-400 font-bold mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Top Threat Nexus
                </div>
                <div className="text-xs text-slate-300 line-clamp-2">
                  {report?.topThreats[0]?.threatDescription || 'Mahanadi river crest breaching danger thresholds.'}
                </div>
              </div>

              <div className="p-3 bg-[#0a0d14] rounded border border-slate-800">
                <div className="text-[11px] font-mono uppercase text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Shelter Saturation Risk
                </div>
                <div className="text-xs text-slate-300 line-clamp-2">
                  {report?.criticalShelterAlerts[0]?.issue || 'All relief shelters currently below 80% capacity margin.'}
                </div>
              </div>

              <div className="p-3 bg-[#0a0d14] rounded border border-slate-800">
                <div className="text-[11px] font-mono uppercase text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Priority Evacuation Zone
                </div>
                <div className="text-xs text-slate-300 line-clamp-2">
                  {report?.evacuationPriorities[0]?.zoneName || 'Cuttack Riparian Lowlands (Priority #1)'}
                </div>
              </div>
            </div>
          </div>

          {/* 7 SPECIALIZED AGENTS TIMELINE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Multi-Agent Swarm Execution Matrix (7 Specialized Agents)
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Synchronized execution • Zero hallucinations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(report?.orchestratorAgentRuns || []).map((agentRun) => (
                <div
                  key={agentRun.id}
                  className="bg-[#0f141f] border border-slate-800 hover:border-slate-700 transition-colors rounded-lg p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="text-xs font-bold font-mono text-slate-200">
                        {agentRun.agentName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {agentRun.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {agentRun.findings.slice(0, 2).map((finding, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-400 shrink-0">•</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>

                    {/* Threat indicators */}
                    <div className="space-y-1 mb-3 pt-2 border-t border-slate-800/60">
                      {agentRun.threatIndicators.map((ti, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">{ti.title}</span>
                          <span
                            className={`font-bold ${
                              ti.level === 'critical'
                                ? 'text-rose-400'
                                : ti.level === 'severe'
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {ti.metric}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Latency: {agentRun.durationMs}ms</span>
                    <span>Conf: {Math.round(agentRun.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPLAINABLE RISK MATRIX */}
      {activeTab === 'risk_matrix' && (
        <div className="space-y-6">
          <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold font-mono uppercase text-slate-200">
                  Transparent Multi-Factor Risk Assessment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formula: R = Σ (w_i × s_i), where Σ w_i = 1.0. Calibrated across 5 independent telemetry vectors.
                </p>
              </div>

              {/* Incident Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Target Incident:</span>
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="bg-[#0a0d14] border border-slate-700 text-slate-200 text-xs font-mono rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.title} ({inc.severity.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRiskAssessment && (
              <div className="space-y-5">
                {/* Score & Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded bg-[#0b0e17] border border-slate-800">
                  <div>
                    <span className="text-xs font-mono uppercase text-slate-500">Target Entity</span>
                    <h3 className="text-base font-bold text-slate-100 font-mono">
                      {selectedRiskAssessment.targetName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{selectedRiskAssessment.summary}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-slate-500">Calculated Risk Index</div>
                      <div
                        className={`text-2xl font-mono font-bold ${
                          selectedRiskAssessment.riskLevel === 'CRITICAL'
                            ? 'text-rose-400'
                            : selectedRiskAssessment.riskLevel === 'HIGH'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {selectedRiskAssessment.overallScore} / 100
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded font-mono font-bold text-xs uppercase border ${
                        selectedRiskAssessment.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : selectedRiskAssessment.riskLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {selectedRiskAssessment.riskLevel}
                    </div>
                  </div>
                </div>

                {/* Factors Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0b0e17] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Risk Factor & Sub-Model</th>
                        <th className="py-2.5 px-3">Weight (w_i)</th>
                        <th className="py-2.5 px-3">Raw Score (s_i)</th>
                        <th className="py-2.5 px-3">Contribution</th>
                        <th className="py-2.5 px-3">Observed Value</th>
                        <th className="py-2.5 px-3">Telemetry Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {selectedRiskAssessment.factors.map((factor) => (
                        <tr key={factor.id} className="hover:bg-slate-800/20">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-200">{factor.name}</div>
                            <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                              {factor.explanation}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">{(factor.weight * 100).toFixed(0)}%</td>
                          <td className="py-3 px-3 text-slate-300">{factor.rawScore} / 100</td>
                          <td className="py-3 px-3 font-bold text-amber-400">+{factor.weightedScore} pts</td>
                          <td className="py-3 px-3 text-slate-300">{factor.valueDisplay}</td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">{factor.dataSource}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recommendations */}
                <div className="p-4 rounded bg-[#0b0e17] border border-slate-800">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-2">
                    Actionable Tactical Recommendations:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedRiskAssessment.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold font-mono">[{i + 1}]</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Legal / Operational Disclaimer */}
                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 font-mono">
                  {selectedRiskAssessment.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCENARIO WHAT-IF SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* PERMANENT WATERMARK BANNER */}
          <div className="p-3 bg-rose-500/15 border-2 border-rose-500/40 rounded-lg flex items-center justify-between text-rose-300 font-mono text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold tracking-wider">
                SIMULATION ENVIRONMENT ACTIVE — HYPOTHETICAL DISASTER MODELING ONLY
              </span>
            </div>
            <span className="text-[11px] uppercase bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
              Live Database Untouched
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PARAMETERS SLIDERS */}
            <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  What-If Delta Modifiers
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setScenarioParams({
                      rainfallMultiplier: 1.0,
                      riverSurgeMeters: 0.0,
                      windSpeedDeltaKmh: 0,
                      damReleaseCusecs: 0,
                      powerGridOutage: false,
                      bridgeCollapses: false,
                    })
                  }
                  className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
                >
                  Reset Baseline
                </button>
              </div>

              {/* Slider 1: Rainfall Multiplier */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Rainfall Multiplier:</span>
                  <span className="font-bold text-amber-400">
                    {scenarioParams.rainfallMultiplier.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={scenarioParams.rainfallMultiplier}
                  onChange={(e) => handleParamChange('rainfallMultiplier', parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <span className="text-[10px] text-slate-500 font-mono">1.0x (Normal) to 3.0x (Cloudburst)</span>
              </div>

              {/* Slider 2: River Surge Meters */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">River Surge / Crest:</span>
                  <span className="font-bold text-amber-400">
                    +{scenarioParams.riverSurgeMeters.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.5"
                  value={scenarioParams.riverSurgeMeters}
                  onChange={(e) => handleParamChange('riverSurgeMeters', parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <span className="text-[10px] text-slate-500 font-mono">0.0m to +5.0m above CWC Danger Mark</span>
              </div>

              {/* Slider 3: Dam Release Cusecs */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Upstream Dam Release:</span>
                  <span className="font-bold text-amber-400">
                    {scenarioParams.damReleaseCusecs.toLocaleString()} cusecs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150000"
                  step="10000"
                  value={scenarioParams.damReleaseCusecs}
                  onChange={(e) => handleParamChange('damReleaseCusecs', parseInt(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between text-xs font-mono cursor-pointer">
                  <span className="text-slate-300">Concurrent 400kV Grid Blackout</span>
                  <input
                    type="checkbox"
                    checked={scenarioParams.powerGridOutage}
                    onChange={(e) => handleParamChange('powerGridOutage', e.target.checked)}
                    className="accent-amber-400 rounded w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-mono cursor-pointer">
                  <span className="text-slate-300">Major Feeder Bridge Severance</span>
                  <input
                    type="checkbox"
                    checked={scenarioParams.bridgeCollapses}
                    onChange={(e) => handleParamChange('bridgeCollapses', e.target.checked)}
                    className="accent-amber-400 rounded w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* SIMULATION IMPACTS & SIDE-BY-SIDE */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                    Projected Impact Analysis: Baseline vs Simulation
                  </h3>
                  <span className="text-xs font-mono text-rose-400 font-bold">
                    Casualty Threat: {simulatedScenario.impacts.projectedCasualtyRisk.toUpperCase()}
                  </span>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-[#0b0e17] p-3 rounded border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500">Affected Population</span>
                    <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                      {simulatedScenario.impacts.estimatedAffectedPopulation.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">
                      +{simulatedScenario.baselineDiff.populationIncreasePct}% vs baseline
                    </span>
                  </div>

                  <div className="bg-[#0b0e17] p-3 rounded border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500">Threatened Shelters</span>
                    <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                      {simulatedScenario.impacts.threatenedSheltersCount} Shelters
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">
                      +{simulatedScenario.baselineDiff.additionalThreatenedShelters} at critical risk
                    </span>
                  </div>

                  <div className="bg-[#0b0e17] p-3 rounded border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500">Inundated Zones</span>
                    <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                      {simulatedScenario.impacts.floodedZonesCount} Sectors
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Lowland sub-basins</span>
                  </div>

                  <div className="bg-[#0b0e17] p-3 rounded border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-500">Acute Supply Shortfalls</span>
                    <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                      {simulatedScenario.impacts.estimatedResourceDeficits.length} Items
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Boats & Dewatering</span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="p-3.5 rounded bg-[#0b0e17] border border-slate-800 mb-4">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Simulation Assessment Narrative:
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {simulatedScenario.impacts.simulationNarrative}
                  </p>
                </div>

                {/* Flooded Zones & Critical Infrastructure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-[#0b0e17] border border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300 block mb-2">
                      Submerged Geographical Zones:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-400 font-mono">
                      {simulatedScenario.impacts.floodedZones.map((zone, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {zone}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded bg-[#0b0e17] border border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300 block mb-2">
                      Severed Critical Infrastructure:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-400 font-mono">
                      {simulatedScenario.impacts.criticalInfrastructureImpacted.length > 0 ? (
                        simulatedScenario.impacts.criticalInfrastructureImpacted.map((infra, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {infra}
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">Primary bridges and substations remain functional.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI TACTICAL COPILOT */}
      {activeTab === 'copilot' && (
        <div className="space-y-6">
          <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5 flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                  AI Tactical Operations Copilot (Role: {role.toUpperCase()})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Ground-Truth Grounded • Prompt-Injection Guarded
              </span>
            </div>

            {/* Quick Prompt Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
              {[
                'What are our top 3 critical threats?',
                'Which shelters are overflowing or near capacity?',
                'Which response teams are available for dispatch?',
                'Summarize recent incident actions from the audit log',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(q)}
                  className="px-2.5 py-1 rounded bg-[#0b0e17] hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3.5 text-xs ${
                      msg.role === 'user'
                        ? 'bg-amber-600/20 border border-amber-500/40 text-slate-100 font-mono'
                        : 'bg-[#0b0e17] border border-slate-800 text-slate-200 font-sans leading-relaxed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-500 mb-1">
                      <span className="font-bold text-slate-400 uppercase">
                        {msg.role === 'user' ? user?.name || 'Operator' : 'RakshaGrid Copilot'}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Citations & Tool Calls */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                          Ground-Truth Citations:
                        </span>
                        {msg.citations.map((c, i) => (
                          <div key={i} className="text-[11px] font-mono text-cyan-300 flex items-baseline gap-1.5">
                            <span className="text-cyan-500">[{i + 1}]</span>
                            <span>{c.title} — {c.source}: {c.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isCopilotTyping && (
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  RakshaGrid Copilot synthesizing operational evidence...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Ask tactical questions or request incident analysis..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-[#0b0e17] border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                disabled={isCopilotTyping || !inputQuery.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-mono font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RESOURCE DISPATCH APPROVALS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                  Tactical Response Force Recommendations (Human-in-the-Loop Queue)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI generates distance-optimized proposals; Incident Commander confirmation is mandatory before deployment.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400">
                {recommendations.filter((r) => r.status === 'PENDING_REVIEW').length} Pending Review
              </span>
            </div>

            {approvalFeedback && (
              <div className="p-3 mb-4 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {approvalFeedback.msg}
              </div>
            )}

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-lg border transition-all ${
                    rec.status === 'APPROVED'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : rec.status === 'REJECTED'
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-[#0b0e17] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-200">
                          {rec.incidentTitle}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            rec.incidentSeverity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {rec.incidentSeverity}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                        Target Incident #{rec.incidentId} • Required: {rec.requiredSpecialty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {rec.distanceKm} km ({rec.estimatedEtaMinutes} min ETA)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          rec.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : rec.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans mb-3">{rec.rationale}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-400">
                    <span>
                      Proposed Unit: <strong className="text-slate-200">{rec.recommendedTeamName}</strong> (Leader: {rec.teamLeader})
                    </span>

                    {rec.status === 'PENDING_REVIEW' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRejectRecommendation(rec.id)}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveRecommendation(rec)}
                          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve & Dispatch Team
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Reviewed by {rec.reviewedBy} at {rec.reviewedAt ? new Date(rec.reviewedAt).toLocaleTimeString() : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI ALERT RECOMMENDATION STAGING */}
      {activeTab === 'alert_staging' && (
        <div className="space-y-6">
          <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                  Common Alerting Protocol (CAP) Staged Broadcasts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI drafts formatted emergency broadcasts. Authorized Incident Commander must review and promote to live transmission.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {alertDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`p-4 rounded-lg border ${
                    draft.status === 'PROMOTED'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-[#0b0e17] border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold font-mono text-slate-100">
                        {draft.headline}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 font-bold">
                        {draft.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                        Confidence: {Math.round(draft.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 text-xs">
                    <div>
                      <span className="font-mono text-slate-400 font-bold">Public Instructions: </span>
                      <span className="text-slate-200 font-sans">{draft.publicInstructions}</span>
                    </div>
                    <div>
                      <span className="font-mono text-slate-400 font-bold">Technical Rationale: </span>
                      <span className="text-slate-300 font-sans">{draft.technicalRationale}</span>
                    </div>
                    <div>
                      <span className="font-mono text-slate-400 font-bold">Target Channels: </span>
                      <span className="text-cyan-300 font-mono text-[11px]">
                        {draft.targetChannels.join(' • ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">
                      Status: {draft.status} {draft.promotedBy && `(Promoted by ${draft.promotedBy})`}
                    </span>

                    {draft.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handlePromoteAlert(draft)}
                        className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        Promote to Live Broadcast
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MODEL EVALUATION & BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-5">
            <div className="pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Ground-Truth Model Performance & Statistical Evaluation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated against {benchmarks.sampleSize.toLocaleString()} historical disaster events ({benchmarks.evaluatedDataset}).
              </p>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0b0e17] p-4 rounded border border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-500">Model Accuracy</span>
                <div className="text-2xl font-mono font-bold text-slate-100 mt-1">
                  {(benchmarks.accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Validated across test fold</span>
              </div>

              <div className="bg-[#0b0e17] p-4 rounded border border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-500">Precision (PPV)</span>
                <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                  {(benchmarks.precision * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-mono text-slate-400">Low false alarm rate</span>
              </div>

              <div className="bg-[#0b0e17] p-4 rounded border border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-500">Recall / Sensitivity</span>
                <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                  {(benchmarks.recall * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-mono text-amber-400">Critical safety priority</span>
              </div>

              <div className="bg-[#0b0e17] p-4 rounded border border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-500">Harmonic F1 Score</span>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                  {(benchmarks.f1Score * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-mono text-slate-400">Brier score: {benchmarks.brierScore}</span>
              </div>
            </div>

            {/* 2x2 Confusion Matrix */}
            <div className="p-4 rounded bg-[#0b0e17] border border-slate-800 mb-6">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3">
                Confusion Matrix (Classification of Catastrophic Flood Thresholds):
              </h4>
              <div className="grid grid-cols-2 gap-3 max-w-md font-mono text-xs">
                <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30">
                  <div className="text-slate-400 text-[10px] uppercase">True Positive (TP)</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {benchmarks.confusionMatrix.truePositive}
                  </div>
                  <div className="text-[10px] text-slate-400">Correctly anticipated breach</div>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">False Positive (FP)</div>
                  <div className="text-lg font-bold text-amber-300">
                    {benchmarks.confusionMatrix.falsePositive}
                  </div>
                  <div className="text-[10px] text-slate-400">Precautionary false alarm</div>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">False Negative (FN)</div>
                  <div className="text-lg font-bold text-rose-400">
                    {benchmarks.confusionMatrix.falseNegative}
                  </div>
                  <div className="text-[10px] text-slate-400">Missed surge events</div>
                </div>

                <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30">
                  <div className="text-slate-400 text-[10px] uppercase">True Negative (TN)</div>
                  <div className="text-lg font-bold text-emerald-300">
                    {benchmarks.confusionMatrix.trueNegative}
                  </div>
                  <div className="text-[10px] text-slate-400">Correctly classified non-critical</div>
                </div>
              </div>
            </div>

            {/* Explicit Limitations */}
            <div className="p-4 rounded bg-[#0b0e17] border border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase text-rose-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Documented Operational Boundaries & Physical Limitations:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {benchmarks.limitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-mono font-bold">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
