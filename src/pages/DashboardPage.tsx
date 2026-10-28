import React from 'react';
import { useRaksha } from '../context/RakshaContext';
import { 
  Flame, 
  Users, 
  Home, 
  Boxes, 
  KanbanSquare, 
  AlertTriangle, 
  Plus, 
  ShieldAlert, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { AlertBanner } from '../components/common/AlertBanner';
import { formatRelativeTime, formatNumber } from '../utils/formatters';
import { hasPermission } from '../utils/permissions';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { 
    incidents, 
    teams, 
    shelters, 
    resources, 
    tasks, 
    alerts, 
    settings, 
    activePersonaId 
  } = useRaksha();

  const navigate = useNavigate();

  // Dynamic Metrics Derived From Real Store Records
  const activeIncidents = incidents.filter(i => i.status === 'Active' || i.status === 'Reported');
  const criticalIncidents = incidents.filter(i => i.severity === 'Critical' && i.status !== 'Closed');
  const availableTeams = teams.filter(t => t.status === 'Available');
  const deployedTeams = teams.filter(t => t.status === 'Deployed');
  
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalShelterOccupancy = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const shelterUtilizationRate = totalShelterCapacity > 0 ? Math.round((totalShelterOccupancy / totalShelterCapacity) * 100) : 0;

  const lowStockResources = resources.filter(r => r.status === 'Low Stock' || r.status === 'Critical' || r.status === 'Depleted');
  const openTasks = tasks.filter(t => t.status !== 'Completed');
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now());

  // Severity Distribution Data
  const severityCounts = {
    Critical: incidents.filter(i => i.severity === 'Critical').length,
    High: incidents.filter(i => i.severity === 'High').length,
    Moderate: incidents.filter(i => i.severity === 'Moderate').length,
    Low: incidents.filter(i => i.severity === 'Low').length
  };

  const severityChartData = [
    { name: 'Critical', value: severityCounts.Critical, color: '#dc2626' },
    { name: 'High', value: severityCounts.High, color: '#d97706' },
    { name: 'Moderate', value: severityCounts.Moderate, color: '#0284c7' },
    { name: 'Low', value: severityCounts.Low, color: '#059669' }
  ].filter(d => d.value > 0);

  // Status Distribution Data
  const statusCounts = [
    { status: 'Reported', count: incidents.filter(i => i.status === 'Reported').length },
    { status: 'Verified', count: incidents.filter(i => i.status === 'Verified').length },
    { status: 'Active', count: incidents.filter(i => i.status === 'Active').length },
    { status: 'Contained', count: incidents.filter(i => i.status === 'Contained').length },
    { status: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length },
    { status: 'Closed', count: incidents.filter(i => i.status === 'Closed').length },
  ];

  // Permissions check
  const canCreateIncident = hasPermission(activePersonaId, 'create_incidents');
  const canAssignTask = hasPermission(activePersonaId, 'assign_tasks');
  const canCreateAlert = hasPermission(activePersonaId, 'create_alerts');

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Page Title & Operational Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              OPERATIONAL COMMAND OVERVIEW
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emergency/15 text-emergency border border-emergency/40 uppercase font-bold tracking-widest animate-pulse">
              LIVE EXERCISE
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            {settings.operationsCenterName} • Sector: {settings.operatingRegion}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="danger"
            icon={Plus}
            onClick={() => navigate('/incidents')}
            restricted={!canCreateIncident}
            restrictedReason="Creating incidents requires Administrator or Incident Commander role."
          >
            Create Incident
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={KanbanSquare}
            onClick={() => navigate('/tasks')}
            restricted={!canAssignTask}
            restrictedReason="Task assignment is restricted for this persona."
          >
            Assign Task
          </Button>
          <Button
            size="sm"
            variant="warning"
            icon={AlertTriangle}
            onClick={() => navigate('/alerts')}
            restricted={!canCreateAlert}
            restrictedReason="Drafting emergency alerts requires Commander or Administrator role."
          >
            Draft Alert
          </Button>
        </div>
      </div>

      {/* Critical Incidents Warning Banner if any */}
      {criticalIncidents.length > 0 && (
        <AlertBanner
          type="emergency"
          title={`PRIORITY ESCALATION: ${criticalIncidents.length} Critical Incident${criticalIncidents.length > 1 ? 's' : ''} Active`}
          action={
            <Link to="/incidents" className="text-xs font-bold text-emergency hover:underline flex items-center gap-1">
              View Critical <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {criticalIncidents.map(i => `${i.id}: ${i.title}`).join(' • ')}
        </AlertBanner>
      )}

      {/* Primary KPI Grid (Directly Derived from Live Store Records) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Active Incidents"
          value={activeIncidents.length}
          subtitle={`${criticalIncidents.length} critical, ${incidents.length} total`}
          icon={Flame}
          variant={criticalIncidents.length > 0 ? 'emergency' : 'default'}
          badgeText={`${incidents.length} TOTAL`}
          onClick={() => navigate('/incidents')}
        />
        <StatCard
          title="Critical Severity"
          value={criticalIncidents.length}
          subtitle="Immediate response required"
          icon={ShieldAlert}
          variant="emergency"
          onClick={() => navigate('/incidents')}
        />
        <StatCard
          title="Response Teams"
          value={`${availableTeams.length} / ${teams.length}`}
          subtitle={`${deployedTeams.length} deployed on field`}
          icon={Users}
          variant="info"
          badgeText={`${availableTeams.length} READY`}
          onClick={() => navigate('/teams')}
        />
        <StatCard
          title="Shelter Capacity"
          value={`${shelterUtilizationRate}%`}
          subtitle={`${formatNumber(totalShelterOccupancy)} / ${formatNumber(totalShelterCapacity)} persons`}
          icon={Home}
          variant={shelterUtilizationRate > 85 ? 'hazard' : 'safe'}
          badgeText={`${shelters.length} SHELTERS`}
          onClick={() => navigate('/shelters')}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockResources.length}
          subtitle={lowStockResources.length > 0 ? 'Replenishment needed' : 'Supplies sufficient'}
          icon={Boxes}
          variant={lowStockResources.length > 0 ? 'hazard' : 'safe'}
          badgeText={`${resources.length} ITEMS`}
          onClick={() => navigate('/resources')}
        />
        <StatCard
          title="Open Tasks"
          value={openTasks.length}
          subtitle={overdueTasks.length > 0 ? `${overdueTasks.length} overdue tasks` : 'All tasks on schedule'}
          icon={KanbanSquare}
          variant={overdueTasks.length > 0 ? 'hazard' : 'default'}
          badgeText={`${overdueTasks.length} OVERDUE`}
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Operational Charts & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Incident Status Bar Breakdown */}
        <div className="bg-panel border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Incident Status Distribution
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">LIVE DATA</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="status" stroke="#656d76" fontSize={10} tickLine={false} />
                <YAxis stroke="#656d76" fontSize={10} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '11px', color: '#f0f3f6' }}
                  cursor={{ fill: '#21262d' }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-primary-dim mt-2 text-right">
            Updates automatically with incident status transitions
          </p>
        </div>

        {/* Severity Distribution Donut Chart */}
        <div className="bg-panel border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Incident Severity Breakdown
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">{incidents.length} TOTAL</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={64}
                    paddingAngle={3}
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '11px', color: '#f0f3f6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-primary-dim">No incident records found.</div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-border/60">
            {severityChartData.map(s => (
              <div key={s.name}>
                <span className="text-[10px] font-mono text-primary-dim block">{s.name}</span>
                <span className="text-xs font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Emergency Overview */}
        <div className="bg-panel border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Regional Situation Briefing
            </h3>
            <span className="text-[10px] font-mono text-safe bg-safe/10 border border-safe/30 px-1.5 py-0.5 rounded">
              EOC MONITORED
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-panel-subtle rounded border border-border">
              <span className="text-[10px] font-mono text-primary-dim block uppercase">Primary Threat Vector</span>
              <p className="text-primary font-semibold mt-0.5">
                Yamuna River Inundation & Hazardous Vapor Plume
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-charcoal rounded border border-border">
                <span className="text-primary-dim block">AFFECTED POP.:</span>
                <span className="text-primary font-bold">
                  {formatNumber(incidents.reduce((acc, i) => acc + i.affectedPopulation, 0))}
                </span>
              </div>
              <div className="p-2 bg-charcoal rounded border border-border">
                <span className="text-primary-dim block">ACTIVE ALERTS:</span>
                <span className="text-hazard font-bold">
                  {alerts.filter(a => a.status === 'Approved for Demo').length} Demo Warnings
                </span>
              </div>
            </div>

            <p className="text-[11px] text-primary-muted leading-relaxed">
              Coordinated relief efforts underway across Sector 4. Evacuation shelters SHL-NORTH-01 and SHL-EAST-02 are operating near peak capacity.
            </p>
          </div>

          <Link
            to="/map"
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded bg-panel-elevated hover:bg-panel-subtle border border-border text-xs font-semibold text-primary transition-colors"
          >
            Open Operational Map <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Recent Incidents & Demo Alert Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Incidents Table */}
        <div className="bg-panel border border-border rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-border bg-panel-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emergency" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Recent Incidents ({incidents.length})
              </h3>
            </div>
            <Link to="/incidents" className="text-xs text-primary-muted hover:text-primary">
              View all &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-panel-subtle text-[10px] font-mono text-primary-dim uppercase border-b border-border">
                <tr>
                  <th className="p-2.5">ID & Title</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {incidents.slice(0, 5).map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate('/incidents')}
                    className="hover:bg-panel-elevated cursor-pointer transition-colors"
                  >
                    <td className="p-2.5">
                      <div className="font-bold text-primary font-sans">{inc.title}</div>
                      <div className="text-[10px] text-primary-dim">{inc.id} • {inc.locationName}</div>
                    </td>
                    <td className="p-2.5">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="p-2.5">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="p-2.5 text-primary-dim text-[11px]">
                      {formatRelativeTime(inc.reportedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Emergency Alerts & CAP Status */}
        <div className="bg-panel border border-border rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-border bg-panel-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-hazard" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Emergency Alerts ({alerts.length})
              </h3>
            </div>
            <Link to="/alerts" className="text-xs text-primary-muted hover:text-primary">
              Manage &rarr;
            </Link>
          </div>

          <div className="divide-y divide-border/40">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-primary-dim">
                No alerts currently drafted or approved.
              </div>
            ) : (
              alerts.slice(0, 4).map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => navigate('/alerts')}
                  className="p-3 hover:bg-panel-elevated cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-panel-subtle text-primary border border-border">
                      {alt.type.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      alt.status === 'Approved for Demo' 
                        ? 'bg-emergency/15 text-emergency border border-emergency/30' 
                        : 'bg-panel-subtle text-primary-muted border border-border'
                    }`}>
                      {alt.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-primary">{alt.title}</h4>
                  <p className="text-[11px] text-primary-muted line-clamp-1 mt-0.5">{alt.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
