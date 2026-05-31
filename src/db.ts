import Dexie, { Table } from 'dexie';
import { Task, CompletedTask } from '../types';

// Extend Task/CompletedTask slightly for DB if needed, but standard types work nicely
// We might not need string IDs anymore if we use auto-increment keys, but existing frontend uses string IDs.
// Let's stick to string IDs for now to keep frontend compatible, or allow both.
// Dexie supports string primary keys if specified.

export class MomentumDatabase extends Dexie {
    tasks!: Table<Task, string>;
    completedTasks!: Table<CompletedTask, string>;

    constructor() {
        super('momentumDB');
        this.version(2).stores({
            tasks: 'id, type, status', // Indexes
            completedTasks: 'id, targetTime, isHistoryRecord, completedAt'
        });
    }
}

export const db = new MomentumDatabase();
