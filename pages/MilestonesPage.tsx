import React, { useEffect, useState } from 'react';
import MilestoneModal, { MilestoneFormData } from '../components/MilestoneModal';
import { Milestone } from '../types';
import { getNextOccurrence, MilestoneService } from '../src/services/MilestoneService';

const MilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMilestones = async () => {
    setMilestones(await MilestoneService.getAllMilestones());
  };

  useEffect(() => {
    void loadMilestones();
  }, []);

  const openNewMilestone = () => {
    setSelectedMilestone(null);
    setIsModalOpen(true);
  };

  const openMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedMilestone(null);
    setIsModalOpen(false);
  };

  const handleSave = async (data: MilestoneFormData | Milestone) => {
    if ('id' in data) {
      await MilestoneService.updateMilestone(data);
    } else {
      await MilestoneService.createMilestone({
        ...data,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: Date.now()
      });
    }
    await loadMilestones();
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await MilestoneService.deleteMilestone(id);
    await loadMilestones();
    closeModal();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatAnniversary = (anniversary: number) => {
    const lastTwoDigits = anniversary % 100;
    const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 13
      ? 'th'
      : anniversary % 10 === 1
        ? 'st'
        : anniversary % 10 === 2
          ? 'nd'
          : anniversary % 10 === 3
            ? 'rd'
            : 'th';
    return `${anniversary}${suffix} anniversary`;
  };

  return (
    <div className="animate-in space-y-4 fade-in duration-500">
      <header className="mb-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Milestones</h1>
        <p className="text-sm font-semibold text-white/80 drop-shadow-sm">Keep the dates that matter close</p>
      </header>

      {milestones.length === 0 ? (
        <div className="glass-card rounded-[2rem] p-10 text-center">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">No milestones yet</h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Add an important date to keep it within reach.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const nextOccurrence = getNextOccurrence(milestone.date);
            const month = nextOccurrence.date.toLocaleString('en-US', { month: 'short' });
            const day = nextOccurrence.date.getDate();
            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => openMilestone(milestone)}
                className="glass-card flex w-full items-center gap-4 rounded-[1.75rem] border-l-4 border-l-primary/50 p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
              >
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <span className="text-xs font-black uppercase">{month}</span>
                  <span className="text-2xl font-black leading-none">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-black text-slate-900 dark:text-white">{milestone.name}</h2>
                  {milestone.description && (
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {milestone.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-black tracking-wide text-primary/80">
                    {formatDate(nextOccurrence.date)} · {formatAnniversary(nextOccurrence.anniversary)}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={openNewMilestone}
        className="fixed bottom-28 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 transition-transform active:scale-95"
        aria-label="Add milestone"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {isModalOpen && (
        <MilestoneModal
          milestone={selectedMilestone}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default MilestonesPage;
