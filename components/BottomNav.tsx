
import React from 'react';
import { ViewType } from '../types';

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[88px] ios-blur-nav border-t border-slate-200/50 dark:border-white/5 px-4 pb-[env(safe-area-inset-bottom,20px)] flex items-center justify-around z-40 overscroll-none">
      <button
        onClick={() => onViewChange('short')}
        className={`flex flex-col items-center justify-center h-full w-full gap-1 transition-colors ${activeView === 'short' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <span className={`material-symbols-outlined text-[26px] ${activeView === 'short' ? 'fill-1' : ''}`}>timer</span>
        <span className="text-[11px] font-bold">Short-term</span>
      </button>

      <button 
        onClick={() => onViewChange('long')}
        className={`flex flex-col items-center justify-center h-full w-full gap-1 transition-colors ${activeView === 'long' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <span className={`material-symbols-outlined text-[26px] ${activeView === 'long' ? 'fill-1' : ''}`}>mountain_flag</span>
        <span className="text-[11px] font-bold">Long-term</span>
      </button>

      <button
        onClick={() => onViewChange('completed')}
        className={`flex flex-col items-center justify-center h-full w-full gap-1 transition-colors ${activeView === 'completed' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <span className={`material-symbols-outlined text-[26px] ${activeView === 'completed' ? 'fill-1' : ''}`}>check_circle</span>
        <span className="text-[11px] font-bold">Completed</span>
      </button>

      <button
        onClick={() => onViewChange('milestones')}
        className={`flex flex-col items-center justify-center h-full w-full gap-1 transition-colors ${activeView === 'milestones' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <span className={`material-symbols-outlined text-[26px] ${activeView === 'milestones' ? 'fill-1' : ''}`}>event</span>
        <span className="text-[11px] font-bold">Milestones</span>
      </button>
      
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-900/10 dark:bg-white/10 rounded-full z-50"></div>
    </nav>
  );
};

export default BottomNav;
