import React from 'react';
import { TrendingUp, TrendingDown, Landmark, Calendar, Scale } from 'lucide-react';
import { AllYearsData, MonthData } from '../types';
import { formatCLP, calculateVariationPercentage, getYearTotals } from '../utils';

interface BalanceCardsProps {
  allYearsData: AllYearsData;
  selectedYear: number;
  currentMonth: string;
  totalIncome: number;
  totalExpenses: number;
}

const VariationBadge: React.FC<{ value: number }> = ({ value }) => {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-sm px-2.5 py-1 rounded-md ${
        isPositive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-rose-100 text-rose-700'
      }`}
    >
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
};

export const BalanceCards: React.FC<BalanceCardsProps> = ({
  allYearsData,
  selectedYear,
  currentMonth,
  totalIncome,
  totalExpenses,
}) => {
  // Current month balance
  const finalBalance = totalIncome - totalExpenses;

  // Compute previous year same month balance
  const prevYear = selectedYear - 1;
  let prevMonthBalance = 0;
  
  if (allYearsData[prevYear] && allYearsData[prevYear][currentMonth]) {
    const pm = allYearsData[prevYear][currentMonth] as MonthData;
    const prevIncome = Array.isArray(pm.income) ? pm.income.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;
    const prevExpenses = Array.isArray(pm.expenses) ? pm.expenses.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;
    prevMonthBalance = prevIncome - prevExpenses;
  }

  // Monthly variation calculation
  const monthVariation = calculateVariationPercentage(finalBalance, prevMonthBalance);

  // Annual Totals
  const currentYearData = getYearTotals(allYearsData, selectedYear);
  const prevYearData = getYearTotals(allYearsData, prevYear);

  // Year-over-year variations
  const profitVariation = calculateVariationPercentage(currentYearData.totalProfit, prevYearData.totalProfit);
  const avgProfitVariation = calculateVariationPercentage(currentYearData.avgProfit, prevYearData.avgProfit);
  const avgIncomeVariation = calculateVariationPercentage(currentYearData.avgIncome, prevYearData.avgIncome);

  return (
    <div className="space-y-8 mb-8">
      {/* SECCIÓN BALANCE MENSUAL COMPUESTO - macOS Window */}
      <div className="macos-window rounded-xl overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2.5 flex items-center justify-start select-none">
          <span className="text-xs font-extrabold tracking-wider text-slate-700 font-sans ml-1">
            RESUMEN DE BALANCE MENSUAL
          </span>
        </div>

        {/* Content Area */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center text-center justify-between p-5 bg-white/60 rounded-xl border border-slate-200/50 shadow-inner">
            <div>
              <h3 className="font-sans font-bold text-xxs text-slate-400 uppercase tracking-widest mb-1.5">
                Balance Mensual ({currentMonth} {selectedYear})
              </h3>
              <p className={`text-3xl font-sans font-extrabold tracking-tight ${
                finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCLP(finalBalance)}
              </p>
            </div>
            <p className="text-xxs text-slate-400 mt-4 font-medium leading-normal">
              Ingresos - Egresos registrados para el mes actual.
            </p>
          </div>

          <div className="flex flex-col items-center text-center justify-between p-5 bg-white/60 rounded-xl border border-slate-200/50 shadow-inner">
            <div>
              <h3 className="font-sans font-bold text-xxs text-slate-400 uppercase tracking-widest mb-1.5">
                Mismo Mes Año Anterior ({currentMonth} {prevYear})
              </h3>
              <div className="flex items-center justify-center flex-wrap gap-2.5 mt-1">
                <span className={`text-3xl font-sans font-extrabold tracking-tight ${
                  prevMonthBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {formatCLP(prevMonthBalance)}
                </span>
                <VariationBadge value={monthVariation} />
              </div>
            </div>
            <p className="text-xxs text-slate-400 mt-4 font-medium leading-normal">
              Variación porcentual respecto al mismo mes del año {prevYear}.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN BALANCE ANUAL INTEGRADO - 3 macOS Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BALANCE AÑO ACTUAL */}
        <div className="macos-window rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2 flex items-center justify-start select-none">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 font-sans ml-1">
                AÑO ACTUAL
              </span>
            </div>

            <div className="p-5">
              <h3 className="font-sans font-extrabold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={15} className="text-sky-500" /> Balance ({selectedYear})
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/40 text-xs">
                  <span className="font-medium text-slate-500">Utilidad Total:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCLP(currentYearData.totalProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/40 text-xs">
                  <span className="font-medium text-slate-500">Utilidad Promedio:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCLP(currentYearData.avgProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs">
                  <span className="font-medium text-slate-500">Ingreso Promedio:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCLP(currentYearData.avgIncome)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BALANCE AÑO ANTERIOR */}
        <div className="macos-window rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2 flex items-center justify-start select-none">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 font-sans ml-1">
                AÑO ANTERIOR
              </span>
            </div>

            <div className="p-5">
              <h3 className="font-sans font-extrabold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <Landmark size={15} className="text-slate-400" /> Balance ({prevYear})
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/40 text-xs">
                  <span className="font-medium text-slate-500">Utilidad Total:</span>
                  <span className="font-bold text-slate-700 font-mono">{formatCLP(prevYearData.totalProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/40 text-xs">
                  <span className="font-medium text-slate-500">Utilidad Promedio:</span>
                  <span className="font-bold text-slate-700 font-mono">{formatCLP(prevYearData.avgProfit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs">
                  <span className="font-medium text-slate-500">Ingreso Promedio:</span>
                  <span className="font-bold text-slate-700 font-mono">{formatCLP(prevYearData.avgIncome)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INDICADORES / VARIACIÓN */}
        <div className="macos-window rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2 flex items-center justify-start select-none">
              <span className="text-[10px] font-bold tracking-wider text-slate-600 font-sans ml-1">
                INDICADORES
              </span>
            </div>

            <div className="p-5">
              <h3 className="font-sans font-extrabold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <Scale size={15} className="text-sky-500" /> Comparativas YoY
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/40 text-xs">
                  <span className="font-medium text-slate-500">Var. Utilidad Total:</span>
                  <VariationBadge value={profitVariation} />
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/40 text-xs">
                  <span className="font-medium text-slate-500">Var. Utilidad Promedio:</span>
                  <VariationBadge value={avgProfitVariation} />
                </div>
                <div className="flex justify-between items-center py-1.5 text-xs">
                  <span className="font-medium text-slate-500">Var. Ingreso Promedio:</span>
                  <VariationBadge value={avgIncomeVariation} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
