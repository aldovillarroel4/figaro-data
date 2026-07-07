import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AllYearsData } from '../types';
import { getChartDataFromHistorical, formatCLP } from '../utils';
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

interface DatosAnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  allYearsData: AllYearsData;
}

export const DatosAnoModal: React.FC<DatosAnoModalProps> = ({
  isOpen,
  onClose,
  allYearsData,
}) => {
  const [selectedYears, setSelectedYears] = useState<Set<string>>(new Set());
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  // Prepare full data
  const rawChartData = getChartDataFromHistorical(allYearsData);
  const allYearsList = rawChartData.years;

  // Sync state with full list on open
  useEffect(() => {
    if (isOpen) {
      setSelectedYears(new Set(allYearsList));
      setHiddenKeys(new Set());
    }
  }, [isOpen, allYearsData]);

  if (!isOpen) return null;

  // Filter year data based on selected checkboxes
  const formattedData = allYearsList
    .map((year, idx) => ({
      year,
      'GAN / PER PROM.': rawChartData.ganPerProm[idx],
      'PORC. % PROM. ALDO': rawChartData.porcPromA[idx],
      'PORC. % PROM. MARCOS': rawChartData.porcPromM[idx],
      'T. LIQ. PROM. MARCOS': rawChartData.tLiqPromM[idx],
    }))
    .filter((d) => selectedYears.has(d.year));

  const handleYearToggle = (year: string) => {
    const next = new Set(selectedYears);
    if (next.has(year)) {
      if (next.size > 1) {
        next.delete(year);
      }
    } else {
      next.add(year);
    }
    setSelectedYears(next);
  };

  const handleLegendClick = (props: any) => {
    const { dataKey } = props;
    if (!dataKey) return;
    setHiddenKeys((prev) => {
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
    const key = entry.dataKey || entry.payload?.dataKey || value;
    const isHidden = hiddenKeys.has(key);
    return (
      <span
        className={`cursor-pointer select-none transition-all duration-150 ${
          isHidden
            ? 'text-slate-300 line-through opacity-40'
            : 'text-slate-700 font-semibold hover:text-slate-900'
        }`}
      >
        {value}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-md font-sans">
          <p className="font-bold text-slate-900 mb-2">Año: {label}</p>
          <div className="space-y-1">
            {payload.map((p: any, i: number) => (
              <p key={i} className="text-xs flex items-center gap-2 justify-between">
                <span className="font-semibold" style={{ color: p.color }}>
                  {p.name}:
                </span>
                <span className="font-mono font-bold text-gray-700">
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-display font-bold text-xl text-slate-900">
            DATOS ANUALES (TENDENCIA HISTÓRICA)
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: checkboxes for years */}
        <div className="flex items-center gap-3 p-3 bg-slate-50/50 border-b border-slate-100 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none whitespace-nowrap mr-2">
            Años mostrados:
          </span>
          <div className="flex items-center gap-2">
            {allYearsList.map((y) => {
              const checked = selectedYears.has(y);
              return (
                <label
                  key={y}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-bold cursor-pointer transition-all select-none ${
                    checked
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleYearToggle(y)}
                    className="sr-only"
                  />
                  {y}
                </label>
              );
            })}
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 p-6 min-h-0 bg-white">
          {formattedData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Seleccione al menos un año para ver la gráfica.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="year"
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
                <Line
                  type="monotone"
                  dataKey="GAN / PER PROM."
                  stroke="#4f46e5"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4 }}
                  hide={hiddenKeys.has("GAN / PER PROM.")}
                  label={<CustomizedLabel />}
                />
                <Line
                  type="monotone"
                  dataKey="PORC. % PROM. ALDO"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  hide={hiddenKeys.has("PORC. % PROM. ALDO")}
                  label={<CustomizedLabel />}
                />
                <Line
                  type="monotone"
                  dataKey="PORC. % PROM. MARCOS"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  hide={hiddenKeys.has("PORC. % PROM. MARCOS")}
                  label={<CustomizedLabel />}
                />
                <Line
                  type="monotone"
                  dataKey="T. LIQ. PROM. MARCOS"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  hide={hiddenKeys.has("T. LIQ. PROM. MARCOS")}
                  label={<CustomizedLabel />}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
