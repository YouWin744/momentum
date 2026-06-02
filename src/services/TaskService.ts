import { db } from '../db';
import { Task, CompletedTask, GroupedCompletedTasks } from '../../types';

// Business logic functions extracted for better internal referencing
const calculateHealth = (task: Task): { newHealth: number, lastSyncTime: number } => {
    const now = Date.now();
    const lastSync = task.lastSyncTime || task.createdAt;
    const diffMinutes = Math.floor((now - lastSync) / 60000);

    if (diffMinutes <= 0) return { newHealth: task.health, lastSyncTime: lastSync };

    let newHealth = task.health;
    if (task.status === 'positive') {
        newHealth = Math.min(task.maxHealth, task.health + diffMinutes);
    } else {
        newHealth = Math.max(0, task.health - (diffMinutes * 2));
    }

    // Safety cap: health should never exceed maxHealth
    newHealth = Math.min(newHealth, task.maxHealth);

    return { newHealth, lastSyncTime: now };
};

export const TaskService = {
    calculateHealth,

    getAllTasks: async (): Promise<Task[]> => {
        try {
            const tasks = await db.tasks.toArray();
            const updatedTasks: Task[] = [];
            const now = Date.now();

            for (const task of tasks) {
                const { newHealth, lastSyncTime } = calculateHealth(task);

                if (newHealth !== task.health || (now - (task.lastSyncTime || 0) > 60000)) {
                    const updated = { ...task, health: newHealth, lastSyncTime };
                    await db.tasks.update(task.id, updated);
                    updatedTasks.push(updated);
                } else {
                    updatedTasks.push(task);
                }
            }
            return updatedTasks;
        } catch (error) {
            console.error('Dexie: Failed to fetch tasks', error);
            throw error;
        }
    },

    createTask: async (task: Task): Promise<void> => {
        try {
            const taskWithSync = { ...task, lastSyncTime: Date.now() };
            await db.tasks.add(taskWithSync);
        } catch (error) {
            console.error('Dexie: Failed to create task', error);
            throw error;
        }
    },

    updateTask: async (task: Task): Promise<void> => {
        try {
            const taskToSave = { ...task, lastSyncTime: Date.now() };
            await db.tasks.put(taskToSave);
        } catch (error) {
            console.error('Dexie: Failed to update task', error);
            throw error;
        }
    },

    deleteTask: async (id: string): Promise<void> => {
        try {
            await db.tasks.delete(id);
        } catch (error) {
            console.error('Dexie: Failed to delete task', error);
            throw error;
        }
    },

    getCompletedTasks: async (): Promise<GroupedCompletedTasks> => {
        try {
            const tasks = await db.completedTasks.orderBy('targetTime').reverse().toArray();

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const tomorrowStart = todayStart + 86400000;
            const tomorrowEnd = tomorrowStart + 86400000;

            const groups: GroupedCompletedTasks = {
                expired: [],
                today: [],
                tomorrow: [],
                future: []
            };

            tasks.forEach(t => {
                const targetDate = new Date(t.targetTime).getTime();
                if (targetDate < todayStart) {
                    groups.expired.push(t);
                } else if (targetDate < tomorrowStart) {
                    groups.today.push(t);
                } else if (targetDate < tomorrowEnd) {
                    groups.tomorrow.push(t);
                } else {
                    groups.future.push(t);
                }
            });

            return groups;
        } catch (error) {
            console.error('Dexie: Failed to fetch completed tasks', error);
            throw error;
        }
    },

    createCompletedTask: async (task: CompletedTask): Promise<void> => {
        try {
            await db.completedTasks.add(task);
        } catch (error) {
            console.error('Dexie: Failed to save completed task', error);
            throw error;
        }
    },

    deleteCompletedTask: async (id: string): Promise<void> => {
        try {
            await db.completedTasks.delete(id);
        } catch (error) {
            console.error('Dexie: Failed to delete completed task', error);
            throw error;
        }
    }
};
