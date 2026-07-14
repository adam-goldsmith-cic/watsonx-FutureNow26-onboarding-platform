export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface UserProfile {
  id: string;
  name: string;
  role: 'new_starter' | 'manager' | 'hr_admin' | 'it_support' | 'super_admin';
  startDate: string; // ISO date string YYYY-MM-DD
}

export interface TaskState {
  userId: string;
  taskId: string;
  status: TaskStatus;
  dueDate: string; // ISO date YYYY-MM-DD
  completedAt: string | null;
  notes: string | null;
}

export interface OrgPluginConfig {
  pluginId: string;
  enabled: boolean;
  order: number;
  config: unknown;
}

export type OrgConfigResponse = OrgPluginConfig[];
