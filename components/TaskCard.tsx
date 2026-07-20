
import React, { useState } from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onComplete?: (id: string) => void; // For short term
  onCompleteOnce?: (id: string) => void; // For long term single check
  onCompleteFinal?: (id: string) => void; // For long term double check
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

const formatTargetTime = (timeStr: string) => {
  const date = new Date(timeStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (getTaskCategory(timeStr) === 'Today') {
    return time;
  }

  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dateLabel}, ${time}`;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onComplete, onCompleteOnce, onCompleteFinal, onEdit }) => {
  const [checking, setChecking] = useState(false);

  const formatHealth = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const healthPercent = (task.health / task.maxHealth) * 100;
  const isHealthEmpty = task.health <= 0;

  const handleSingleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHealthEmpty) return;

    setChecking(true);
    if (task.type === 'long-term') {
      onCompleteOnce?.(task.id);
    } else {
      onComplete?.(task.id);
    }

    // Pulse animation duration
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="glass-card px-3.5 pb-2 pt-2 rounded-[20px] shadow-sm flex flex-col gap-0 active:scale-[0.99] transition-all hover:shadow-md cursor-pointer border-l-4 border-l-primary/40 group" onClick={() => onEdit(task)}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-grow">
          <h3 className="mt-3.5 truncate text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary dark:text-white">
            {task.name}
          </h3>
          <p className={`mt-1 truncate whitespace-nowrap text-[10px] font-bold uppercase tracking-wide ${getTaskCategory(task.targetTime) === 'Overdue' ||
              (getTaskCategory(task.targetTime) === 'Today' && new Date(task.targetTime) < new Date())
              ? 'text-health-red'
              : 'text-slate-500'
            }`}>
            Target: {formatTargetTime(task.targetTime)}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
            {task.description || "No description provided."}
          </p>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${task.status === 'positive' ? 'bg-health-green' : 'bg-health-red'} text-white`}
          >
            <span className="material-symbols-outlined text-lg font-black">
              {task.status === 'positive' ? 'circle' : 'remove'}
            </span>
          </button>

          <div className="flex gap-2">
            <button
              disabled={isHealthEmpty}
              onClick={handleSingleCheck}
              className={`w-10 h-10 rounded-full transition-all flex items-center justify-center 
                ${checking ? 'bg-health-green text-white scale-110 shadow-lg' : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300 hover:bg-primary/20 hover:text-primary'} 
                ${isHealthEmpty ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className={`material-symbols-outlined text-xl font-bold transition-all ${checking ? 'scale-125' : ''}`}>check</span>
            </button>

            {task.type === 'long-term' && (
              <button
                disabled={isHealthEmpty}
                onClick={(e) => { e.stopPropagation(); onCompleteFinal?.(task.id); }}
                className={`w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300 hover:bg-primary/40 hover:text-primary transition-colors flex items-center justify-center ${isHealthEmpty ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="Final Completion"
              >
                <span className="material-symbols-outlined text-xl font-black">done_all</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-0 flex items-center gap-3">
        <div className="flex-grow h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isHealthEmpty ? 'bg-health-red' : 'bg-health-green'}`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
        <div className="flex flex-col items-end min-w-[50px]">
          <span className={`text-[11px] font-bold text-right ${isHealthEmpty ? 'text-health-red' : 'text-slate-700 dark:text-slate-200'}`}>
            {formatHealth(task.health)}
          </span>
          <span className="text-[8px] opacity-40 uppercase font-black leading-none">Max {formatHealth(task.maxHealth)}</span>
        </div>
      </div>

      {isHealthEmpty && (
        <p className="text-[10px] text-health-red font-bold uppercase tracking-wider text-center mt-[-4px]">
          Life Depleted - Action Blocked
        </p>
      )}
    </div>
  );
};

export default TaskCard;
