
export type TaskStatus = 'positive' | 'negative';
export type TaskType = 'short-term' | 'long-term';

export interface Task {
  id: string;
  name: string;
  description: string;
  targetTime: string; // ISO string
  status: TaskStatus;
  health: number; // in minutes
  maxHealth: number; // in minutes, defaults to 180
  type: TaskType;
  createdAt: number;
  lastSyncTime?: number;
}

export interface CompletedTask extends Task {
  completedAt: number;
  statusAtCompletion: TaskStatus;
  isHistoryRecord: boolean; // True if it's a "single check" from a long-term task
}


export type ViewType = 'short' | 'long' | 'milestones' | 'completed';

export interface GroupedCompletedTasks {
  expired: CompletedTask[];
  today: CompletedTask[];
  tomorrow: CompletedTask[];
  future: CompletedTask[];
}
