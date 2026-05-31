// src/api.ts
// Adapter Pattern: Maps previous API calls to offline TaskService
import { Task, CompletedTask } from './types';
import { TaskService } from './src/services/TaskService';

export const api = {
    fetchTasks: async (): Promise<Task[]> => {
        return TaskService.getAllTasks();
    },

    createTask: async (task: Task): Promise<void> => {
        return TaskService.createTask(task);
    },

    updateTask: async (task: Task): Promise<void> => {
        return TaskService.updateTask(task);
    },

    deleteTask: async (id: string): Promise<void> => {
        return TaskService.deleteTask(id);
    },

    fetchCompletedTasks: async () => {
        return TaskService.getCompletedTasks();
    },

    createCompletedTask: async (task: CompletedTask): Promise<void> => {
        return TaskService.createCompletedTask(task);
    },

    deleteCompletedTask: async (id: string): Promise<void> => {
        return TaskService.deleteCompletedTask(id);
    }
};
