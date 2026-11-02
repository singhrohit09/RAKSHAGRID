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
        <div className="p-8 bg-white border border-[#E4E3DC] rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto space-y-3.5 my-8 shadow-xs">
          <div className="p-3.5 rounded-full bg-[#FAF2E6] text-[#C18A32] border border-[#C18A32]/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#171B19]">
            Restricted Operational Clearance
          </h3>
          <p className="text-xs text-[#777D77] leading-relaxed max-w-sm">
            Access to the immutable audit trail is restricted to <strong>Administrator</strong> and <strong>Incident Commander</strong> roles.
          </p>
          <div className="text-xs font-semibold text-[#315C46] bg-[#E5EDE6] px-3.5 py-1.5 rounded-lg border border-[#315C46]/30">
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
      cell: (item) => <span className="font-mono text-[#315C46] font-bold text-xs">{item.id}</span>,
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      width: '170px',
      sortable: true,
      cell: (item) => (
        <span className="font-mono text-[#777D77] tabular-nums text-xs">
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
          <div className="font-semibold text-[#171B19] text-xs">{item.actor.name}</div>
          <div className="text-[11px] text-[#777D77] capitalize">
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
        <span className="font-mono text-[#171B19] font-medium text-[11px] bg-[#F5F4EF] px-2 py-0.5 rounded-md border border-[#E4E3DC]">
          {item.action}
        </span>
      ),
    },
    {
      header: 'Event Description',
      cell: (item) => (
        <div className="text-[#171B19] text-xs font-sans line-clamp-2">{item.details}</div>
      ),
    },
    {
      header: 'Terminal IP',
      accessorKey: 'ipAddress',
      align: 'right',
      width: '120px',
      cell: (item) => (
        <span className="font-mono text-[#777D77] tabular-nums text-[11px]">{item.ipAddress}</span>
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
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Total Events: {auditLogs.length}</span>
            <span>·</span>
            <span className="text-[#315C46] font-semibold">Integrity Verified</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F4EF] text-[#171B19] border border-[#E4E3DC] text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#315C46]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F4EF] text-[#171B19] border border-[#E4E3DC] text-xs font-semibold transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#315C46]" />
              <span>Export JSON</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="p-4 bg-white border border-[#E4E3DC] rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search action code, actor name, entity ID, details..."
            className="flex-1 max-w-md"
          />

          <div className="text-xs text-[#777D77] font-medium">
            Showing <strong className="text-[#171B19] tabular-nums">{filteredLogs.length}</strong> of{' '}
            <span className="tabular-nums">{auditLogs.length}</span> records
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-[#E4E3DC]">
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
