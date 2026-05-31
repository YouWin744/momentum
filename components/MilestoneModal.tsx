import React, { useRef, useState, useEffect } from 'react';
import { Milestone } from '../types';
import ModalShell from './ModalShell';

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
    <ModalShell
      title={milestone ? 'Edit Milestone' : 'New Milestone'}
      onClose={onClose}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      showDelete={!!milestone}
      saveIcon="event_available"
      saveLabel={milestone ? 'Update Milestone' : 'Save Milestone'}
    >
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
          <CompactPicker label="Year" value={year} options={years} onChange={setYear} />
          <CompactPicker label="Month" value={month} options={months} onChange={setMonth} />
          <CompactPicker label="Day" value={day} options={days} onChange={setDay} />
        </div>
        <div className="mt-1.5 grid grid-cols-[1.35fr_1fr_1fr] gap-2 px-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span>Year</span>
          <span>Month</span>
          <span>Day</span>
        </div>
      </fieldset>
    </ModalShell>
  );
};

export default MilestoneModal;
