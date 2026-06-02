import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CompletedTask, GroupedCompletedTasks } from '../types';

interface CompletedPageProps {
  completedTasks: GroupedCompletedTasks;
  onRestore: (id: string) => void;
  onDeletePermanent: (id: string) => void;
}

const CompletedPage: React.FC<CompletedPageProps> = ({ completedTasks, onRestore, onDeletePermanent }) => {
  const [selectedTask, setSelectedTask] = useState<CompletedTask | null>(null);

  const categories = ['future', 'tomorrow', 'today', 'expired'];
  const categoryLabels: Record<string, string> = {
    'expired': 'Overdue',
    'today': 'Today',
    'tomorrow': 'Tomorrow',
    'future': 'Later'
  };

  const sortByTargetTimeDescending = (tasks: CompletedTask[]) => [...tasks].sort((a, b) => (
    new Date(b.targetTime).getTime() - new Date(a.targetTime).getTime()
    || b.completedAt - a.completedAt
  ));
  const groupedTasks = useMemo<GroupedCompletedTasks>(() => ({
    expired: sortByTargetTimeDescending(completedTasks.expired),
    today: sortByTargetTimeDescending(completedTasks.today),
    tomorrow: sortByTargetTimeDescending(completedTasks.tomorrow),
    future: sortByTargetTimeDescending(completedTasks.future),
  }), [completedTasks]);

  const handleDeletePermanent = (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this completed task?')) return;
    onDeletePermanent(id);
    setSelectedTask(null);
  };

  const formatHealth = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatFullDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Completed Tasks</h1>
        <p className="text-sm font-semibold text-white/80 drop-shadow-sm">Celebrate your discipline</p>
      </header>

      {Object.values(groupedTasks).every((g: CompletedTask[]) => !g || g.length === 0) ? (
        <div className="glass-card p-10 rounded-[2rem] text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">check_circle</span>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No completed tasks yet.<br />Every step counts!</p>
        </div>
      ) : (
        categories.map((cat) => groupedTasks[cat] && groupedTasks[cat].length > 0 && (
          <section key={cat} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest px-1 flex items-center gap-3 text-white">
              {categoryLabels[cat]}
              <div className="h-px flex-1 bg-white/20"></div>
            </h2>
            <div className="space-y-3">
              {groupedTasks[cat].map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="glass-card p-4 rounded-[24px] shadow-sm flex items-center justify-between gap-4 border-l-4 border-l-slate-400/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex-grow">
                    <h3 className={`font-bold text-slate-900 dark:text-white text-lg leading-tight line-through opacity-60`}>
                      {task.name}
                    </h3>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Scheduled: {formatFullDateTime(task.targetTime)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {task.isHistoryRecord ? 'Logged' : 'Completed'} {formatFullDateTime(new Date(task.completedAt).toISOString())}
                        </p>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">
                          {task.type === 'short-term' ? 'Short' : 'Long'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${task.statusAtCompletion === 'positive' ? 'bg-health-green' : 'bg-health-red'} text-white`}>
                      <span className="material-symbols-outlined text-lg font-black">
                        {task.statusAtCompletion === 'positive' ? 'circle' : 'remove'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {selectedTask && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedTask(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Task Details</h2>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
                    {selectedTask.isHistoryRecord ? 'History Log Record' : 'Final Completion Record'}
                  </p>
                </div>
                <button onClick={() => setSelectedTask(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Task Name</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedTask.name}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Scheduled Target Time</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatFullDateTime(selectedTask.targetTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Task Type</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        {selectedTask.type === 'short-term' ? 'timer' : 'mountain_flag'}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{selectedTask.type.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status At Done</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedTask.statusAtCompletion === 'positive' ? 'bg-health-green' : 'bg-health-red'}`} />
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{selectedTask.statusAtCompletion}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Description</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedTask.description || 'No description'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Completed At</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatFullDateTime(new Date(selectedTask.completedAt).toISOString())}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Max Life Potential</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatHealth(selectedTask.maxHealth)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                {!selectedTask.isHistoryRecord && (
                  <button
                    onClick={() => { onRestore(selectedTask.id); setSelectedTask(null); }}
                    className="w-full h-14 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">restart_alt</span>
                    Restore Task
                  </button>
                )}
                <button
                  onClick={() => handleDeletePermanent(selectedTask.id)}
                  className="w-full h-12 text-health-red font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-health-red/10 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">delete_forever</span>
                  Permanent Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CompletedPage;
