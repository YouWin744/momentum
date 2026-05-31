
import React, { useState, useEffect } from 'react';
import { Task, TaskType } from '../types';

interface TaskModalProps {
  task?: Task | null;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  defaultType: TaskType;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onSave, onDelete, onClose, defaultType }) => {
  const getLocalDatetimeString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [targetTime, setTargetTime] = useState(task?.targetTime ? getLocalDatetimeString(new Date(task.targetTime)) : getLocalDatetimeString(new Date()));
  const type = task?.type || defaultType; // Task type is now locked
  const [maxHealthHrs, setMaxHealthHrs] = useState((task?.maxHealth || 180) / 60);

  // Lock body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const maxHealth = Math.max(1, maxHealthHrs * 60);
    const data = {
      name,
      description,
      targetTime: new Date(targetTime).toISOString(),
      type,
      maxHealth,
    };

    if (task) {
      // Cap health at maxHealth when maxHealth is reduced
      const health = Math.min(task.health, maxHealth);
      onSave({ ...task, ...data, health });
    } else {
      onSave(data);
    }
  };

  const handleDelete = () => {
    if (!task || !window.confirm('Are you sure you want to delete this task?')) return;
    onDelete(task.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 glass-effect rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-transform animate-in slide-in-from-bottom-full duration-300">

        <div className="px-6 pt-6 pb-2 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5" style={{ overscrollBehavior: 'contain' }}>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Task Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/40"
              placeholder="What needs to be done?"
              autoFocus={!task}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="Add some details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Target Time</label>
              <input
                type="datetime-local"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Max Life (Hrs)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={maxHealthHrs}
                onChange={(e) => setMaxHealthHrs(parseFloat(e.target.value))}
                className="w-full h-14 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Task Type (Locked)</label>
            <div className="flex items-center gap-2 px-4 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border border-slate-200 dark:border-slate-700/50">
              <span className="material-symbols-outlined text-sm">
                {type === 'short-term' ? 'timer' : 'mountain_flag'}
              </span>
              <span className="capitalize">{type.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button
              type="submit"
              className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {task ? 'Update Task' : 'Save Task'}
            </button>

            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full h-12 text-health-red font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-health-red/10 transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
                Delete Task
              </button>
            )}
          </div>
        </form>
        <div className="h-6 sm:h-0" />
      </div>
    </div>
  );
};

export default TaskModal;
