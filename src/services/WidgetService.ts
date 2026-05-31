import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Task } from '../../types';

const WIDGET_TASKS_KEY = 'momentum_widget_tasks';

interface WidgetTask {
  name: string;
  targetTime: string;
  type: Task['type'];
  health: number;
  maxHealth: number;
  status: Task['status'];
  lastSyncTime: number;
  createdAt: number;
}

export async function syncWidgetTasks(tasks: Task[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const now = Date.now();
  const widgetTasks: WidgetTask[] = [...tasks]
    .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime())
    .map(({ name, targetTime, type, health, maxHealth, status, lastSyncTime, createdAt }) => ({
      name,
      targetTime,
      type,
      health,
      maxHealth,
      status,
      lastSyncTime: lastSyncTime || now,
      createdAt,
    }));

  await Preferences.set({
    key: WIDGET_TASKS_KEY,
    value: JSON.stringify(widgetTasks),
  });
}
