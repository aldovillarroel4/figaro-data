import React from 'react';
import { MONTHS } from '../utils';

interface MonthTabsProps {
  currentMonth: string;
  onMonthSelect: (month: string) => void;
}

export const MonthTabs: React.FC<MonthTabsProps> = ({
  currentMonth,
  onMonthSelect,
}) => {
  return (
    <div className="bg-slate-200/50 p-1.5 rounded-xl flex gap-1 border border-slate-300/50 shadow-inner w-full overflow-x-auto select-none mb-8 scrollbar-none">
      {MONTHS.map((month) => {
        const isActive = currentMonth === month;
        return (
          <button
            key={month}
            onClick={() => onMonthSelect(month)}
            className={`flex-1 shrink-0 min-w-[75px] whitespace-nowrap flex items-center justify-center text-center px-2 py-1.5 text-xs rounded-lg transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-white text-slate-800 font-bold shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/30 font-medium'
            }`}
          >
            {month}
          </button>
        );
      })}
    </div>
  );
};
