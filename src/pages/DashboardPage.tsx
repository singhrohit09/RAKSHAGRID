/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Users,
  Home,
  Box,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Layers,
  Activity,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Incident, Team, Shelter, Resource, Task, Alert, AuditEvent } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { FilterBar } from '../components/common/FilterBar';

interface DashboardPageProps {
  incidents: Incident[];
  teams: Team[];
  shelters: Shelter[];
  resources: Resource[];
  tasks: Task[];
  alerts: Alert[];
  auditLogs: AuditEvent[];
  onNavigate: (route: string) => void;
  onAcknowledgeAlert: (id: string) => void;
  onRefreshData?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  incidents,
  teams,
  shelters,
  resources,
  tasks,
  alerts,
  auditLogs,
  onNavigate,
  onAcknowledgeAlert,
  onRefreshData,
}) => {
  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    const timestamps = incidents.map((i) => new Date(i.reportedTime).getTime()).filter((t) => !isNaN(t));
    const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();

    const rangeMs =
      dateRange === '24h'
        ? 24 * 60 * 60 * 1000
        : dateRange === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    return incidents.filter((inc) => {
      const incTime = new Date(inc.reportedTime).getTime();
      if (!isNaN(incTime) && maxTime - incTime > rangeMs) return false;

      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;
      if (selectedRegion !== 'all' && !inc.region.toLowerCase().includes(selectedRegion.toLowerCase())) return false;
      return true;
    });
  }, [incidents, selectedSeverity, selectedStatus, selectedRegion, dateRange]);

  // Operational Calculations
  const totalIncidents = incidents.length;
  const activeEmergencies = incidents.filter((i) => i.status === 'active').length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;
  const availableTeams = teams.filter((t) => t.status === 'available').length;
  const deployedTeams = teams.filter((t) => t.status === 'deployed').length;
  const openShelters = shelters.filter((s) => s.status === 'open').length;
  const totalShelterCap = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalShelterOcc = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const pendingTasks = tasks.filter((t) => t.status !== 'resolved').length;

  // Severity Distribution for Pie Chart
  const severityDistribution = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredIncidents.forEach((i) => {
      if (counts[i.severity] !== undefined) {
        counts[i.severity]++;
      }
    });
    return [
      { name: 'Critical', value: counts.critical, color: '#f43f5e', id: 'critical' },
      { name: 'High', value: counts.high, color: '#f59e0b', id: 'high' },
      { name: 'Medium', value: counts.medium, color: '#38bdf8', id: 'medium' },
      { name: 'Low', value: counts.low, color: '#10b981', id: 'low' },
    ].filter((item) => item.value > 0);
  }, [filteredIncidents]);

  // Disaster Type Distribution for Bar Chart
  const disasterTypeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    filteredIncidents.forEach((i) => {
      const typeKey = i.disasterType.toUpperCase();
      types[typeKey] = (types[typeKey] || 0) + 1;
    });
    return Object.keys(types).map((key) => ({
      name: key,
      count: types[key],
    }));
  }, [filteredIncidents]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <ResponsivePageHeader
        title="Emergency Operations Command"
        kicker="Incident Management Node 01"
        description="Unified real-time disaster intelligence, tactical field deployment, and life-safety coordination."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Telemetry Synchronized</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Local Time: {new Date().toLocaleTimeString()}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-semibold">[DEMO ENVIRONMENT]</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshData}
              aria-label="Refresh telemetry data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-mono transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/map')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-100 text-xs font-mono font-medium border border-slate-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Situational Map</span>
            </button>
          </div>
        }
      />

      {/* Operational Filter Strip */}
      <div className="p-3 bg-[#12171e] border border-slate-800 rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <FilterBar
            label="Severity"
            options={[
              { id: 'all', label: 'All Severities' },
              { id: 'critical', label: 'Critical' },
              { id: 'high', label: 'High' },
              { id: 'medium', label: 'Medium' },
            ]}
            selectedId={selectedSeverity}
            onSelect={setSelectedSeverity}
          />

          <FilterBar
            label="Status"
            options={[
              { id: 'all', label: 'All Statuses' },
              { id: 'active', label: 'Active' },
              { id: 'investigating', label: 'Investigating' },
              { id: 'contained', label: 'Contained' },
            ]}
            selectedId={selectedStatus}
            onSelect={setSelectedStatus}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Window:</span>
          {(['24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDateRange(period)}
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                dateRange === period
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          label="Total Incidents"
          value={totalIncidents}
          subtext="Recorded events"
          icon={AlertOctagon}
          onClick={() => onNavigate('/incidents')}
        />
        <MetricCard
          label="Active Emergencies"
          value={activeEmergencies}
          subtext="Ongoing operations"
          variant="critical"
          icon={Activity}
          onClick={() => onNavigate('/incidents?status=active')}
        />
        <MetricCard
          label="Critical Threats"
          value={criticalCount}
          subtext="Severity level 1"
          variant="critical"
          icon={AlertTriangle}
          onClick={() => onNavigate('/incidents?severity=critical')}
        />
        <MetricCard
          label="Teams Available"
          value={`${availableTeams} / ${teams.length}`}
          subtext={`${deployedTeams} deployed on scene`}
          variant="success"
          icon={Users}
          onClick={() => onNavigate('/teams')}
        />
        <MetricCard
          label="Shelters Open"
          value={`${openShelters} / ${shelters.length}`}
          subtext={`${Math.round((totalShelterOcc / (totalShelterCap || 1)) * 100)}% capacity`}
          variant="info"
          icon={Home}
          onClick={() => onNavigate('/shelters')}
        />
        <MetricCard
          label="Stock Status"
          value={`${resources.filter((r) => r.status === 'stocked').length} / ${resources.length}`}
          subtext="Depots supplied"
          variant="default"
          icon={Box}
          onClick={() => onNavigate('/resources')}
        />
        <MetricCard
          label="Pending Tasks"
          value={pendingTasks}
          subtext="Field dispatch queue"
          variant="warning"
          icon={CheckSquare}
          onClick={() => onNavigate('/tasks')}
        />
      </div>

      {/* Primary Analytics & Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution Donut */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Severity Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-500">[DEMO DATA]</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {severityDistribution.length === 0 ? (
              <div className="text-xs font-mono text-slate-500">No matching incident records</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(data: unknown) => {
                      const item = data as { id?: string } | undefined;
                      if (item && item.id) {
                        onNavigate(`/incidents?severity=${item.id}`);
                      }
                    }}
                    cursor="pointer"
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161c24',
                      borderColor: '#334155',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
            {severityDistribution.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(`/incidents?severity=${item.id}`)}
                className="flex items-center justify-between p-1.5 rounded hover:bg-slate-850 text-left transition-colors text-xs font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-100 font-bold tabular-nums">{item.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hazard Types Bar Chart */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Active Hazard Profiles
            </h3>
            <span className="text-xs font-mono text-slate-400">Total: {filteredIncidents.length} Events</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disasterTypeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#161c24',
                    borderColor: '#334155',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#d97706"
                  radius={[3, 3, 0, 0]}
                  onClick={(data: unknown) => {
                    const item = data as { name?: string } | undefined;
                    if (item && item.name) {
                      onNavigate(`/incidents?type=${item.name.toLowerCase()}`);
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs font-mono text-slate-500">
            <span>Click any bar to drill down into corresponding incident logs</span>
            <button
              onClick={() => onNavigate('/analytics')}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Open Full Intelligence →
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Operational Feeds: Recent Incidents & Tactical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents Table */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Recent Incident Log
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/incidents')}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All ({incidents.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-850 pb-2">
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Incident Title</th>
                  <th className="py-2 px-2">Severity</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {filteredIncidents.slice(0, 5).map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onNavigate(`/incidents?id=${inc.id}`)}
                    className="hover:bg-slate-850/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2 text-amber-400 font-semibold whitespace-nowrap">
                      {inc.id}
                    </td>
                    <td className="py-2.5 px-2 text-slate-200 font-sans font-medium max-w-[200px] truncate">
                      {inc.title}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-2 text-slate-400 max-w-[150px] truncate">
                      {inc.location}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(inc.reportedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest High-Priority Alerts */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Active Tactical Alerts
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/alerts')}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
            >
              Broadcast Center →
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded border border-slate-800 bg-slate-900/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={alert.severity} size="sm" />
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-100 text-xs leading-snug">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {alert.message}
                </p>
                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 truncate max-w-[140px]">{alert.targetRegion}</span>
                  {!alert.acknowledgedByCommander ? (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-slate-500">✓ Acknowledged</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Operational Audit Activity Feed */}
      <div className="p-4 bg-[#12171e] border border-slate-800 rounded">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Response Command Audit Trail
            </h3>
          </div>
          <button
            onClick={() => onNavigate('/audit-log')}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
          >
            Full Audit Stream ({auditLogs.length}) →
          </button>
        </div>

        <div className="divide-y divide-slate-850/60 font-mono text-xs">
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-amber-500/80 font-semibold shrink-0">[{log.action}]</span>
                <span className="text-slate-300 truncate font-sans text-xs">{log.details}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0">
                <span>{log.actor.name}</span>
                <span>·</span>
                <span className="tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
