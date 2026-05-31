import React, { useEffect } from 'react';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  onDelete?: () => void;
  showDelete?: boolean;
  saveIcon?: string;
  saveLabel: string;
  deleteIcon?: string;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  onClose,
  onSubmit,
  onDelete,
  showDelete,
  saveIcon = 'check_circle',
  saveLabel,
  deleteIcon = 'delete',
  children,
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const content = (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="mt-6 flex gap-3">
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-950/30"
            aria-label="Delete"
          >
            <span className="material-symbols-outlined">{deleteIcon}</span>
          </button>
        )}
        <button
          type="submit"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-black text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">{saveIcon}</span>
          {saveLabel}
        </button>
      </div>
    </>
  );

  const cardClass = "w-full max-w-lg rounded-t-[2.5rem] border border-white/20 bg-white/95 p-6 shadow-2xl dark:bg-slate-900/95 sm:rounded-[2.5rem]";

  if (onSubmit) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
        <form onSubmit={onSubmit} className={cardClass}>
          {content}
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className={cardClass}>
        {content}
      </div>
    </div>
  );
};

export default ModalShell;
