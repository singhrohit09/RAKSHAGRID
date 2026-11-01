/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Layers,
  ListFilter,
  X,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Incident } from '../types';
import { useAuth } from '../context/AuthContext';
import { ResponsivePageHeader } from '../components/common/ResponsivePageHeader';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { FormField } from '../components/common/FormField';

interface TasksPageProps {
  tasks: Task[];
  incidents: Incident[];
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  incidents,
  onCreateTask,
  onUpdateTaskStatus,
}) => {
  const { user, permissions } = useAuth();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New task form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'high' as TaskPriority,
    status: 'triage' as TaskStatus,
    incidentId: incidents[0]?.id || '',
    assignedToUserName: 'Asst. Commandant Deepak Sen',
    location: 'Sector 4, Cuttack',
    dueDateHours: '4',
  });

  const columns: { id: TaskStatus; label: string; colorClass: string }[] = [
    { id: 'triage', label: 'Triage & Staging', colorClass: 'border-t-cyan-500' },
    { id: 'en_route', label: 'En Route / Transit', colorClass: 'border-t-amber-500' },
    { id: 'on_scene', label: 'On Scene Tactical Action', colorClass: 'border-t-rose-500' },
    { id: 'resolved', label: 'Completed & Signed-Off', colorClass: 'border-t-emerald-500' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const matchedInc = incidents.find((i) => i.id === formData.incidentId);
    const dueDate = new Date(Date.now() + parseInt(formData.dueDateHours, 10) * 3600 * 1000).toISOString();

    onCreateTask({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      incidentId: formData.incidentId,
      incidentTitle: matchedInc ? matchedInc.title : 'General Operation',
      assignedToUserName: formData.assignedToUserName,
      location: formData.location,
      dueDate,
    });

    setIsCreateOpen(false);
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'high':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'medium':
        return 'text-sky-400 bg-sky-950/40 border-sky-800/60';
      case 'low':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  const advanceStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case 'triage':
        return 'en_route';
      case 'en_route':
        return 'on_scene';
      case 'on_scene':
        return 'resolved';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsivePageHeader
        title="Field Tactical Dispatch Board"
        kicker="Incident Action Plan (IAP) Execution"
        description="Operational task allocation, responder milestone tracking, and priority triage for rapid on-ground intervention."
        metadata={
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Total Tasks: {tasks.length}</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">
              Pending: {tasks.filter((t) => t.status !== 'resolved').length}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  viewMode === 'board' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  viewMode === 'list' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400'
                }`}
              >
                List
              </button>
            </div>

            {permissions.canAssignTasks && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Field Task</span>
              </button>
            )}
          </div>
        }
      />

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`bg-[#12171e] border border-slate-800 rounded-lg p-3.5 flex flex-col border-t-2 ${col.colorClass}`}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-850 mb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {col.label}
                  </h3>
                  <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800 tabular-nums">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-slate-600">
                      No tasks in this stage
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const nextSt = advanceStatus(task.status);
                      return (
                        <div
                          key={task.id}
                          className="p-3 bg-slate-900/90 border border-slate-800 rounded hover:border-slate-700 transition-colors space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-amber-400 font-bold">
                              {task.id}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getPriorityStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-slate-100 text-xs leading-snug">
                            {task.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="pt-2 border-t border-slate-850 text-[11px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Assigned:</span>
                              <span className="text-slate-200 truncate max-w-[130px] font-medium">
                                {task.assignedToUserName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Due:</span>
                              <span className="tabular-nums">
                                {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {nextSt && (
                            <button
                              type="button"
                              onClick={() => onUpdateTaskStatus(task.id, nextSt)}
                              className="w-full mt-2 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Advance to {nextSt.replace('_', ' ')}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="border border-slate-800 rounded bg-[#12171e] overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0d1117] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3.5">ID</th>
                <th className="py-3 px-3.5">Task Title</th>
                <th className="py-3 px-3.5">Priority</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Assigned Responder</th>
                <th className="py-3 px-3.5">Target Incident</th>
                <th className="py-3 px-3.5 text-right">Due Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-amber-400">{task.id}</td>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-slate-100 max-w-[250px]">
                    {task.title}
                  </td>
                  <td className="py-2.5 px-3.5 uppercase">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getPriorityStyle(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 uppercase text-slate-300">
                    {task.status.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300">{task.assignedToUserName}</td>
                  <td className="py-2.5 px-3.5 text-slate-400 max-w-[180px] truncate">
                    {task.incidentTitle}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-slate-400 tabular-nums">
                    {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[#161c24] border border-slate-750 rounded-lg shadow-2xl overflow-hidden p-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                Issue Field Action Task
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <FormField label="Task Objective Title" required id="tsk-title">
                <input
                  id="tsk-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Evacuate stranded elderly citizens from Ward 4"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Priority Level" id="tsk-priority">
                  <select
                    id="tsk-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80 uppercase"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </FormField>

                <FormField label="Target Incident" id="tsk-inc">
                  <select
                    id="tsk-inc"
                    value={formData.incidentId}
                    onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                  >
                    {incidents.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.id} - {i.disasterType.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Assigned Responder / Team" id="tsk-resp">
                  <input
                    id="tsk-resp"
                    type="text"
                    value={formData.assignedToUserName}
                    onChange={(e) => setFormData({ ...formData, assignedToUserName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>

                <FormField label="Target Location" id="tsk-loc">
                  <input
                    id="tsk-loc"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80"
                  />
                </FormField>
              </div>

              <FormField label="Operational Description" id="tsk-desc">
                <textarea
                  id="tsk-desc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail specific instructions, required equipment, safety warnings..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500/80 resize-none"
                />
              </FormField>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  Issue Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
