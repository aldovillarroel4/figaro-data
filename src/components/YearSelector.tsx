import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  onYearChange,
}) => {
  const years = Array.from({ length: 2070 - 2018 + 1 }, (_, i) => 2018 + i);

  const handlePrev = () => {
    if (selectedYear > 2018) {
      onYearChange(selectedYear - 1);
    }
  };

  const handleNext = () => {
    if (selectedYear < 2070) {
      onYearChange(selectedYear + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrev}
        disabled={selectedYear <= 2018}
        className="flex items-center justify-center w-8 h-8 bg-gradient-to-b from-slate-50 to-slate-150/90 hover:from-white hover:to-slate-100 border border-slate-300 text-slate-600 hover:text-slate-800 disabled:opacity-30 rounded-full shadow-sm transition-all duration-150 cursor-pointer"
        aria-label="Año anterior"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="appearance-none font-sans font-bold text-xs text-slate-800 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 px-5 py-1.5 pr-8 rounded-full outline-none cursor-pointer hover:border-slate-400 focus:ring-2 focus:ring-sky-400/30 transition-all text-center h-8 leading-4 shadow-sm"
          aria-label="Seleccionar año"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
          <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={selectedYear >= 2070}
        className="flex items-center justify-center w-8 h-8 bg-gradient-to-b from-slate-50 to-slate-150/90 hover:from-white hover:to-slate-100 border border-slate-300 text-slate-600 hover:text-slate-800 disabled:opacity-30 rounded-full shadow-sm transition-all duration-150 cursor-pointer"
        aria-label="Año siguiente"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
