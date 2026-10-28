import React, { useState, useMemo } from 'react';
import { useRaksha } from '../context/RakshaContext';
import { IncidentTask, TaskPriority, TaskStatus } from '../types/task';
import { 
  KanbanSquare, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Users,
  Flame
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { hasPermission, getPermissionRestrictionMessage } from '../utils/permissions';
import { formatRelativeTime } from '../utils/formatters';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'Backlog', title: 'Backlog', color: 'border-primary-dim/30' },
  { id: 'Ready', title: 'Ready to Dispatch', color: 'border-operational-cyan/40' },
  { id: 'In Progress', title: 'In Progress', color: 'border-hazard/40' },
  { id: 'Blocked', title: 'Blocked / Needs Assistance', color: 'border-emergency/40' },
  { id: 'Completed', title: 'Completed', color: 'border-safe/40' }
];

export const TaskBoardPage: React.FC = () => {
  const { 
    tasks, 
    incidents, 
    teams, 
    activePersonaId, 
    addTask, 
    updateTask, 
    moveTaskStatus, 
    deleteTask 
  } = useRaksha();

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<IncidentTask | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    relatedIncidentId: '',
    assignedTeamId: '',
    priority: 'High' as TaskPriority,
    status: 'Ready' as TaskStatus,
    dueDate: new Date(Date.now() + 3600000 * 6).toISOString().slice(0, 16)
  });

  const canManage = hasPermission(activePersonaId, 'manage_tasks');
  const canAssign = hasPermission(activePersonaId, 'assign_tasks');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());

      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchTeam = filterTeam === 'all' || t.assignedTeamId === filterTeam;

      return matchSearch && matchPriority && matchTeam;
    });
  }, [tasks, search, filterPriority, filterTeam]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      relatedIncidentId: incidents[0]?.id || '',
      assignedTeamId: teams[0]?.id || '',
      priority: 'High',
      status: 'Ready',
      dueDate: new Date(Date.now() + 3600000 * 6).toISOString().slice(0, 16)
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (t: IncidentTask) => {
    setEditingTask(t);
    setFormData({
      title: t.title,
      description: t.description,
      relatedIncidentId: t.relatedIncidentId || '',
      assignedTeamId: t.assignedTeamId || '',
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.slice(0, 16) : ''
    });
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const relInc = incidents.find(i => i.id === formData.relatedIncidentId);
    const assignedT = teams.find(t => t.id === formData.assignedTeamId);

    addTask({
      title: formData.title.trim(),
      description: formData.description.trim(),
      relatedIncidentId: formData.relatedIncidentId || undefined,
      relatedIncidentTitle: relInc ? relInc.title : undefined,
      assignedTeamId: formData.assignedTeamId || undefined,
      assignedTeamName: assignedT ? assignedT.name : undefined,
      priority: formData.priority,
      status: formData.status,
      dueDate: new Date(formData.dueDate).toISOString()
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !formData.title.trim()) return;

    const relInc = incidents.find(i => i.id === formData.relatedIncidentId);
    const assignedT = teams.find(t => t.id === formData.assignedTeamId);

    updateTask(editingTask.id, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      relatedIncidentId: formData.relatedIncidentId || undefined,
      relatedIncidentTitle: relInc ? relInc.title : undefined,
      assignedTeamId: formData.assignedTeamId || undefined,
      assignedTeamName: assignedT ? assignedT.name : undefined,
      priority: formData.priority,
      status: formData.status,
      dueDate: new Date(formData.dueDate).toISOString()
    });

    setEditingTask(null);
  };

  const priorityBadges: Record<TaskPriority, string> = {
    Urgent: 'bg-emergency/20 text-emergency border border-emergency/40 font-bold',
    High: 'bg-hazard/20 text-hazard border border-hazard/40',
    Medium: 'bg-operational-cyan/20 text-operational-cyan border border-operational-cyan/40',
    Low: 'bg-panel-subtle text-primary-muted border border-border'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-operational-cyan" />
            <h1 className="text-xl font-extrabold text-primary tracking-wide">
              RESPONSE TASK & ACTION BOARD
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-panel-subtle border border-border text-primary-muted">
              {tasks.length} COORDINATION TASKS
            </span>
          </div>
          <p className="text-xs text-primary-muted mt-0.5">
            Dispatch, track progress, and coordinate field actions linked to registered incidents.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
          restricted={!canAssign}
          restrictedReason={getPermissionRestrictionMessage(activePersonaId, 'assign_tasks')}
        >
          Dispatch Task
        </Button>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-panel border border-border rounded-lg text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dim" />
          <input
            type="text"
            placeholder="Search task title, description, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-border rounded pl-8 pr-3 py-1.5 text-xs text-primary placeholder:text-primary-dim focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full bg-charcoal border border-border rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none"
          >
            <option value="all">All Assigned Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-panel border-t-2 ${col.color} border-x border-b border-border rounded-lg p-3 flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/60">
                <span className="text-xs font-bold text-primary tracking-wide">
                  {col.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-charcoal border border-border text-primary-dim font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-primary-dim italic">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue = task.status !== 'Completed' && new Date(task.dueDate).getTime() < Date.now();
                    const currentIdx = COLUMNS.findIndex(c => c.id === task.status);

                    return (
                      <div
                        key={task.id}
                        className="bg-charcoal border border-border rounded p-3 text-xs flex flex-col justify-between hover:border-border-subtle transition-all space-y-2 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-primary-dim">{task.id}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${priorityBadges[task.priority]}`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="font-bold text-primary leading-snug">{task.title}</h4>
                          <p className="text-[11px] text-primary-muted line-clamp-2 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Meta Tags */}
                        <div className="space-y-1 pt-2 border-t border-border/50 text-[10px] font-mono">
                          {task.relatedIncidentTitle && (
                            <div className="flex items-center gap-1.5 text-primary-dim truncate" title={task.relatedIncidentTitle}>
                              <Flame className="w-3 h-3 text-emergency shrink-0" />
                              <span className="truncate">{task.relatedIncidentTitle}</span>
                            </div>
                          )}

                          {task.assignedTeamName && (
                            <div className="flex items-center gap-1.5 text-operational-cyan truncate">
                              <Users className="w-3 h-3 shrink-0" />
                              <span className="truncate">{task.assignedTeamName}</span>
                            </div>
                          )}

                          <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-emergency font-bold' : 'text-primary-dim'}`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Due: {formatRelativeTime(task.dueDate)}</span>
                            {isOverdue && <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-emergency/15">OVERDUE</span>}
                          </div>
                        </div>

                        {/* Status Transition Navigation & Actions (Keyboard Accessible) */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          {/* Move Left */}
                          <button
                            onClick={() => {
                              if (currentIdx > 0) moveTaskStatus(task.id, COLUMNS[currentIdx - 1].id);
                            }}
                            disabled={!canManage || currentIdx === 0}
                            className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle disabled:opacity-20 disabled:cursor-not-allowed"
                            title={currentIdx > 0 ? `Move to ${COLUMNS[currentIdx - 1].title}` : 'Cannot move left'}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit & Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(task)}
                              disabled={!canManage}
                              className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle disabled:opacity-20"
                              title="Edit task"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingId(task.id)}
                              disabled={!canManage}
                              className="p-1 rounded text-primary-muted hover:text-emergency hover:bg-emergency/10 disabled:opacity-20"
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Move Right */}
                          <button
                            onClick={() => {
                              if (currentIdx < COLUMNS.length - 1) moveTaskStatus(task.id, COLUMNS[currentIdx + 1].id);
                            }}
                            disabled={!canManage || currentIdx === COLUMNS.length - 1}
                            className="p-1 rounded text-primary-muted hover:text-primary hover:bg-panel-subtle disabled:opacity-20 disabled:cursor-not-allowed"
                            title={currentIdx < COLUMNS.length - 1 ? `Move to ${COLUMNS[currentIdx + 1].title}` : 'Task completed'}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Dispatch Response Task"
        subtitle="Assign tactical mission orders to designated field units."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Deploy inflatable sandbags along breach crest km 14.8"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Linked Incident</label>
              <select
                value={formData.relatedIncidentId}
                onChange={(e) => setFormData({ ...formData, relatedIncidentId: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="">None</option>
                {incidents.map(i => (
                  <option key={i.id} value={i.id}>{i.id}: {i.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Assigned Response Team</label>
              <select
                value={formData.assignedTeamId}
                onChange={(e) => setFormData({ ...formData, assignedTeamId: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="">Unassigned</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Backlog">Backlog</option>
                <option value="Ready">Ready</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Due Date & Time</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-charcoal border border-border rounded px-2.5 py-2 font-mono text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Mission Description</label>
            <textarea
              rows={3}
              placeholder="Action specifics, safety rules, resource requisitions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Dispatch Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title={`Edit Task: ${editingTask?.id}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-primary block mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-primary block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Backlog">Backlog</option>
                <option value="Ready">Ready</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-primary block mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Assigned Team</label>
            <select
              value={formData.assignedTeamId}
              onChange={(e) => setFormData({ ...formData, assignedTeamId: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            >
              <option value="">Unassigned</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-primary block mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-charcoal border border-border rounded px-3 py-2 text-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" type="button" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Update Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteTask(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Response Task?"
        message="This task will be removed from the coordination board."
        confirmLabel="Delete Task"
        variant="danger"
      />
    </div>
  );
};
