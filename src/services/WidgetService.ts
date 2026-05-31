import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Task } from '../../types';

const WIDGET_TASKS_KEY = 'momentum_widget_tasks';
const MAX_WIDGET_TASKS = 8;

interface WidgetTask {
  name: string;
  targetTime: string;
  type: Task['type'];
}

export async function syncWidgetTasks(tasks: Task[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const widgetTasks: WidgetTask[] = [...tasks]
    .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime())
    .slice(0, MAX_WIDGET_TASKS)
    .map(({ name, targetTime, type }) => ({ name, targetTime, type }));

  await Preferences.set({
    key: WIDGET_TASKS_KEY,
    value: JSON.stringify(widgetTasks),
  });
}
