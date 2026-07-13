import React, { useRef, useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IncomeItem, ExpenseItem, ColumnWidths } from '../types';
import { formatCLP, formatCLPInput, parseCLPInput, calculateSecondFloor } from '../utils';

interface FinanceTableProps {
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
  columnWidths?: ColumnWidths;
  onIncomeChange: (index: number, field: keyof IncomeItem, value: any) => void;
  onExpenseChange: (index: number, field: keyof ExpenseItem, value: any) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onDeleteIncome: (index: number) => void;
  onDeleteExpense: (index: number) => void;
  onColumnResize: (tableId: string, colIndex: number, newWidth: number) => void;
}

// Dynamic currency formatting while typing helper
const CurrencyInput: React.FC<{
  value: number;
  onChange: (num: number) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const [displayVal, setDisplayVal] = useState('');

  useEffect(() => {
    setDisplayVal(formatCLPInput(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = parseCLPInput(raw);
    setDisplayVal(raw === '' ? '' : numeric.toLocaleString('es-CL'));
    onChange(numeric);
  };

  return (
    <input
      type="text"
      value={displayVal}
      onChange={handleInputChange}
      className={`w-full px-2.5 py-1 h-[30px] text-xs border border-slate-200 rounded-md focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 focus:outline-none transition-all bg-white text-slate-800 ${className}`}
      placeholder="0"
    />
  );
};

export const FinanceTable: React.FC<FinanceTableProps> = ({
  incomeItems,
  expenseItems,
  columnWidths,
  onIncomeChange,
  onExpenseChange,
  onAddIncome,
  onAddExpense,
  onDeleteIncome,
  onDeleteExpense,
  onColumnResize,
}) => {
  // Resizing state
  const dragInfo = useRef<{
    tableId: string;
    colIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    tableId: string,
    colIndex: number,
    thElement: HTMLTableCellElement | null
  ) => {
    if (!thElement) return;
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragInfo.current = {
      tableId,
      colIndex,
      startX: clientX,
      startWidth: thElement.offsetWidth,
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeStop);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeStop);
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!dragInfo.current) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dx = clientX - dragInfo.current.startX;
    const newWidth = Math.max(70, dragInfo.current.startWidth + dx);

    onColumnResize(dragInfo.current.tableId, dragInfo.current.colIndex, newWidth);
  };

  const handleResizeStop = () => {
    dragInfo.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeStop);
    document.removeEventListener('touchmove', handleResizeMove);
    document.removeEventListener('touchend', handleResizeStop);
  };

  // Safe columns style map
  const getColStyle = (tableId: string, colIndex: number, defaultWidth?: string) => {
    const width = columnWidths?.[tableId]?.[colIndex];
    return width ? { width: `${width}px`, minWidth: `${width}px` } : defaultWidth ? { width: defaultWidth, minWidth: defaultWidth } : undefined;
  };

  // Total calculations
  const totalIncome = incomeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const total2ndFloor = expenseItems.reduce(
    (sum, item) => sum + calculateSecondFloor(item.amount || 0, item.percentage || 0),
    0
  );

  // Helper references for widths measurement
  const thInc0Ref = useRef<HTMLTableCellElement>(null);
  const thInc1Ref = useRef<HTMLTableCellElement>(null);
  const thInc2Ref = useRef<HTMLTableCellElement>(null);
  const thExp0Ref = useRef<HTMLTableCellElement>(null);
  const thExp1Ref = useRef<HTMLTableCellElement>(null);
  const thExp2Ref = useRef<HTMLTableCellElement>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* INGRESOS TABLE - macOS Window */}
      <div className="macos-window rounded-xl overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2.5 flex items-center justify-start select-none">
          <span className="text-xs font-extrabold tracking-wider text-slate-700 font-sans ml-1">
            INGRESOS
          </span>
        </div>

        {/* Content area */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white/50">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-gradient-to-b from-slate-50 to-slate-100/90 text-slate-700 border-b border-slate-200">
                  <th
                    ref={thInc0Ref}
                    style={getColStyle('incomeTable', 0, '65%')}
                    className="relative p-2.5 text-left font-bold text-xs uppercase tracking-wider select-none border-r border-slate-200/60"
                  >
                    ITEM
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'incomeTable', 0, thInc0Ref.current)}
                      onTouchStart={(e) => handleResizeStart(e, 'incomeTable', 0, thInc0Ref.current)}
                      className="th-resizer hover:bg-slate-300/30 active:bg-slate-300/50 transition-all"
                    />
                  </th>
                  <th
                    ref={thInc1Ref}
                    style={getColStyle('incomeTable', 1, '35%')}
                    className="relative p-2.5 text-center font-bold text-xs uppercase tracking-wider select-none"
                  >
                    MONTO
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'incomeTable', 1, thInc1Ref.current)}
                      onTouchStart={(e) => handleResizeStart(e, 'incomeTable', 1, thInc1Ref.current)}
                      className="th-resizer hover:bg-slate-300/30 active:bg-slate-300/50 transition-all"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {incomeItems.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400 text-xs font-medium">
                      No hay ingresos registrados en este mes.
                    </td>
                  </tr>
                ) : (
                  incomeItems.map((item, index) => (
                    <tr key={index} className="hover:bg-white/40 transition-colors border-b border-slate-100 last:border-0">
                      <td style={getColStyle('incomeTable', 0)} className="p-1.5 border-r border-slate-200/40 overflow-hidden">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => onIncomeChange(index, 'description', e.target.value)}
                          className="w-full px-2.5 py-1 h-[30px] text-xs border border-slate-200 rounded-md focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 focus:outline-none transition-all bg-white text-slate-800"
                          placeholder="Descripción"
                        />
                      </td>
                      <td style={getColStyle('incomeTable', 1)} className="p-1.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <CurrencyInput
                            value={item.amount}
                            onChange={(val) => onIncomeChange(index, 'amount', val)}
                          />
                          <button
                            onClick={() => onDeleteIncome(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Eliminar ingreso"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 font-bold text-slate-800 border-t border-slate-200">
                  <td style={getColStyle('incomeTable', 0)} className="p-2.5 border-r border-slate-200/40 text-xs">TOTAL INGRESOS</td>
                  <td style={getColStyle('incomeTable', 1)} className="p-2.5 text-left font-bold text-xs text-sky-600 font-mono">
                    {formatCLP(totalIncome)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 flex justify-start">
            <button
              onClick={onAddIncome}
              className="flex items-center justify-center gap-1 px-4 py-1.5 bg-gradient-to-b from-[#409cff] to-[#0070f3] hover:from-[#57a9ff] hover:to-[#007ff5] text-white text-xs font-bold rounded-full shadow-sm border border-[#0060d0] hover:border-[#0050c0] active:from-[#0060d0] transition-all cursor-pointer"
            >
              <Plus size={14} /> Agregar Ingreso
            </button>
          </div>
        </div>
      </div>

      {/* EGRESOS TABLE - macOS Window */}
      <div className="macos-window rounded-xl overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="bg-gradient-to-b from-[#f6f6f6] to-[#e8e8e8] border-b border-slate-300/70 px-4 py-2.5 flex items-center justify-start select-none">
          <span className="text-xs font-extrabold tracking-wider text-slate-700 font-sans ml-1">
            EGRESOS
          </span>
        </div>

        {/* Content area */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white/50">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-gradient-to-b from-slate-50 to-slate-100/90 text-slate-700 border-b border-slate-200">
                  <th
                    ref={thExp0Ref}
                    style={getColStyle('expensesTable', 0, '40%')}
                    className="relative p-2.5 text-left font-bold text-xs uppercase tracking-wider select-none border-r border-slate-200/60"
                  >
                    ITEM
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'expensesTable', 0, thExp0Ref.current)}
                      onTouchStart={(e) => handleResizeStart(e, 'expensesTable', 0, thExp0Ref.current)}
                      className="th-resizer hover:bg-slate-300/30 active:bg-slate-300/50 transition-all"
                    />
                  </th>
                  <th
                    ref={thExp1Ref}
                    style={getColStyle('expensesTable', 1, '30%')}
                    className="relative p-2.5 text-center font-bold text-xs uppercase tracking-wider select-none border-r border-slate-200/60"
                  >
                    MONTO
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'expensesTable', 1, thExp1Ref.current)}
                      onTouchStart={(e) => handleResizeStart(e, 'expensesTable', 1, thExp1Ref.current)}
                      className="th-resizer hover:bg-slate-300/30 active:bg-slate-300/50 transition-all"
                    />
                  </th>
                  <th
                    ref={thExp2Ref}
                    style={getColStyle('expensesTable', 2, '30%')}
                    className="relative p-2.5 text-center font-bold text-xs uppercase tracking-wider select-none"
                  >
                    2DO PISO
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'expensesTable', 2, thExp2Ref.current)}
                      onTouchStart={(e) => handleResizeStart(e, 'expensesTable', 2, thExp2Ref.current)}
                      className="th-resizer hover:bg-slate-300/30 active:bg-slate-300/50 transition-all"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenseItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 text-xs font-medium">
                      No hay egresos registrados en este mes.
                    </td>
                  </tr>
                ) : (
                  expenseItems.map((item, index) => (
                    <tr key={index} className="hover:bg-white/40 transition-colors border-b border-slate-100 last:border-0">
                      <td style={getColStyle('expensesTable', 0)} className="p-1.5 border-r border-slate-200/40 overflow-hidden">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => onExpenseChange(index, 'description', e.target.value)}
                          className="w-full px-2.5 py-1 h-[30px] text-xs border border-slate-200 rounded-md focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 focus:outline-none transition-all bg-white text-slate-800"
                          placeholder="Descripción"
                        />
                      </td>
                      <td style={getColStyle('expensesTable', 1)} className="p-1.5 border-r border-slate-200/40 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <CurrencyInput
                            value={item.amount}
                            onChange={(val) => onExpenseChange(index, 'amount', val)}
                          />
                          <button
                            onClick={() => onDeleteExpense(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Eliminar egreso"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                      <td style={getColStyle('expensesTable', 2)} className="p-1.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              value={item.percentage}
                              onChange={(e) => onExpenseChange(index, 'percentage', Number(e.target.value))}
                              className="w-12 px-2.5 py-1 h-[30px] text-xs border border-slate-200 rounded-md focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 focus:outline-none transition-all text-center bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-800"
                              placeholder="0"
                              min={0}
                              max={100}
                            />
                            <span className="text-xs text-slate-500 font-semibold">%</span>
                          </div>
                          <span className="px-2.5 py-1 h-[30px] text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-800 text-right min-w-[90px] flex items-center justify-end font-sans">
                            {formatCLP(calculateSecondFloor(item.amount || 0, item.percentage || 0))}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 font-bold text-slate-800 border-t border-slate-200">
                  <td style={getColStyle('expensesTable', 0)} className="p-2.5 border-r border-slate-200/40 text-xs">TOTAL EGRESOS</td>
                  <td style={getColStyle('expensesTable', 1)} className="p-2.5 text-left font-bold text-xs text-rose-500 border-r border-slate-200/40 font-mono">
                    {formatCLP(totalExpenses)}
                  </td>
                  <td style={getColStyle('expensesTable', 2)} className="p-2.5 text-right font-bold text-xs text-amber-600 font-mono">
                    {formatCLP(total2ndFloor)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 flex justify-start">
            <button
              onClick={onAddExpense}
              className="flex items-center justify-center gap-1 px-4 py-1.5 bg-gradient-to-b from-[#409cff] to-[#0070f3] hover:from-[#57a9ff] hover:to-[#007ff5] text-white text-xs font-bold rounded-full shadow-sm border border-[#0060d0] hover:border-[#0050c0] active:from-[#0060d0] transition-all cursor-pointer"
            >
              <Plus size={14} /> Agregar Egreso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
