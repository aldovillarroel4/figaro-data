import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AllYearsData } from '../types';
import { getMonthlyChartDataForYear, formatCLP, MONTHS } from '../utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CustomizedLabel = (props: any) => {
  const { x, y, value } = props;
  if (value === undefined || value === null) return null;
  return (
    <text
      x={x}
      y={y - 8}
      fill="#0f172a"
      fontSize={9}
      fontWeight={700}
      fontFamily="monospace"
      textAnchor="middle"
    >
      {formatCLP(value)}
    </text>
  );
};

interface DatosMensualModalProps {
  isOpen: boolean;
  onClose: () => void;
  allYearsData: AllYearsData;
  defaultYear: number;
}

interface VariableOption {
  id: string;
  label: string;
  color: string;
}

const VARIABLES: VariableOption[] = [
  { id: 'ganPer', label: 'GAN / PER', color: '#4f46e5' },
  { id: 'porcA', label: 'PORC % ALDO', color: '#0ea5e9' },
  { id: 'porcM', label: 'PORC % MARCOS', color: '#10b981' },
  { id: 'tLiqM', label: 'T. LIQ. MARCOS', color: '#f59e0b' },
];

const PALETTE = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#f43f5e', '#14b8a6', '#f97316', '#6366f1'
];

export const DatosMensualModal: React.FC<DatosMensualModalProps> = ({
  isOpen,
  onClose,
  allYearsData,
  defaultYear,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedVars, setSelectedVars] = useState<Set<string>>(
    new Set(VARIABLES.map((v) => v.id))
  );
  const [comparedYears, setComparedYears] = useState<Set<string>>(new Set());
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  // Get full list of years from historical headers
  const availableYears = Array.isArray(allYearsData._historicalYears)
    ? allYearsData._historicalYears.slice().map(Number).sort((a, b) => a - b)
    : [defaultYear];

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedYear(defaultYear);
      setSelectedVars(new Set(VARIABLES.map((v) => v.id)));
      setComparedYears(new Set([String(defaultYear)]));
      setHiddenLines(new Set());
    }
  }, [isOpen, defaultYear, allYearsData]);

  if (!isOpen) return null;

  const handleVarToggle = (varId: string) => {
    const next = new Set(selectedVars);
    if (next.has(varId)) {
      if (next.size > 1) {
        next.delete(varId);
      }
    } else {
      next.add(varId);
    }
    setSelectedVars(next);
  };

  const handleYearCompareToggle = (yearStr: string) => {
    const next = new Set(comparedYears);
    if (next.has(yearStr)) {
      if (next.size > 1) {
        next.delete(yearStr);
      }
    } else {
      next.add(yearStr);
    }
    setComparedYears(next);
  };

  const handleLegendClick = (props: any) => {
    const { dataKey } = props;
    if (!dataKey) return;
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  const renderLegendText = (value: string, entry: any) => {
    const key = entry.dataKey || entry.payload?.dataKey || entry.payload?.value || value;
    const isHidden = hiddenLines.has(key);
    return (
      <span
        className={`cursor-pointer select-none transition-all duration-150 ${
          isHidden
            ? 'text-slate-350 line-through opacity-40'
            : 'text-slate-700 font-semibold hover:text-slate-900'
        }`}
      >
        {value}
      </span>
    );
  };

  const isMultiYearComparison = selectedVars.size === 1;
  const singleVarId = isMultiYearComparison ? Array.from(selectedVars)[0] : '';
  const singleVarObj = VARIABLES.find((v) => v.id === singleVarId);

  // Prepare chart data based on view mode
  let chartData: any[] = [];
  let lineKeys: { key: string; name: string; color: string }[] = [];

  if (isMultiYearComparison && singleVarObj) {
    // Multi-year comparison of a single variable
    // X-axis: Months
    // Curves: Selected years
    chartData = MONTHS.map((month, idx) => {
      const row: any = { month };
      comparedYears.forEach((yStr) => {
        const yearNum = Number(yStr);
        const yearMonthData = getMonthlyChartDataForYear(allYearsData, yearNum);
        
        let val = 0;
        if (singleVarId === 'ganPer') val = yearMonthData.ganPer[idx];
        if (singleVarId === 'porcA') val = yearMonthData.porcA[idx];
        if (singleVarId === 'porcM') val = yearMonthData.porcM[idx];
        if (singleVarId === 'tLiqM') val = yearMonthData.tLiqM[idx];
        row[yStr] = val;
      });
      return row;
    });

    // Each selected year gets a line
    [...comparedYears]
      .sort((a, b) => Number(a) - Number(b))
      .forEach((yStr, idx) => {
        lineKeys.push({
          key: yStr,
          name: `${singleVarObj.label} (${yStr})`,
          color: PALETTE[idx % PALETTE.length],
        });
      });
  } else {
    // Multi-variable single year chart
    // X-axis: Months
    // Curves: Checked variables (GAN/PER, PORC ALDO, etc.)
    const yearMonthData = getMonthlyChartDataForYear(allYearsData, selectedYear);
    
    chartData = MONTHS.map((month, idx) => ({
      month,
      ganPer: yearMonthData.ganPer[idx],
      porcA: yearMonthData.porcA[idx],
      porcM: yearMonthData.porcM[idx],
      tLiqM: yearMonthData.tLiqM[idx],
    }));

    VARIABLES.forEach((v) => {
      if (selectedVars.has(v.id)) {
        lineKeys.push({
          key: v.id,
          name: v.label,
          color: v.color,
        });
      }
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-md font-sans">
          <p className="font-bold text-slate-900 mb-2">Mes: {label}</p>
          <div className="space-y-1">
            {payload.map((p: any, i: number) => (
              <p key={i} className="text-xs flex items-center gap-2 justify-between">
                <span className="font-semibold" style={{ color: p.color }}>
                  {p.name}:
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {formatCLP(p.value)}
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xxs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-display font-bold text-xl text-slate-900">
            DATOS MENSUALES
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar selectors */}
        <div className="flex flex-col gap-3 p-4 bg-slate-50/50 border-b border-slate-100">
          {/* Variables select */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              Variables:
            </span>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => {
                const checked = selectedVars.has(v.id);
                return (
                  <label
                    key={v.id}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-bold cursor-pointer transition-all select-none"
                    style={{
                      borderColor: checked ? v.color : '#e2e8f0',
                      backgroundColor: checked ? v.color : 'white',
                      color: checked ? 'white' : v.color,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleVarToggle(v.id)}
                      className="sr-only"
                    />
                    {v.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Primary Year Select OR Multi-Year Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-3">
              <label htmlFor="mensualYear" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Año Base:
              </label>
              <select
                id="mensualYear"
                value={selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setSelectedYear(y);
                  if (isMultiYearComparison) {
                    const next = new Set(comparedYears);
                    next.add(String(y));
                    setComparedYears(next);
                  }
                }}
                className="font-semibold border border-slate-200 px-3 py-1.5 rounded-md bg-white text-indigo-600 outline-none text-xs cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/15"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Revealed when exactly 1 variable is selected */}
            {isMultiYearComparison && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-2">
                  Comparar Años:
                </span>
                <div className="flex items-center gap-2">
                  {availableYears.map((y) => {
                    const checked = comparedYears.has(String(y));
                    return (
                      <label
                        key={y}
                        className={`flex items-center gap-2 px-2.5 py-1 border rounded-md text-xxs font-bold cursor-pointer transition-all select-none ${
                          checked
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-150'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleYearCompareToggle(String(y))}
                          className="sr-only"
                        />
                        {y}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 p-6 min-h-0 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                stroke="#888"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                padding={{ left: 30, right: 30 }}
              />
              <YAxis
                stroke="#888"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, fontWeight: 500 }}
                onClick={handleLegendClick}
                formatter={renderLegendText}
              />
              {lineKeys.map((item, idx) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stroke={item.color}
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                  hide={hiddenLines.has(item.key)}
                  label={<CustomizedLabel />}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
