import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { AuditEntityType } from '../types/audit';
import { 
  History, 
  Search, 
  FileJson, 
  FileSpreadsheet, 
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { exportToCSV, exportToJSON } from '../utils/csvExport';
import { formatDateTime } from '../utils/formatters';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useRaksha();

  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = 
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.entityId.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase());

      const matchEntity = filterEntity === 'all' || log.entityType === filterEntity;
      return matchSearch && matchEntity;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [auditLogs, search, filterEntity, sortOrder]);

  const handleExportCSV = () => {
    const rows = filteredLogs.map(l => ({
      EventID: l.id,
      Timestamp: l.timestamp,
      Actor: l.actor,
      Role: l.actorRole,
      Action: l.action,
      EntityType: l.entityType,
      EntityID: l.entityId,
      Description: l.description
    }));

    exportToCSV(`rakshagrid-audit-log-${Date.now()}`, rows, [
      { key: 'EventID', label: 'Event ID' },
      { key: 'Timestamp', label: 'ISO Timestamp' },
      { key: 'Actor', label: 'Actor Name' },
      { key: 'Role', label: 'Persona Role' },
      { key: 'Action', label: 'Action Performed' },
      { key: 'EntityType', label: 'Entity Domain' },
      { key: 'EntityID', label: 'Entity Identifier' },
      { key: 'Description', label: 'Activity Description' }
    ]);
  };

  const handleExportJSON = () => {
    exportToJSON(`rakshagrid-audit-log-${Date.now()}`, filteredLogs);
  };

  const entityBadges: Record<AuditEntityType, string> = {
    incident: 'bg-emergency/15 text-emergency border-emergency/30',
    team: 'bg-operational-cyan/15 text-operational-cyan border-operational-cyan/30',
    shelter: 'bg-safe/15 text-safe border-safe/30',
    resource: 'bg-hazard/15 text-hazard border-hazard/30',
    task: 'bg-operational-purple/15 text-purple-400 border-purple-500/30',
    alert: 'bg-emergency/20 text-emergency border-emergency/40',
    settings: 'bg-panel-subtle text-primary-muted border-border',
    system: 'bg-charcoal text-primary-dim border-border',
    geofence: 'bg-operational-cyan/20 text-operational-cyan border-operational-cyan/40'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary-muted" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              AUDIT LOG & OPERATIONAL ACTIVITY TRAIL
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
              {auditLogs.length} LOGGED EVENTS
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Application-level operational ledger recording all incidents, allocations, alerts, and state transitions.
          </p>
        </div>

        {/* Exports */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={FileJson}
            onClick={handleExportJSON}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Audit Disclaimer Notice */}
      <div className="p-3 bg-panel border border-border rounded-lg text-xs flex items-center justify-between text-primary-dim font-mono">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-operational-cyan shrink-0" />
          <span>PHASE 1 IN-MEMORY / LOCALSTORAGE AUDIT: Events generated through centralized domain services. Phase 2 introduces cryptographically sealed server-side audit trails.</span>
        </span>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search audit descriptions, actors, or entity IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Entity Domains</option>
            <option value="incident">Incidents</option>
            <option value="team">Teams</option>
            <option value="shelter">Shelters</option>
            <option value="resource">Resources</option>
            <option value="task">Tasks</option>
            <option value="alert">Alerts</option>
            <option value="settings">Settings</option>
            <option value="system">System / Reset</option>
          </select>
        </div>

        <div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="desc">Newest First (Descending)</option>
            <option value="asc">Oldest First (Ascending)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel-card text-[10px] font-mono text-primary-dim uppercase border-b border-border tracking-wider">
              <tr>
                <th className="p-3">Event ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / Persona</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Action</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-primary-dim font-sans">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-panel-elevated transition-colors">
                    <td className="p-3 font-semibold text-primary">{log.id}</td>
                    <td className="p-3 text-primary-dim whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-3">
                      <div className="text-primary font-bold font-sans">{log.actor}</div>
                      <div className="text-[10px] text-primary-dim font-sans">{log.actorRole}</div>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${entityBadges[log.entityType] || 'border-border'}`}>
                        {log.entityType}
                      </span>
                    </td>
                    <td className="p-3 text-primary-muted font-bold">
                      {log.action}
                    </td>
                    <td className="p-3 font-sans text-primary leading-relaxed max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
