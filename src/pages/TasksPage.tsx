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

  const columns: { id: TaskStatus; label: string; borderAccent: string }[] = [
    { id: 'triage', label: 'Triage & Staging', borderAccent: 'border-t-[#315C46]' },
    { id: 'en_route', label: 'En Route / Transit', borderAccent: 'border-t-[#C18A32]' },
    { id: 'on_scene', label: 'On Scene Action', borderAccent: 'border-t-[#B9433D]' },
    { id: 'resolved', label: 'Completed', borderAccent: 'border-t-[#315C46]' },
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
        return 'text-[#B9433D] bg-[#F9EBEA] border-[#E8C2BF]';
      case 'high':
        return 'text-[#C18A32] bg-[#FAF2E6] border-[#EED7B8]';
      case 'medium':
        return 'text-[#315C46] bg-[#E5EDE6] border-[#C8DACB]';
      case 'low':
      default:
        return 'text-[#575D56] bg-[#EBEBE6] border-[#DCDCD5]';
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
        kicker="Incident Action Plan (IAP)"
        description="Operational task allocation, responder milestone tracking, and priority triage for rapid on-ground intervention."
        metadata={
          <div className="flex items-center gap-2 text-xs text-[#777D77]">
            <span>Total Tasks: <strong className="text-[#171B19]">{tasks.length}</strong></span>
            <span>·</span>
            <span className="text-[#C18A32] font-semibold">
              Pending: {tasks.filter((t) => t.status !== 'resolved').length}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-[#E4E3DC] rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  viewMode === 'board' ? 'bg-[#E5EDE6] text-[#315C46] font-semibold' : 'text-[#777D77] hover:text-[#171B19]'
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-[#E5EDE6] text-[#315C46] font-semibold' : 'text-[#777D77] hover:text-[#171B19]'
                }`}
              >
                List
              </button>
            </div>

            {permissions.canAssignTasks && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#315C46] hover:bg-[#264937] text-white font-semibold text-xs transition-colors shadow-xs"
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
                className={`bg-white border border-[#E4E3DC] rounded-xl p-4 flex flex-col border-t-4 shadow-xs ${col.borderAccent}`}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E4E3DC] mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#171B19]">
                    {col.label}
                  </h3>
                  <span className="text-xs font-mono bg-[#FAF9F5] px-2 py-0.5 rounded-full text-[#777D77] border border-[#E4E3DC] tabular-nums">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#999F99]">
                      No tasks in this stage
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const nextSt = advanceStatus(task.status);
                      return (
                        <div
                          key={task.id}
                          className="p-3.5 bg-[#FAF9F5] border border-[#E4E3DC] rounded-lg hover:border-[#D0CFC5] transition-colors space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-[#315C46] font-bold">
                              {task.id}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded-md border ${getPriorityStyle(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-semibold text-[#171B19] text-xs leading-snug">
                            {task.title}
                          </h4>

                          <p className="text-[11px] text-[#777D77] line-clamp-2">
                            {task.description}
                          </p>

                          <div className="pt-2 border-t border-[#E4E3DC] text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-[#777D77]">
                              <span>Assigned:</span>
                              <span className="text-[#171B19] truncate max-w-[130px] font-medium">
                                {task.assignedToUserName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[#777D77]">
                              <span>Due:</span>
                              <span className="tabular-nums font-mono">
                                {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {nextSt && (
                            <button
                              type="button"
                              onClick={() => onUpdateTaskStatus(task.id, nextSt)}
                              className="w-full mt-2 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-[#F5F4EF] text-[#315C46] border border-[#E4E3DC] transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <span>Advance to {nextSt.replace(/_/g, ' ')}</span>
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
        <div className="border border-[#E4E3DC] rounded-xl bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E4E3DC] text-[#777D77] uppercase text-[11px] font-semibold">
                <th className="py-3 px-3.5">ID</th>
                <th className="py-3 px-3.5">Task Title</th>
                <th className="py-3 px-3.5">Priority</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Assigned Responder</th>
                <th className="py-3 px-3.5">Target Incident</th>
                <th className="py-3 px-3.5 text-right">Due Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DC]">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-3 px-3.5 font-bold font-mono text-[#315C46]">{task.id}</td>
                  <td className="py-3 px-3.5 font-medium text-[#171B19] max-w-[250px]">
                    {task.title}
                  </td>
                  <td className="py-3 px-3.5 uppercase">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getPriorityStyle(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 uppercase text-[#171B19]">
                    {task.status.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3.5 text-[#171B19]">{task.assignedToUserName}</td>
                  <td className="py-3 px-3.5 text-[#777D77] max-w-[180px] truncate">
                    {task.incidentTitle}
                  </td>
                  <td className="py-3 px-3.5 text-right text-[#777D77] font-mono tabular-nums">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white border border-[#E4E3DC] rounded-xl shadow-2xl overflow-hidden p-5 text-[#171B19]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DC] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171B19]">
                Issue Field Action Task
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[#777D77] hover:text-[#171B19]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <FormField label="Task Objective Title" required id="tsk-title">
                <input
                  id="tsk-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Evacuate stranded citizens from Ward 4"
                  className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Priority Level" id="tsk-priority">
                  <select
                    id="tsk-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] uppercase"
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
                    className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
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
                    className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
                  />
                </FormField>

                <FormField label="Target Location" id="tsk-loc">
                  <input
                    id="tsk-loc"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
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
                  className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46] resize-none"
                />
              </FormField>

              <div className="pt-3 border-t border-[#E4E3DC] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#777D77] hover:text-[#171B19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors shadow-xs"
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
