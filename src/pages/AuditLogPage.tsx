/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { History, Download, Filter, Search, FileText, CheckCircle2, Lock } from 'lucide-react';
import { AuditEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { DataTable, Column } from '../components/common/DataTable';
import { SearchBar } from '../components/common/SearchBar';
import { FilterBar } from '../components/common/FilterBar';

interface AuditLogPageProps {
  auditLogs: AuditEvent[];
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ auditLogs }) => {
  const { role, permissions } = useAuth();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  if (!permissions.canViewAudit) {
    return (
      <div className="space-y-6">
        <ResponsivePageHeader
          title="Command Compliance & Audit Trail"
          kicker="Non-Repudiation Security Registry"
          description="Chronological record of every incident report, dispatch order, alert transmission, and system alteration."
        />
        <div className="p-8 bg-[#12171e] border border-amber-900/60 rounded-lg flex flex-col items-center text-center max-w-lg mx-auto space-y-3.5 my-8">
          <div className="p-3.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
            Restricted Operational Clearance
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Access to the immutable audit trail is restricted to <strong>Administrator</strong> and <strong>Incident Commander</strong> roles.
          </p>
          <div className="text-xs font-mono text-amber-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            Active Persona: <span className="uppercase font-bold">{role.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>
    );
  }

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          log.details.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.actor.name.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q) ||
          log.entityType.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
      if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
      return true;
    });
  }, [auditLogs, search, severityFilter, entityFilter]);

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rakshagrid_audit_trail_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Event ID', 'Timestamp', 'Actor Name', 'Role', 'Agency', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Severity', 'IP'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.actor.name}"`,
      l.actor.role,
      `"${l.actor.agency}"`,
      l.action,
      l.entityType,
      l.entityId,
      `"${l.details.replace(/"/g, '""')}"`,
      l.severity,
      l.ipAddress,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rakshagrid_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<AuditEvent>[] = [
    {
      header: 'Event ID',
      accessorKey: 'id',
      width: '100px',
      sortable: true,
      cell: (item) => <span className="font-mono text-amber-400 font-bold">{item.id}</span>,
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      width: '170px',
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-slate-400 tabular-nums text-xs">
          {new Date(item.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Actor & Role',
      sortable: true,
      width: '200px',
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-200">{item.actor.name}</div>
          <div className="text-[10px] text-amber-400/90 font-mono capitalize">
            {item.actor.role.replace(/_/g, ' ')} · {item.actor.agency}
          </div>
        </div>
      ),
    },
    {
      header: 'Action Code',
      accessorKey: 'action',
      width: '180px',
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-slate-300 font-semibold text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          {item.action}
        </span>
      ),
    },
    {
      header: 'Event Description',
      cell: (item) => (
        <div className="text-slate-300 text-xs font-sans line-clamp-2">{item.details}</div>
      ),
    },
    {
      header: 'Terminal IP',
      accessorKey: 'ipAddress',
      align: 'right',
      width: '120px',
      cell: (item) => (
        <span className="font-mono text-slate-500 tabular-nums text-[11px]">{item.ipAddress}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Command Compliance & Audit Trail"
        kicker="Non-Repudiation Security Registry"
        description="Chronological record of every incident report, dispatch order, alert transmission, and system alteration."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Total Events: {auditLogs.length}</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">Integrity Verified</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-mono transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-3.5 bg-[#12171e] border border-slate-800 rounded space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search action code, actor name, entity ID, details..."
            className="flex-1 max-w-md"
          />

          <div className="text-xs font-mono text-slate-400">
            Showing <strong className="text-slate-200 tabular-nums">{filteredLogs.length}</strong> of{' '}
            <span className="tabular-nums">{auditLogs.length}</span> records
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-slate-850">
          <FilterBar
            label="Severity"
            options={[
              { id: 'all', label: 'All' },
              { id: 'info', label: 'Info' },
              { id: 'warning', label: 'Warning' },
              { id: 'critical', label: 'Critical' },
            ]}
            selectedId={severityFilter}
            onSelect={setSeverityFilter}
          />

          <FilterBar
            label="Entity"
            options={[
              { id: 'all', label: 'All Entities' },
              { id: 'incident', label: 'Incident' },
              { id: 'team', label: 'Team' },
              { id: 'alert', label: 'Alert' },
              { id: 'task', label: 'Task' },
              { id: 'resource', label: 'Resource' },
              { id: 'auth', label: 'Auth' },
            ]}
            selectedId={entityFilter}
            onSelect={setEntityFilter}
          />
        </div>
      </div>

      {/* Audit DataTable */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        keyExtractor={(item) => item.id}
        pageSize={10}
        emptyMessage="No audit event records found matching current search criteria."
      />
    </div>
  );
};
