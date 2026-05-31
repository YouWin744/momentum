import React, { useEffect, useRef, useState } from 'react';
import { Milestone } from '../types';

export interface MilestoneFormData {
  name: string;
  description: string;
  date: string;
}

interface MilestoneModalProps {
  milestone?: Milestone | null;
  onSave: (data: MilestoneFormData | Milestone) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onClose: () => void;
}

const getLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

interface CompactPickerProps {
  label: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
}

const CompactPicker: React.FC<CompactPickerProps> = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const selectedOption = list?.querySelector<HTMLElement>(`[data-picker-value="${value}"]`);
    if (!isOpen || !list || !selectedOption) {
      return;
    }
    list.scrollTop = selectedOption.offsetTop - (list.clientHeight - selectedOption.clientHeight) / 2;
  }, [isOpen, value]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-2xl border border-slate-200 bg-white/70 px-3 py-3 text-left text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
        aria-label={label}
      >
        {value}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-10"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-[15rem] overflow-hidden rounded-3xl bg-white p-2 shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
              Select {label}
            </p>
            <div ref={listRef} className="max-h-[44vh] space-y-1 overflow-y-auto overscroll-contain">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  data-picker-value={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-base font-bold transition-colors ${
                    option === value
                      ? 'bg-primary text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MilestoneModal: React.FC<MilestoneModalProps> = ({ milestone, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(milestone?.name ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const initialDate = milestone?.date ?? getLocalDate();
  const [year, setYear] = useState(Number(initialDate.slice(0, 4)));
  const [month, setMonth] = useState(Number(initialDate.slice(5, 7)));
  const [day, setDay] = useState(Number(initialDate.slice(8, 10)));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 101 - 1900 }, (_, index) => currentYear + 100 - index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const days = Array.from({ length: getDaysInMonth(year, month) }, (_, index) => index + 1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const lastDay = getDaysInMonth(year, month);
    if (day > lastDay) {
      setDay(lastDay);
    }
  }, [day, month, year]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const formData = { name: name.trim(), description: description.trim(), date };
    await onSave(milestone ? { ...milestone, ...formData } : formData);
  };

  const handleDelete = async () => {
    if (!milestone || !window.confirm('Are you sure you want to delete this milestone?')) {
      return;
    }
    await onDelete(milestone.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-t-[2.5rem] border border-white/20 bg-white/95 p-6 shadow-2xl dark:bg-slate-900/95 sm:rounded-[2.5rem]"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Important Date</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
              {milestone ? 'Edit Milestone' : 'New Milestone'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Milestone Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="What would you like to remember?"
              className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a note about this date"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/70 dark:text-white"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Original Date</legend>
            <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-2">
              <CompactPicker
                label="Year"
                value={year}
                options={years}
                onChange={setYear}
              />
              <CompactPicker
                label="Month"
                value={month}
                options={months}
                onChange={setMonth}
              />
              <CompactPicker
                label="Day"
                value={day}
                options={days}
                onChange={setDay}
              />
            </div>
            <div className="mt-1.5 grid grid-cols-[1.35fr_1fr_1fr] gap-2 px-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Year</span>
              <span>Month</span>
              <span>Day</span>
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex gap-3">
          {milestone && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-950/30"
              aria-label="Delete milestone"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <button
            type="submit"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-black text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">event_available</span>
            {milestone ? 'Update Milestone' : 'Save Milestone'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MilestoneModal;
