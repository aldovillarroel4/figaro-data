import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, CalendarDays, TrendingUp, TrendingDown, Trash } from 'lucide-react';
import { AllYearsData, HistoricalHeader, HistoricalSubData } from '../types';
import { formatCLP, calculateVariationPercentage, MONTHS, getMonthTotals } from '../utils';

interface HistoricalSummaryTableProps {
  allYearsData: AllYearsData;
  onUpdateHistoricalManual: (
    year: number,
    month: string,
    personKey: string,
    field: 'bruto' | 'liq' | 'pct',
    value: number
  ) => void;
  onAddHistoricalYear: () => void;
  onDeleteHistoricalYear: (year: number) => void;
  onAddSubcolumn: (year: number) => void;
  onDeleteSubcolumn: (year: number, subIndex: number) => void;
  onRenameHistoricalYear: (year: number, newLabel: string) => void;
  onRenameSubcolumn: (year: number, subIndex: number, newLabel: string) => void;
  openDatosMensual: () => void;
  openDatosAno: () => void;
}

// Local optimization: Optimized Cell Input
const CellInput: React.FC<{
  value: number;
  onCommit: (val: number) => void;
  placeholder?: string;
}> = ({ value, onCommit, placeholder }) => {
  const [localVal, setLocalVal] = useState('');

  useEffect(() => {
    setLocalVal(value === 0 ? '' : value.toLocaleString('es-CL'));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = Number(raw.replace(/\D/g, '')) || 0;
    setLocalVal(raw === '' ? '' : numeric.toLocaleString('es-CL'));
  };

  const handleBlur = () => {
    const numeric = Number(localVal.replace(/\D/g, '')) || 0;
    if (numeric !== value) {
      onCommit(numeric);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-20 text-center text-xs py-0.5 border border-slate-200 rounded hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/15 focus:outline-none transition-all font-mono"
      placeholder={placeholder || "0"}
    />
  );
};

export const HistoricalSummaryTable: React.FC<HistoricalSummaryTableProps> = ({
  allYearsData,
  onUpdateHistoricalManual,
  onAddHistoricalYear,
  onDeleteHistoricalYear,
  onAddSubcolumn,
  onDeleteSubcolumn,
  onRenameHistoricalYear,
  onRenameSubcolumn,
  openDatosMensual,
  openDatosAno,
}) => {
  // Inline edit state
  const [editingYear, setEditingYear] = useState<number | null>(null);
  const [editYearVal, setEditYearVal] = useState('');

  const [editingSub, setEditingSub] = useState<{ year: number; index: number } | null>(null);
  const [editSubVal, setEditSubVal] = useState('');

  // Years to display
  const yearsToShow = allYearsData._historicalYears || [2022];

  // Helper to get manual entries safely
  const getManualItem = (year: number, month: string, personKey: string): HistoricalSubData => {
    return (
      allYearsData._historicalManual?.[year]?.[month]?.[personKey] || {
        bruto: 0,
        liq: 0,
        pct: 0,
      }
    );
  };

  // Helper to compute fallback month totals if no manual entries exist
  const getFallbackMonthTotals = (year: number, month: string) => {
    const ydata = allYearsData[year];
    if (!ydata || !ydata[month]) return { income: 0, expenses: 0, profit: 0 };
    const m = ydata[month];
    const income = Array.isArray(m.income) ? m.income.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) : 0;
    const expenses = Array.isArray(m.expenses) ? m.expenses.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) : 0;
    const profit = income - expenses;
    return { income, expenses, profit };
  };

  return (
    <div className="macos-window rounded-xl overflow-hidden flex flex-col mb-12">
      {/* macOS Window Title & Toolbar */}
      <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
        {/* Left window lights */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-extrabold tracking-wider text-slate-700 font-sans ml-1">
            RESUMEN HISTÓRICO
          </span>
        </div>

        {/* Action Controls styled as macOS segmented toolbar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-400 mr-2 hidden md:inline">
            Doble clic para renombrar • Pase el cursor para eliminar
          </span>
          <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-300/50 shadow-inner gap-1.5">
            <button
              onClick={openDatosMensual}
              className="px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white rounded-md shadow-xs border border-slate-200/50 cursor-pointer transition-all"
            >
              Datos Mensual
            </button>
            <button
              onClick={openDatosAno}
              className="px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white rounded-md shadow-xs border border-slate-200/50 cursor-pointer transition-all"
            >
              Datos Año
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Wrapper */}
      <div className="overflow-x-auto bg-white/80">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* ROW 1: Year header group */}
            <tr className="bg-gradient-to-b from-slate-50 to-slate-100/90 text-slate-700 border-b border-slate-200 font-sans">
              <th rowSpan={2} className="sticky left-0 z-20 p-2.5 font-extrabold border-r border-slate-200 text-center uppercase tracking-wider text-xxs bg-slate-100 min-w-[90px] w-[90px]">
                MES
              </th>
              <th rowSpan={2} className="sticky left-[90px] z-20 p-2.5 font-extrabold border-r-2 border-slate-300 text-center uppercase tracking-wider text-xxs bg-slate-100 min-w-[120px] w-[120px]">
                <div className="flex items-center justify-between gap-1">
                  <span>TOTALES</span>
                  <button
                    onClick={onAddHistoricalYear}
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold transition-colors cursor-pointer text-xs shadow-xs"
                    title="Agregar Año Histórico"
                  >
                    +
                  </button>
                </div>
              </th>

              {yearsToShow.map((year) => {
                const header = allYearsData._historicalHeaders?.[year] || {
                  yearLabel: String(year),
                  sub: ['ALDO', 'MARCOS'],
                };
                const colspan = Math.max(1, header.sub.length);

                return (
                  <th
                    key={year}
                    colSpan={colspan}
                    className="p-2.5 font-extrabold text-center relative border-r border-slate-200 bg-slate-100/30 select-none group"
                  >
                    <div className="flex items-center justify-center gap-2 relative">
                      {/* Add subcolumn button */}
                      <button
                        onClick={() => onAddSubcolumn(year)}
                        className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xxs transition-colors cursor-pointer shadow-xs"
                        title={`Agregar subcolumna a ${year}`}
                      >
                        +
                      </button>

                      {/* Editable Year Label */}
                      {editingYear === year ? (
                        <input
                          type="text"
                          value={editYearVal}
                          onChange={(e) => setEditYearVal(e.target.value)}
                          onBlur={() => {
                            if (editYearVal.trim()) {
                              onRenameHistoricalYear(year, editYearVal.trim());
                            }
                            setEditingYear(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingYear(null);
                            }
                          }}
                          className="bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded border border-sky-400 text-[11px] text-center w-20 focus:outline-none focus:ring-1 focus:ring-sky-500/15"
                          autoFocus
                        />
                      ) : (
                        <span
                          onDoubleClick={() => {
                            setEditingYear(year);
                            setEditYearVal(header.yearLabel);
                          }}
                          className="cursor-pointer hover:underline py-0.5 px-1.5 rounded hover:bg-slate-200 text-slate-800 text-xs font-extrabold"
                          title="Doble clic para editar"
                        >
                          {header.yearLabel}
                        </span>
                      )}

                      {/* Delete Year Button */}
                      <button
                        onClick={() => onDeleteHistoricalYear(year)}
                        className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 transition-all cursor-pointer text-xxs shadow-xs"
                        title={`Eliminar año ${year}`}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* ROW 2: Subcolumn labels */}
            <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-sans">
              {yearsToShow.map((year) => {
                const header = allYearsData._historicalHeaders?.[year] || {
                  yearLabel: String(year),
                  sub: ['ALDO', 'MARCOS'],
                };

                return header.sub.map((subLabel, idx) => {
                  const isLastSub = idx === header.sub.length - 1;
                  return (
                    <th
                      key={`${year}-${idx}`}
                      className={`p-2 text-[10px] font-bold text-center relative group select-none min-w-[90px] bg-slate-50/50 ${
                        isLastSub ? 'border-r border-slate-300' : 'border-r border-slate-200/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 relative">
                        {editingSub?.year === year && editingSub?.index === idx ? (
                          <input
                            type="text"
                            value={editSubVal}
                            onChange={(e) => setEditSubVal(e.target.value)}
                            onBlur={() => {
                              if (editSubVal.trim()) {
                                onRenameSubcolumn(year, idx, editSubVal.trim());
                              }
                              setEditingSub(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                setEditingSub(null);
                              }
                            }}
                            className="bg-white text-slate-900 px-1 py-0.5 rounded border border-sky-400 text-xxs text-center w-14 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span
                            onDoubleClick={() => {
                              setEditingSub({ year, index: idx });
                              setEditSubVal(subLabel);
                            }}
                            className="cursor-pointer hover:underline py-0.5 px-1 rounded hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider"
                            title="Doble clic para editar"
                          >
                            {subLabel}
                          </span>
                        )}

                        {/* Hover action to delete subcolumn */}
                        <button
                          onClick={() => onDeleteSubcolumn(year, idx)}
                          className="opacity-0 group-hover:opacity-100 absolute -right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 bg-slate-400 text-white hover:bg-rose-500 rounded-full cursor-pointer text-[10px] transition-opacity"
                          title={`Eliminar subcolumna "${subLabel}"`}
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  );
                });
              })}
            </tr>
          </thead>

          <tbody>
            {MONTHS.map((month, mIndex) => {
              const isOdd = mIndex % 2 === 1;

              return (
                <tr
                  key={month}
                  className={`border-b border-slate-100 ${
                    isOdd ? 'bg-[#fafdff]/40' : 'bg-white'
                  }`}
                >
                  {/* Column 1: Month Name */}
                  <td className={`sticky left-0 z-10 p-2 font-extrabold text-center border-r border-slate-200 text-slate-700 select-none min-w-[90px] w-[90px] ${
                    isOdd ? 'bg-[#f8fafc]' : 'bg-white'
                  }`}>
                    {month}
                  </td>

                  {/* Column 2: Labels stacked vertically */}
                  <td className={`sticky left-[90px] z-10 p-2 text-[9px] font-bold text-slate-400 leading-normal border-r-2 border-slate-300 select-none min-w-[120px] w-[120px] ${
                    isOdd ? 'bg-[#f8fafc]' : 'bg-white'
                  }`}>
                    <div className="flex flex-col gap-1.5 py-1">
                      <div className="h-5 flex items-center">T. BRUT.</div>
                      <div className="h-5 flex items-center">T. LIQ.</div>
                      <div className="h-5 flex items-center">PORC. %</div>
                      <div className="h-5 flex items-center font-extrabold text-sky-600">GAN / PER</div>
                    </div>
                  </td>

                  {/* Year Subcolumns cells */}
                  {yearsToShow.map((year) => {
                    const header = allYearsData._historicalHeaders?.[year] || {
                      yearLabel: String(year),
                      sub: ['ALDO', 'MARCOS'],
                    };

                    // Compute dynamic GAN / PER for this year & month (sum of pct across all subs)
                    let ganPerForMonth = 0;
                    if (allYearsData._historicalManual?.[year]?.[month]) {
                      const mm = allYearsData._historicalManual[year][month];
                      ganPerForMonth = Object.values(mm).reduce<number>((s, obj: any) => {
                        return s + (Number(obj?.pct) || 0);
                      }, 0);
                    } else {
                      const fallback = getFallbackMonthTotals(year, month);
                      ganPerForMonth = fallback.profit;
                    }

                    return header.sub.map((subLabel, idx) => {
                      const isLastSub = idx === header.sub.length - 1;
                      const personKey = subLabel.toLowerCase().replace(/\s+/g, '_') || `sub_${idx}`;
                      const manual = getManualItem(year, month, personKey);

                      // Calculate variation for the second subcolumn
                      let variationHtml: React.ReactNode = null;
                      if (idx === 1) {
                        const prevYear = year - 1;
                        let prevTotal = 0;
                        if (allYearsData._historicalManual?.[prevYear]?.[month]) {
                          const prevMM = allYearsData._historicalManual[prevYear][month];
                          prevTotal = Object.values(prevMM).reduce<number>((s, obj: any) => s + (Number(obj?.pct) || 0), 0);
                        } else {
                          const fallback = getFallbackMonthTotals(prevYear, month);
                          prevTotal = fallback.profit;
                        }

                        const variationPercent = calculateVariationPercentage(ganPerForMonth, prevTotal);
                        const isPositive = variationPercent >= 0;

                        variationHtml = (
                          <div
                            className={`flex items-center justify-center gap-0.5 text-xs font-bold ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {variationPercent.toFixed(1)}%
                          </div>
                        );
                      }

                      return (
                        <td
                          key={`${year}-${idx}`}
                          className={`p-1.5 text-center align-middle ${
                            isLastSub ? 'border-r border-slate-300' : 'border-r border-slate-100'
                          }`}
                        >
                          <div className="flex flex-col gap-1.5 py-1 items-center justify-center">
                            {/* Bruto input */}
                            <div className="h-5 flex items-center">
                              <CellInput
                                value={manual.bruto}
                                onCommit={(val) =>
                                  onUpdateHistoricalManual(year, month, personKey, 'bruto', val)
                                }
                              />
                            </div>
                            {/* Liq input */}
                            <div className="h-5 flex items-center">
                              <CellInput
                                value={manual.liq}
                                onCommit={(val) =>
                                  onUpdateHistoricalManual(year, month, personKey, 'liq', val)
                                }
                              />
                            </div>
                            {/* Pct input */}
                            <div className="h-5 flex items-center">
                              <CellInput
                                value={manual.pct}
                                onCommit={(val) =>
                                  onUpdateHistoricalManual(year, month, personKey, 'pct', val)
                                }
                              />
                            </div>
                            {/* GAN/PER or Variation label */}
                            <div className="h-5 flex items-center justify-center">
                              {idx === 0 ? (
                                <strong className="text-xs font-bold text-slate-800">
                                  {formatCLP(ganPerForMonth)}
                                </strong>
                              ) : idx === 1 ? (
                                variationHtml
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    });
                  })}
                </tr>
              );
            })}

            {/* TOTAL FINAL ROW */}
            <tr className="bg-slate-100 border-t border-slate-300 text-slate-800 font-extrabold select-none">
              {/* Column 1 */}
              <td className="sticky left-0 z-10 p-3 font-extrabold text-center border-r border-slate-200 uppercase bg-slate-100 min-w-[90px] w-[90px]">
                TOTAL FINAL
              </td>

              {/* Column 2: Labels stacked vertically */}
              <td className="sticky left-[90px] z-10 p-3 text-[9px] font-extrabold text-slate-600 leading-normal border-r-2 border-slate-300 bg-slate-100 min-w-[120px] w-[120px]">
                <div className="flex flex-col gap-1 py-1">
                  <div className="h-5 flex items-center">T. BRUT. AÑO</div>
                  <div className="h-5 flex items-center">T. BRUT. PROM.</div>
                  <div className="h-5 flex items-center">T. LIQ. AÑO</div>
                  <div className="h-5 flex items-center">T. LIQ. PROM.</div>
                  <div className="h-5 flex items-center">PORC. % AÑO</div>
                  <div className="h-5 flex items-center">PORC. % PROM.</div>
                  <div className="h-5 flex items-center text-slate-900 font-black">GAN / PER AÑO</div>
                  <div className="h-5 flex items-center text-slate-900 font-black">GAN / PER PROM.</div>
                </div>
              </td>

              {/* Aggregated totals per subcolumn */}
              {yearsToShow.map((year) => {
                const header = allYearsData._historicalHeaders?.[year] || {
                  yearLabel: String(year),
                  sub: ['ALDO', 'MARCOS'],
                };

                return header.sub.map((subLabel, idx) => {
                  const isLastSub = idx === header.sub.length - 1;
                  const personKey = subLabel.toLowerCase().replace(/\s+/g, '_') || `sub_${idx}`;

                  // Compute aggregate variables
                  let brutoAno = 0;
                  let liqAno = 0;
                  let sumPct = 0;
                  let monthsWithPerson = 0;
                  let monthsWithYear = 0;

                  MONTHS.forEach((m) => {
                    const mmAll = allYearsData._historicalManual?.[year]?.[m] || {};
                    const mm = mmAll[personKey] || { bruto: 0, liq: 0, pct: 0 };
                    
                    const br = Number(mm.bruto) || 0;
                    const lq = Number(mm.liq) || 0;
                    const pct = Number(mm.pct) || 0;

                    brutoAno += br;
                    liqAno += lq;
                    sumPct += pct;

                    if (br !== 0 || lq !== 0 || pct !== 0) {
                      monthsWithPerson++;
                    }

                    const anyHas = Object.values(mmAll).some(
                      (x: any) => x && (Number(x.bruto) || Number(x.liq) || Number(x.pct))
                    );
                    if (anyHas) {
                      monthsWithYear++;
                    }
                  });

                  // Fallback to computed totals from stored years
                  if (brutoAno === 0 && liqAno === 0 && sumPct === 0 && !allYearsData._historicalManual?.[year]?.__explicit) {
                    let computedBruto = 0;
                    let computedProfit = 0;
                    let countMonths = 0;
                    MONTHS.forEach((m) => {
                      const mv = getMonthTotals(allYearsData, year, m);
                      computedBruto += mv.income;
                      computedProfit += mv.profit;
                      if (mv.income > 0 || mv.expenses > 0) countMonths++;
                    });
                    brutoAno = computedBruto;
                    liqAno = computedProfit;
                    monthsWithYear = countMonths;
                  }

                  const brutoProm = monthsWithPerson > 0 ? brutoAno / monthsWithPerson : 0;
                  const liqProm = monthsWithPerson > 0 ? liqAno / monthsWithPerson : 0;
                  const porcProm = monthsWithPerson > 0 ? sumPct / monthsWithPerson : 0;

                  // Render block for first subcolumn (GAN / PER totals)
                  if (idx === 0) {
                    let ganPerAno = 0;
                    let monthsWithYearLocal = 0;
                    MONTHS.forEach((m) => {
                      const mmAll = allYearsData._historicalManual?.[year]?.[m] || {};
                      const sumThisMonth = Object.values(mmAll).reduce<number>((s, obj: any) => s + (Number(obj?.pct) || 0), 0);
                      if (sumThisMonth !== 0) monthsWithYearLocal++;
                      ganPerAno += sumThisMonth;
                    });

                    if (ganPerAno === 0 && !allYearsData._historicalManual?.[year]?.__explicit) {
                      let totalProfit = 0;
                      let monthsCount = 0;
                      MONTHS.forEach((m) => {
                        const mv = getMonthTotals(allYearsData, year, m);
                        totalProfit += mv.profit;
                        if (mv.income > 0 || mv.expenses > 0) monthsCount++;
                      });
                      ganPerAno = totalProfit;
                      monthsWithYearLocal = monthsCount;
                    }

                    const ganPerProm = monthsWithYearLocal > 0 ? ganPerAno / monthsWithYearLocal : 0;

                    return (
                      <td
                        key={`${year}-${idx}`}
                        className={`p-3 text-center align-middle bg-slate-100 text-slate-900 ${
                          isLastSub ? 'border-r border-slate-300' : 'border-r border-slate-200/50'
                        }`}
                      >
                        <div className="flex flex-col gap-1 py-1 items-center justify-center font-mono text-xs text-black font-extrabold">
                          <div className="h-5 flex items-center font-black">{formatCLP(brutoAno)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(brutoProm)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(liqAno)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(liqProm)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(sumPct)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(porcProm)}</div>
                          <div className="h-5 flex items-center font-black text-xs text-black">{formatCLP(ganPerAno)}</div>
                          <div className="h-5 flex items-center font-black text-xs text-black">{formatCLP(ganPerProm)}</div>
                        </div>
                      </td>
                    );
                  }

                  // Render block for second subcolumn (Variation of GAN / PER PROM YoY)
                  if (idx === 1) {
                    const prevYear = year - 1;
                    
                    // Current Prom
                    let currentGanPerProm = 0;
                    let monthsWithYearLocal = 0;
                    let ganPerAnoCurr = 0;
                    MONTHS.forEach((m) => {
                      const mmAll = allYearsData._historicalManual?.[year]?.[m] || {};
                      const sumThisMonth = Object.values(mmAll).reduce<number>((s, obj: any) => s + (Number(obj?.pct) || 0), 0);
                      if (sumThisMonth !== 0) monthsWithYearLocal++;
                      ganPerAnoCurr += sumThisMonth;
                    });
                    if (ganPerAnoCurr === 0 && !allYearsData._historicalManual?.[year]?.__explicit) {
                      let totalProfit = 0;
                      let monthsCount = 0;
                      MONTHS.forEach((m) => {
                        const mv = getMonthTotals(allYearsData, year, m);
                        totalProfit += mv.profit;
                        if (mv.income > 0 || mv.expenses > 0) monthsCount++;
                      });
                      ganPerAnoCurr = totalProfit;
                      monthsWithYearLocal = monthsCount;
                    }
                    currentGanPerProm = monthsWithYearLocal > 0 ? ganPerAnoCurr / monthsWithYearLocal : 0;

                    // Prev Prom
                    let prevGanPerProm = 0;
                    let prevMonthsCount = 0;
                    let prevGanPerAno = 0;
                    MONTHS.forEach((m) => {
                      const mmAll = allYearsData._historicalManual?.[prevYear]?.[m] || {};
                      const sumThisMonth = Object.values(mmAll).reduce<number>((s, obj: any) => s + (Number(obj?.pct) || 0), 0);
                      if (sumThisMonth !== 0) prevMonthsCount++;
                      prevGanPerAno += sumThisMonth;
                    });
                    if (prevGanPerAno === 0 && !allYearsData._historicalManual?.[prevYear]?.__explicit) {
                      let totalProfit = 0;
                      let monthsCount = 0;
                      MONTHS.forEach((m) => {
                        const mv = getMonthTotals(allYearsData, prevYear, m);
                        totalProfit += mv.profit;
                        if (mv.income > 0 || mv.expenses > 0) monthsCount++;
                      });
                      prevGanPerAno = totalProfit;
                      prevMonthsCount = monthsCount;
                    }
                    prevGanPerProm = prevMonthsCount > 0 ? prevGanPerAno / prevMonthsCount : 0;

                    const variationPercent = calculateVariationPercentage(currentGanPerProm, prevGanPerProm);
                    const isPositive = variationPercent >= 0;

                    return (
                      <td
                        key={`${year}-${idx}`}
                        className={`p-3 text-center align-middle bg-slate-100 text-slate-900 ${
                          isLastSub ? 'border-r border-slate-300' : 'border-r border-slate-200/50'
                        }`}
                      >
                        <div className="flex flex-col gap-1 py-1 items-center justify-center font-mono text-xs text-black font-extrabold">
                          <div className="h-5 flex items-center font-black">{formatCLP(brutoAno)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(brutoProm)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(liqAno)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(liqProm)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(sumPct)}</div>
                          <div className="h-5 flex items-center font-black">{formatCLP(porcProm)}</div>
                          <div className="h-5 flex items-center font-black">-</div>
                          <div
                            className={`h-5 flex items-center gap-0.5 font-extrabold ${
                              isPositive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {variationPercent.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    );
                  }

                  // Render blocks for other subcolumns
                  return (
                    <td
                      key={`${year}-${idx}`}
                      className={`p-3 text-center align-middle bg-slate-100 text-slate-900 ${
                        isLastSub ? 'border-r border-slate-300' : 'border-r border-slate-200/50'
                      }`}
                    >
                      <div className="flex flex-col gap-1 py-1 items-center justify-center font-mono text-xs text-black font-extrabold">
                        <div className="h-5 flex items-center font-black">{formatCLP(brutoAno)}</div>
                        <div className="h-5 flex items-center font-black">{formatCLP(brutoProm)}</div>
                        <div className="h-5 flex items-center font-black">{formatCLP(liqAno)}</div>
                        <div className="h-5 flex items-center font-black">{formatCLP(liqProm)}</div>
                        <div className="h-5 flex items-center font-black">{formatCLP(sumPct)}</div>
                        <div className="h-5 flex items-center font-black">{formatCLP(porcProm)}</div>
                        <div className="h-5 flex items-center font-black">-</div>
                        <div className="h-5 flex items-center font-black">-</div>
                      </div>
                    </td>
                  );
                });
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
