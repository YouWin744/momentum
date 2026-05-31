
import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import ModalShell from './ModalShell';

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
    <ModalShell
      title={task ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      showDelete={!!task}
      saveLabel={task ? 'Update Task' : 'Save Task'}
    >
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Task Name</label>
        <input
          autoFocus={!task}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
          placeholder="What needs to be done?"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
          placeholder="Add some details..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Target Time</label>
        <input
          type="datetime-local"
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Max Life (Hrs)</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={maxHealthHrs}
            onChange={(e) => setMaxHealthHrs(parseFloat(e.target.value))}
            className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Task Type (Locked)</label>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white/70 text-slate-500 font-bold dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm">
              {type === 'short-term' ? 'timer' : 'mountain_flag'}
            </span>
            <span className="capitalize">{type.replace('-', ' ')}</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default TaskModal;
