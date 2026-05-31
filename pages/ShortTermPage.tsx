
import React from 'react';
import { Task } from '../types';
import TaskCard from '../components/TaskCard';

interface ShortTermPageProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const getTaskCategory = (targetTime: string) => {
  const target = new Date(targetTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  if (target < today) return 'Overdue';
  if (target < tomorrow) return 'Today';
  if (target < dayAfterTomorrow) return 'Tomorrow';
  return 'Later';
};

const ShortTermPage: React.FC<ShortTermPageProps> = ({ tasks, onToggleStatus, onComplete, onEdit }) => {
  const categories = ['Overdue', 'Today', 'Tomorrow', 'Later'];
  const grouped = [...tasks]
    .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime())
    .reduce((acc, task) => {
      const cat = getTaskCategory(task.targetTime);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="mb-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Short-term Tasks</h1>
        <p className="text-sm font-semibold text-white/80 drop-shadow-sm">Manage your daily priorities</p>
      </header>

      {tasks.length === 0 ? (
        <div className="glass-card p-10 rounded-[2rem] text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">energy_savings_leaf</span>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No short-term tasks yet.<br />Start small, win big.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map(cat => grouped[cat] && grouped[cat].length > 0 && (
            <div key={cat} className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-widest px-1 flex items-center gap-3 text-white">
                {cat}
                <div className="h-px flex-1 bg-white/20"></div>
              </h2>
              <div className="space-y-2.5">
                {grouped[cat].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onComplete={onComplete}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShortTermPage;
