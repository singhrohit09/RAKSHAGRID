/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Clock,
  Shield,
  Layers,
  Activity,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Incident, Shelter, Resource } from '../types';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { MetricCard } from '../components/common/MetricCard';

interface AnalyticsPageProps {
  incidents: Incident[];
  shelters: Shelter[];
  resources: Resource[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  incidents,
  shelters,
  resources,
}) => {
  // Response Time Benchmarks (Minutes to First Boot on Ground)
  const responseTimesData = [
    { type: 'Cyclone', target: 25, achieved: 18 },
    { type: 'Flood', target: 30, achieved: 22 },
    { type: 'Landslide', target: 45, achieved: 38 },
    { type: 'HazMat', target: 15, achieved: 12 },
    { type: 'Earthquake', target: 20, achieved: 19 },
    { type: 'Wildfire', target: 30, achieved: 27 },
  ];

  // Regional Population Affected
  const regionalImpactData = [
    { region: 'Odisha Coastal', count: 47400 },
    { region: 'Gujarat Industrial', count: 1200 },
    { region: 'Sub-Himalayan', count: 320 },
    { region: 'Delhi NCT', count: 3500 },
    { region: 'Garhwal Zone', count: 1800 },
  ];

  // Shelter Utilization
  const shelterUtilizationData = shelters.map((s) => ({
    name: s.id,
    occupancy: s.currentOccupancy,
    capacity: s.capacity,
  }));

  // Resource depletion rate
  const resourceData = resources.map((r) => ({
    name: r.name.split(' ')[0] + ' ' + (r.name.split(' ')[1] || ''),
    available: r.availableQuantity,
    deployed: r.totalQuantity - r.availableQuantity,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Disaster Operations Intelligence & Analytics"
        kicker="Decision Support & Performance Analytics"
        description="Quantitative benchmarks on emergency dispatch latency, population displacement, relief burn rate, and life-safety efficacy."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Model: Operational Metric Aggregator v1.0</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">[DEMO BENCHMARKS]</span>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Mean Response Latency"
          value="22.6m"
          subtext="Target standard: <30m"
          trend={{ direction: 'down', text: '4.2m faster' }}
          icon={Clock}
          variant="success"
        />
        <MetricCard
          label="Total Evacuees Sheltered"
          value={shelters.reduce((a, s) => a + s.currentOccupancy, 0).toLocaleString()}
          subtext="Across 6 active centers"
          icon={Shield}
          variant="info"
        />
        <MetricCard
          label="Civilian Rescue Rate"
          value="99.8%"
          subtext="13,072 successfully extracted"
          trend={{ direction: 'up', text: '0.4%' }}
          icon={HeartPulse}
          variant="success"
        />
        <MetricCard
          label="Relief Stock Burn Rate"
          value="34.8%"
          subtext="Depot reserves sufficient"
          icon={Activity}
          variant="default"
        />
      </div>

      {/* 2-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Benchmarks */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Response Latency vs Mandated Target (Minutes)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">All below SLA</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimesData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161c24',
                    borderColor: '#334155',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="achieved" name="Achieved Time (min)" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="target" name="Target SLA (min)" fill="#475569" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Population Impact */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Vulnerable Population In Impact Radius
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Census Grounded</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionalImpactData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis
                  dataKey="region"
                  type="category"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161c24',
                    borderColor: '#334155',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" name="People In Hazard Zone" fill="#f59e0b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelter Capacity vs Occupancy */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Evacuation Center Utilization
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Real-Time Headcount</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelterUtilizationData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161c24',
                    borderColor: '#334155',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="occupancy" name="Current Occupants" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="capacity" name="Total Bed Capacity" fill="#334155" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Burn Rate */}
        <div className="p-4 bg-[#12171e] border border-slate-800 rounded flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Tactical Stock Deployment Ratio
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Available vs Deployed</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161c24',
                    borderColor: '#334155',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="available" name="Available in Stock" fill="#10b981" stackId="a" />
                <Bar dataKey="deployed" name="Deployed in Field" fill="#e11d48" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
