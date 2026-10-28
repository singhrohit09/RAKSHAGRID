export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'Backlog' | 'Ready' | 'In Progress' | 'Blocked' | 'Completed';

export interface IncidentTask {
  id: string;
  title: string;
  description: string;
  relatedIncidentId?: string;
  relatedIncidentTitle?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

