import { Milestone } from '../../types';
import { db } from '../db';

interface NextOccurrence {
    date: Date;
    anniversary: number;
}

const parseDate = (date: string): [number, number, number] => {
    const [year, month, day] = date.split('-').map(Number);
    return [year, month, day];
};

const createValidDate = (year: number, month: number, day: number): Date | null => {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
        ? date
        : null;
};

export const getNextOccurrence = (date: string, now = new Date()): NextOccurrence => {
    const [originalYear, month, day] = parseDate(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let year = Math.max(originalYear, today.getFullYear());

    while (true) {
        const candidate = createValidDate(year, month, day);
        if (candidate && candidate >= today) {
            return {
                date: candidate,
                anniversary: year - originalYear
            };
        }
        year += 1;
    }
};

const sortByNextOccurrence = (a: Milestone, b: Milestone): number => {
    return getNextOccurrence(a.date).date.getTime() - getNextOccurrence(b.date).date.getTime()
        || a.date.localeCompare(b.date)
        || a.createdAt - b.createdAt;
};

export const MilestoneService = {
    getAllMilestones: async (): Promise<Milestone[]> => {
        const milestones = await db.milestones.toArray();
        return milestones.sort(sortByNextOccurrence);
    },

    createMilestone: async (milestone: Milestone): Promise<void> => {
        await db.milestones.add(milestone);
    },

    updateMilestone: async (milestone: Milestone): Promise<void> => {
        await db.milestones.put(milestone);
    },

    deleteMilestone: async (id: string): Promise<void> => {
        await db.milestones.delete(id);
    }
};
