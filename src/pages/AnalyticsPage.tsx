import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Filter
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { exportToCSV } from '../utils/csvExport';
import { formatCategory } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { incidents, teams, shelters, resources, tasks } = useRaksha();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filtered dataset for category analytics
  const filteredIncidents = useMemo(() => {
    if (categoryFilter === 'all') return incidents;
    return incidents.filter(i => i.category === categoryFilter);
  }, [incidents, categoryFilter]);

  // 1. Incidents By Category
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => {
      const cat = formatCategory(i.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [incidents]);

  // 2. Incidents By Severity
  const severityData = useMemo(() => {
    const colors: Record<string, string> = {
      Critical: '#dc2626',
      High: '#d97706',
      Moderate: '#0284c7',
      Low: '#059669'
    };
    const counts: Record<string, number> = { Critical: 0, High: 0, Moderate: 0, Low: 0 };
    filteredIncidents.forEach(i => {
      counts[i.severity] = (counts[i.severity] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#656d76'
    })).filter(d => d.value > 0);
  }, [filteredIncidents]);

  // 3. Shelter Capacity vs Occupancy
  const shelterChartData = useMemo(() => {
    return shelters.map(s => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name,
      occupancy: s.currentOccupancy,
      capacity: s.capacity,
      rate: Math.round((s.currentOccupancy / s.capacity) * 100)
    }));
  }, [shelters]);

  // 4. Team Deployment Distribution
  const teamStatusData = useMemo(() => {
    const counts: Record<string, number> = { Available: 0, Deployed: 0, Busy: 0, 'Off Duty': 0 };
    teams.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return [
      { name: 'Available', count: counts.Available, color: '#059669' },
      { name: 'Deployed', count: counts.Deployed, color: '#0284c7' },
      { name: 'Busy', count: counts.Busy, color: '#d97706' },
      { name: 'Off Duty', count: counts['Off Duty'], color: '#475569' },
    ];
  }, [teams]);

  // 5. Task Status Velocity
  const taskStatusData = useMemo(() => {
    const counts: Record<string, number> = { Backlog: 0, Ready: 0, 'In Progress': 0, Blocked: 0, Completed: 0 };
    tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [tasks]);

  // CSV Exporters
  const handleExportIncidents = () => {
    const rows = incidents.map(i => ({
      ID: i.id,
      Title: i.title,
      Category: i.category,
      Severity: i.severity,
      Status: i.status,
      Priority: i.priority,
      Location: i.locationName,
      Latitude: i.latitude,
      Longitude: i.longitude,
      AffectedPopulation: i.affectedPopulation,
      Casualties: i.casualties,
      AssignedTeam: i.assignedTeamName || 'Unassigned',
      ReportedAt: i.reportedAt
    }));

    exportToCSV(`rakshagrid-incidents-${Date.now()}`, rows, [
      { key: 'ID', label: 'Incident ID' },
      { key: 'Title', label: 'Incident Title' },
      { key: 'Category', label: 'Category' },
      { key: 'Severity', label: 'Severity' },
      { key: 'Status', label: 'Status' },
      { key: 'Priority', label: 'Priority' },
      { key: 'Location', label: 'Location' },
      { key: 'Latitude', label: 'Latitude' },
      { key: 'Longitude', label: 'Longitude' },
      { key: 'AffectedPopulation', label: 'Affected Population' },
      { key: 'Casualties', label: 'Casualties' },
      { key: 'AssignedTeam', label: 'Assigned Team' },
      { key: 'ReportedAt', label: 'Reported Timestamp' }
    ]);
  };

  const handleExportShelters = () => {
    const rows = shelters.map(s => ({
      ID: s.id,
      Name: s.name,
      Region: s.region,
      Capacity: s.capacity,
      Occupancy: s.currentOccupancy,
      Available: s.capacity - s.currentOccupancy,
      Status: s.status,
      Contact: `${s.contactPerson} (${s.contactPhone})`
    }));

    exportToCSV(`rakshagrid-shelters-${Date.now()}`, rows);
  };

  const handleExportResources = () => {
    const rows = resources.map(r => ({
      ID: r.id,
      Name: r.name,
      Category: r.category,
      Available: r.quantityAvailable,
      Allocated: r.quantityAllocated,
      Unit: r.unit,
      Location: r.storageLocation,
      Status: r.status
    }));

    exportToCSV(`rakshagrid-inventory-${Date.now()}`, rows);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-operational-cyan" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              OPERATIONAL ANALYTICS & SITREP REPORTS
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted uppercase font-bold">
              DERIVED FROM LIVE STORE
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Statistical breakdown of disaster hazards, shelter occupancy, field deployments, and supply health.
          </p>
        </div>

        {/* CSV Export Dropdown / Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={handleExportIncidents}
          >
            Export Incidents CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportShelters}
          >
            Export Shelters CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportResources}
          >
            Export Inventory CSV
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 p-3 bg-panel border border-border rounded-lg text-xs">
        <Filter className="w-4 h-4 text-primary-dim" />
        <span className="text-primary-muted font-medium">Filter Severity Chart by Category:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-charcoal border border-border rounded px-2.5 py-1 text-xs text-primary focus:outline-none"
        >
          <option value="all">All Disaster Categories ({incidents.length} total)</option>
          <option value="flood">Flood</option>
          <option value="flash_flood">Flash Flood</option>
          <option value="heavy_rainfall">Heavy Rainfall</option>
          <option value="cyclone">Cyclone</option>
          <option value="earthquake">Earthquake</option>
          <option value="landslide">Landslide</option>
          <option value="industrial">Industrial Hazmat</option>
        </select>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Incidents By Category Bar Chart */}
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Incident Frequency by Category
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">{categoryData.length} CATEGORIES</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#656d76" fontSize={10} angle={-25} textAnchor="end" interval={0} />
                <YAxis stroke="#656d76" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '11px', color: '#f0f3f6' }}
                  cursor={{ fill: '#21262d' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Incidents By Severity Donut */}
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Severity Distribution ({filteredIncidents.length} records)
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">FILTER APPLIED</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '11px', color: '#f0f3f6' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-primary-dim">No records for selected category.</div>
            )}
          </div>
        </div>

        {/* 3. Shelter Capacity vs Current Occupancy */}
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Shelter Occupancy vs Maximum Capacity
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">{shelters.length} SITES</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelterChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#656d76" fontSize={10} angle={-20} textAnchor="end" />
                <YAxis stroke="#656d76" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '11px', color: '#f0f3f6' }}
                  cursor={{ fill: '#21262d' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="occupancy" name="Current Occupancy" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Total Capacity" fill="#30363d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Task Coordination Velocity */}
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Response Task Board Velocity
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">{tasks.length} TOTAL TASKS</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="status" stroke="#656d76" fontSize={10} />
                <YAxis stroke="#656d76" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '11px', color: '#f0f3f6' }}
                  cursor={{ fill: '#21262d' }}
                />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Team Deployment Status */}
        <div className="bg-panel border border-border rounded-lg p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Response Team Readiness & Deployment Breakdown
            </h3>
            <span className="text-[10px] font-mono text-primary-dim">{teams.length} FIELD UNITS</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {teamStatusData.map((st) => (
              <div key={st.name} className="p-3 bg-charcoal rounded border border-border">
                <span className="text-xs font-mono uppercase text-primary-dim block">{st.name}</span>
                <span className="text-xl font-bold font-mono mt-1 block" style={{ color: st.color }}>
                  {st.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Illustrative Notice */}
      <div className="p-3 bg-charcoal rounded border border-border text-[11px] font-mono text-primary-dim text-center">
        STATISTICAL NOTICE: Metrics and visualizations reflect Phase 1 in-browser simulated records. They represent drill exercise parameters rather than verified government telemetry.
      </div>
    </div>
  );
};
