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
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Model: Operational Metric Aggregator</span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">Active Situational Reporting</span>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Mean Response Latency"
          value="22.6m"
          subtext="Standard benchmark: <30m"
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
        <div className="p-5 bg-white border border-[#E4E3DC] rounded-2xl flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#171B19]">Response Latency Benchmarks</h3>
              <p className="text-xs text-[#777D77]">Minutes from alert broadcast to first team deployment</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E5EDE6] text-[#315C46]">
              Target: &lt;30m
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E3DC" vertical={false} />
                <XAxis dataKey="type" stroke="#777D77" fontSize={11} tickLine={false} />
                <YAxis stroke="#777D77" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4E3DC',
                    borderRadius: '8px',
                    color: '#171B19',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(23, 27, 25, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="achieved" name="Achieved Time" fill="#315C46" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target Ceiling" fill="#C18A32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Population Impact by Region */}
        <div className="p-5 bg-white border border-[#E4E3DC] rounded-2xl flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#171B19]">Population Displacement by Theater</h3>
              <p className="text-xs text-[#777D77]">Aggregated civilian headcount in active hazard zones</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalImpactData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E3DC" horizontal={false} />
                <XAxis type="number" stroke="#777D77" fontSize={11} tickLine={false} />
                <YAxis dataKey="region" type="category" stroke="#171B19" fontSize={11} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4E3DC',
                    borderRadius: '8px',
                    color: '#171B19',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(23, 27, 25, 0.08)',
                  }}
                />
                <Bar dataKey="count" name="Civilians Affected" fill="#B9433D" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelter Utilization */}
        <div className="p-5 bg-white border border-[#E4E3DC] rounded-2xl flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#171B19]">Shelter Capacity vs Occupancy</h3>
              <p className="text-xs text-[#777D77]">Real-time bed utilization across verified relief shelters</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelterUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E3DC" vertical={false} />
                <XAxis dataKey="name" stroke="#777D77" fontSize={11} tickLine={false} />
                <YAxis stroke="#777D77" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4E3DC',
                    borderRadius: '8px',
                    color: '#171B19',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(23, 27, 25, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="occupancy" name="Current Occupants" fill="#315C46" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Max Capacity" fill="#E4E3DC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Supplies Deployed vs Reserve */}
        <div className="p-5 bg-white border border-[#E4E3DC] rounded-2xl flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#171B19]">Critical Resource Deployment</h3>
              <p className="text-xs text-[#777D77]">Stock allocation between deployed units and hub depots</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E3DC" vertical={false} />
                <XAxis dataKey="name" stroke="#777D77" fontSize={11} tickLine={false} />
                <YAxis stroke="#777D77" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E4E3DC',
                    borderRadius: '8px',
                    color: '#171B19',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(23, 27, 25, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="deployed" name="Deployed Stock" fill="#C18A32" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Hub Depot Reserves" fill="#315C46" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
