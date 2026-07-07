import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Download, Upload, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { AllYearsData, YearData, MonthData, HistoricalHeader, HistoricalSubData } from './types';
import { MONTHS, getMonthTotals, getYearTotals } from './utils';
import { INITIAL_ALL_YEARS_DATA, INITIAL_SELECTED_YEAR, INITIAL_CURRENT_MONTH, getEmptyAllYearsData } from './initialData';

// Import custom components
import { ConfirmModal } from './components/ConfirmModal';
import { YearSelector } from './components/YearSelector';
import { MonthTabs } from './components/MonthTabs';
import { FinanceTable } from './components/FinanceTable';
import { BalanceCards } from './components/BalanceCards';
import { HistoricalSummaryTable } from './components/HistoricalSummaryTable';
import { DatosAnoModal } from './components/DatosAnoModal';
import { DatosMensualModal } from './components/DatosMensualModal';

const STORAGE_KEY = 'figaroData';

export default function App() {
  // State initialization
  const [allYearsData, setAllYearsData] = useState<AllYearsData>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Check if it has any valid structure (year key or historical config)
          const isProbablyValid = parsed._historicalYears || Object.keys(parsed).some(key => /^\d{4}$/.test(key));
          if (isProbablyValid) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error reading localStorage data, initializing empty.', e);
      }
    }
    // If no real data or empty, write the initial data to localStorage immediately so it's persisted
    const emptyData = getEmptyAllYearsData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyData));
    return emptyData;
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const isProbablyValid = parsed && (parsed._historicalYears || Object.keys(parsed).some(key => /^\d{4}$/.test(key)));
        if (isProbablyValid) {
          return new Date().getFullYear(); // e.g. 2026
        }
      } catch (e) {}
    }
    return INITIAL_SELECTED_YEAR;
  });

  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const isProbablyValid = parsed && (parsed._historicalYears || Object.keys(parsed).some(key => /^\d{4}$/.test(key)));
        if (isProbablyValid) {
          const monthIndex = new Date().getMonth();
          return MONTHS[monthIndex] || 'Enero';
        }
      } catch (e) {}
    }
    return INITIAL_CURRENT_MONTH;
  });

  const [isBackupDropdownOpen, setIsBackupDropdownOpen] = useState(false);
  const [isDatosAnoOpen, setIsDatosAnoOpen] = useState(false);
  const [isDatosMensualOpen, setIsDatosMensualOpen] = useState(false);
  
  // Custom confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isAlert?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Aceptar',
    cancelLabel: 'Cancelar',
    isAlert: false,
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel = 'Aceptar') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel: 'Cancelar',
      isAlert: false,
      onConfirm: () => {
        onConfirm();
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const showAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      confirmLabel: 'Aceptar',
      isAlert: true,
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-normalize state on change or initialization
  useEffect(() => {
    let changed = false;
    const nextData = { ...allYearsData };

    // 1. Ensure current year exists
    if (!nextData[selectedYear]) {
      nextData[selectedYear] = {};
      changed = true;
    }

    // 2. Ensure all 12 months exist inside the selected year
    MONTHS.forEach((m) => {
      if (!nextData[selectedYear][m]) {
        nextData[selectedYear][m] = {
          income: [],
          expenses: [],
        };
        changed = true;
      }
    });

    // 3. Ensure historical years exists
    if (!nextData._historicalYears || !Array.isArray(nextData._historicalYears)) {
      nextData._historicalYears = [2022];
      changed = true;
    }

    // 4. Ensure historical headers exists
    if (!nextData._historicalHeaders) {
      nextData._historicalHeaders = {
        2022: { yearLabel: '2022', sub: ['ALDO', 'MARCOS'] },
      };
      changed = true;
    }

    // 5. Ensure historical manual entries exists
    if (!nextData._historicalManual) {
      nextData._historicalManual = {};
      changed = true;
    }

    // Initialize missing months in manual year entries
    nextData._historicalYears.forEach((y) => {
      if (!nextData._historicalManual![y]) {
        nextData._historicalManual![y] = {};
        changed = true;
      }
      MONTHS.forEach((m) => {
        if (!nextData._historicalManual![y][m]) {
          nextData._historicalManual![y][m] = {};
          changed = true;
        }
        const headers = nextData._historicalHeaders![y] || { yearLabel: String(y), sub: ['ALDO', 'MARCOS'] };
        headers.sub.forEach((subLabel) => {
          const personKey = subLabel.toLowerCase().replace(/\s+/g, '_');
          if (!nextData._historicalManual![y][m][personKey]) {
            nextData._historicalManual![y][m][personKey] = { bruto: 0, liq: 0, pct: 0 };
            changed = true;
          }
        });
      });
    });

    if (changed) {
      setAllYearsData(nextData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    }
  }, [selectedYear, allYearsData]);

  // Persist state to localStorage on every change
  const saveState = (updated: AllYearsData) => {
    setAllYearsData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Safe accessor to year/month financial items
  const yearData: YearData = allYearsData[selectedYear] || {};
  const monthData: MonthData = yearData[currentMonth] || { income: [], expenses: [] };
  const incomeItems = Array.isArray(monthData.income) ? monthData.income : [];
  const expenseItems = Array.isArray(monthData.expenses) ? monthData.expenses : [];
  const columnWidths = yearData.columnWidths;

  // Handlers for Income list
  const handleIncomeChange = (index: number, field: 'description' | 'amount', value: any) => {
    const next = { ...allYearsData };
    if (!next[selectedYear]) next[selectedYear] = {};
    if (!next[selectedYear][currentMonth]) next[selectedYear][currentMonth] = { income: [], expenses: [] };
    
    next[selectedYear][currentMonth].income[index] = {
      ...next[selectedYear][currentMonth].income[index],
      [field]: value,
    };
    saveState(next);
  };

  const handleAddIncome = () => {
    const next = { ...allYearsData };
    if (!next[selectedYear]) next[selectedYear] = {};
    if (!next[selectedYear][currentMonth]) next[selectedYear][currentMonth] = { income: [], expenses: [] };
    
    next[selectedYear][currentMonth].income.push({
      description: '',
      amount: 0,
    });
    saveState(next);
  };

  const handleDeleteIncome = (index: number) => {
    const next = { ...allYearsData };
    next[selectedYear][currentMonth].income.splice(index, 1);
    saveState(next);
  };

  // Handlers for Expenses list
  const handleExpenseChange = (index: number, field: 'description' | 'amount' | 'percentage', value: any) => {
    const next = { ...allYearsData };
    if (!next[selectedYear]) next[selectedYear] = {};
    if (!next[selectedYear][currentMonth]) next[selectedYear][currentMonth] = { income: [], expenses: [] };
    
    next[selectedYear][currentMonth].expenses[index] = {
      ...next[selectedYear][currentMonth].expenses[index],
      [field]: value,
    };
    saveState(next);
  };

  const handleAddExpense = () => {
    const next = { ...allYearsData };
    if (!next[selectedYear]) next[selectedYear] = {};
    if (!next[selectedYear][currentMonth]) next[selectedYear][currentMonth] = { income: [], expenses: [] };
    
    next[selectedYear][currentMonth].expenses.push({
      description: '',
      amount: 0,
      percentage: 0,
    });
    saveState(next);
  };

  const handleDeleteExpense = (index: number) => {
    const next = { ...allYearsData };
    next[selectedYear][currentMonth].expenses.splice(index, 1);
    saveState(next);
  };

  // Handlers for column resize persistent widths
  const handleColumnWidthResize = (tableId: string, colIndex: number, newWidth: number) => {
    const next = { ...allYearsData };
    if (!next[selectedYear]) next[selectedYear] = {};
    if (!next[selectedYear].columnWidths) next[selectedYear].columnWidths = {};
    if (!next[selectedYear].columnWidths[tableId]) next[selectedYear].columnWidths[tableId] = {};
    
    next[selectedYear].columnWidths[tableId][colIndex] = newWidth;
    saveState(next);
  };

  // Handlers for TRASPASO (copies active item lists descriptions to the next month, resetting amounts to 0)
  const handleTransferToNextMonth = () => {
    const currentIndex = MONTHS.indexOf(currentMonth);
    if (currentIndex === MONTHS.length - 1) {
      showAlert('Atención', 'No se puede traspasar desde el último mes del año.');
      return;
    }

    const nextMonth = MONTHS[currentIndex + 1];
    const next = { ...allYearsData };

    if (!next[selectedYear]) next[selectedYear] = {};
    if (!next[selectedYear][nextMonth]) {
      next[selectedYear][nextMonth] = { income: [], expenses: [] };
    }

    // Map income descriptions
    next[selectedYear][nextMonth].income = incomeItems.map((item) => ({
      description: item.description,
      amount: 0,
    }));

    // Map expense descriptions & carry over percentages
    next[selectedYear][nextMonth].expenses = expenseItems.map((item) => ({
      description: item.description,
      amount: 0,
      percentage: item.percentage || 0,
    }));

    saveState(next);
    setCurrentMonth(nextMonth);
  };

  // Handlers for BACKUP download
  const handleBackup = () => {
    const data = {
      allYearsData,
      currentMonth,
      selectedYear,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `figaro-backup-all-years.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsBackupDropdownOpen(false);
  };

  // Handlers for RESTORE upload
  const handleRestoreClick = () => {
    fileInputRef.current?.click();
    setIsBackupDropdownOpen(false);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawText = e.target?.result as string;
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed === 'object') {
          let restoredData: AllYearsData;
          let restoredMonth = currentMonth;
          let restoredYear = selectedYear;

          // Support wrapped backup format as well as raw database format
          if ('allYearsData' in parsed) {
            restoredData = parsed.allYearsData || {};
            restoredMonth = parsed.currentMonth || restoredMonth;
            restoredYear = parsed.selectedYear || restoredYear;
          } else {
            restoredData = parsed;
          }

          // Check if the data is a valid dataset (has _historicalYears or 4-digit year keys)
          const isProbablyValid = restoredData._historicalYears || Object.keys(restoredData).some(key => /^\d{4}$/.test(key));
          if (isProbablyValid) {
            setAllYearsData(restoredData);
            setCurrentMonth(restoredMonth);
            setSelectedYear(Number(restoredYear));

            localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredData));
            showAlert('CARGA EXITOSA', 'Datos restaurados exitosamente.');
          } else {
            showAlert('Error', 'El archivo no tiene el formato de respaldo correcto.');
          }
        } else {
          showAlert('Error', 'El archivo no tiene el formato de respaldo correcto.');
        }
      } catch (err) {
        console.error(err);
        showAlert('Error', 'Error al restaurar los datos.');
      }
    };
    reader.readAsText(file);
    // clear input
    event.target.value = '';
  };

  // Handlers for HISTORICAL SUMMARY table
  const handleUpdateHistoricalManual = (
    year: number,
    month: string,
    personKey: string,
    field: 'bruto' | 'liq' | 'pct',
    value: number
  ) => {
    const next = { ...allYearsData };
    if (!next._historicalManual) next._historicalManual = {};
    if (!next._historicalManual[year]) next._historicalManual[year] = {};
    if (!next._historicalManual[year][month]) next._historicalManual[year][month] = {};
    if (!next._historicalManual[year][month][personKey]) {
      next._historicalManual[year][month][personKey] = { bruto: 0, liq: 0, pct: 0 };
    }

    next._historicalManual[year][month][personKey][field] = value;
    saveState(next);
  };

  const handleAddHistoricalYear = () => {
    const next = { ...allYearsData };
    if (!next._historicalYears) next._historicalYears = [2022];
    
    const maxYear = next._historicalYears.reduce((m, y) => Math.max(m, Number(y)), 0) || 2022;
    const newYear = maxYear + 1;

    // Use current first visible year as template
    let templateSubs = ['ALDO', 'MARCOS'];
    if (next._historicalYears.length > 0) {
      const firstVisible = next._historicalYears[0];
      if (next._historicalHeaders?.[firstVisible]?.sub) {
        templateSubs = [...next._historicalHeaders[firstVisible].sub];
      }
    }

    // Prepend to show next to TOTALS
    next._historicalYears.unshift(newYear);

    // Initialize headers
    if (!next._historicalHeaders) next._historicalHeaders = {};
    next._historicalHeaders[newYear] = {
      yearLabel: String(newYear),
      sub: [...templateSubs],
    };

    // Initialize manual entries
    if (!next._historicalManual) next._historicalManual = {};
    next._historicalManual[newYear] = { __explicit: true };

    MONTHS.forEach((m) => {
      next._historicalManual![newYear][m] = {};
      templateSubs.forEach((subLabel) => {
        const personKey = subLabel.toLowerCase().replace(/\s+/g, '_');
        next._historicalManual![newYear][m][personKey] = { bruto: 0, liq: 0, pct: 0 };
      });
    });

    saveState(next);
  };

  const handleDeleteHistoricalYear = (year: number) => {
    showConfirm(
      'Eliminar Año Histórico',
      `¿Eliminar el año ${year} de la tabla histórica? Esta acción no se puede deshacer.`,
      () => {
        const next = { ...allYearsData };
        if (next._historicalYears) {
          next._historicalYears = next._historicalYears.filter((y) => Number(y) !== Number(year));
        }
        if (next._historicalManual && next._historicalManual[year]) {
          delete next._historicalManual[year];
        }
        if (next._historicalHeaders && next._historicalHeaders[year]) {
          delete next._historicalHeaders[year];
        }
        saveState(next);
      },
      'Eliminar'
    );
  };

  const handleAddSubcolumn = (year: number) => {
    const next = { ...allYearsData };
    if (!next._historicalHeaders) next._historicalHeaders = {};
    
    const existingHeader = next._historicalHeaders[year] || { yearLabel: String(year), sub: ['ALDO', 'MARCOS'] };
    const nextSub = [...existingHeader.sub];
    
    const newIndex = nextSub.length + 1;
    const newLabel = `SUB ${newIndex}`;
    nextSub.push(newLabel);

    next._historicalHeaders = {
      ...next._historicalHeaders,
      [year]: {
        ...existingHeader,
        sub: nextSub,
      }
    };

    const personKey = newLabel.toLowerCase().replace(/\s+/g, '_');

    // Initialize manual entries for this subcolumn across months
    if (!next._historicalManual) next._historicalManual = {};
    next._historicalManual = {
      ...next._historicalManual,
      [year]: {
        ...(next._historicalManual[year] || {})
      }
    };

    MONTHS.forEach((m) => {
      next._historicalManual![year][m] = {
        ...(next._historicalManual![year][m] || {}),
        [personKey]: { bruto: 0, liq: 0, pct: 0 }
      };
    });

    saveState(next);
  };

  const handleDeleteSubcolumn = (year: number, subIndex: number) => {
    const hdrs = allYearsData._historicalHeaders?.[year];
    if (!hdrs || !Array.isArray(hdrs.sub) || subIndex < 0 || subIndex >= hdrs.sub.length) {
      return;
    }
    const subLabel = hdrs.sub[subIndex] || `SUB ${subIndex + 1}`;
    
    showConfirm(
      'Eliminar Subcolumna',
      `¿Eliminar la subcolumna "${subLabel}" del año ${year}? Esta acción eliminará sus datos manuales.`,
      () => {
        const next = { ...allYearsData };
        if (!next._historicalHeaders) next._historicalHeaders = {};
        
        const nextSub = [...hdrs.sub];
        nextSub.splice(subIndex, 1);

        next._historicalHeaders = {
          ...next._historicalHeaders,
          [year]: {
            ...hdrs,
            sub: nextSub,
          }
        };

        const personKey = subLabel.toLowerCase().replace(/\s+/g, '_');
        if (next._historicalManual?.[year]) {
          next._historicalManual = {
            ...next._historicalManual,
            [year]: {
              ...next._historicalManual[year]
            }
          };

          MONTHS.forEach((m) => {
            if (next._historicalManual![year][m]) {
              const nextMonthData = { ...next._historicalManual![year][m] };
              delete nextMonthData[personKey];
              next._historicalManual![year][m] = nextMonthData;
            }
          });
        }

        saveState(next);
      },
      'Eliminar'
    );
  };

  const handleRenameHistoricalYear = (year: number, newLabel: string) => {
    const next = { ...allYearsData };
    if (!next._historicalHeaders) next._historicalHeaders = {};
    const existing = next._historicalHeaders[year] || { yearLabel: String(year), sub: ['ALDO', 'MARCOS'] };
    
    next._historicalHeaders = {
      ...next._historicalHeaders,
      [year]: {
        ...existing,
        yearLabel: newLabel,
      }
    };
    saveState(next);
  };

  const handleRenameSubcolumn = (year: number, subIndex: number, newLabel: string) => {
    const hdrs = allYearsData._historicalHeaders?.[year];
    if (!hdrs || !Array.isArray(hdrs.sub) || subIndex < 0 || subIndex >= hdrs.sub.length) {
      return;
    }
    const oldLabel = hdrs.sub[subIndex];
    const oldPersonKey = oldLabel.toLowerCase().replace(/\s+/g, '_');
    const newPersonKey = newLabel.toLowerCase().replace(/\s+/g, '_');

    const next = { ...allYearsData };
    if (!next._historicalHeaders) next._historicalHeaders = {};
    
    const nextSub = [...hdrs.sub];
    nextSub[subIndex] = newLabel;

    next._historicalHeaders = {
      ...next._historicalHeaders,
      [year]: {
        ...hdrs,
        sub: nextSub,
      }
    };

    // Migrate values to the new key across months
    if (next._historicalManual?.[year]) {
      next._historicalManual = {
        ...next._historicalManual,
        [year]: {
          ...next._historicalManual[year]
        }
      };

      MONTHS.forEach((m) => {
        const monthManual = next._historicalManual![year][m];
        if (monthManual && monthManual[oldPersonKey]) {
          const nextMonthData = { ...monthManual };
          nextMonthData[newPersonKey] = { ...nextMonthData[oldPersonKey] };
          delete nextMonthData[oldPersonKey];
          next._historicalManual![year][m] = nextMonthData;
        }
      });
    }

    saveState(next);
  };

  // Close backups dropdown when clicking outside
  useEffect(() => {
    if (!isBackupDropdownOpen) return;
    const clickHandler = () => setIsBackupDropdownOpen(false);
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [isBackupDropdownOpen]);

  // Totals for FinanceTable calculation (computed safely)
  const totalIncome = incomeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eceff4] via-[#f3f5f8] to-[#e4e9f2] text-slate-800 font-sans pb-16 relative overflow-hidden">
      {/* Dynamic macOS abstract background blurred circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#60a5fa]/8 to-[#818cf8]/12 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-[#ec4899]/4 to-[#818cf8]/8 blur-[100px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="macos-toolbar py-3.5 px-6 mb-8 sticky top-0 z-40">
        <div className="max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand and Year controls */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 bg-white/45 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/40 shadow-sm">
              <div>
                <h1 className="font-display font-black text-lg tracking-tight text-slate-900 leading-none">
                  FIGARO
                </h1>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-0.5">
                  Gestión Financiera
                </p>
              </div>
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <YearSelector
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* TRASPASO BUTTON */}
            <button
              onClick={handleTransferToNextMonth}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-slate-50 to-slate-100 hover:from-white hover:to-slate-100 text-slate-800 text-xs font-bold rounded-full shadow-sm border border-slate-300/80 hover:border-slate-400 active:bg-slate-200 transition-all cursor-pointer"
              title="Copia los items activos al mes siguiente con monto 0"
            >
              <RefreshCw size={12} className="text-slate-600" />
              TRASPASO
            </button>

            {/* RESPALDO DROPDOWN */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBackupDropdownOpen(!isBackupDropdownOpen);
                }}
                className="flex items-center gap-1 px-4 py-2 bg-gradient-to-b from-[#409cff] to-[#0070f3] hover:from-[#57a9ff] hover:to-[#007ff5] text-white text-xs font-bold rounded-full shadow-md border border-[#0060d0] active:from-[#0060d0] active:to-[#0050b0] transition-all cursor-pointer uppercase tracking-wider"
              >
                RESPALDO
              </button>

              {isBackupDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-100 text-left">
                  <button
                    onClick={handleBackup}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-[#0070f3] hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    Respaldar Datos
                  </button>
                  <button
                    onClick={handleRestoreClick}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-[#0070f3] hover:text-white font-semibold transition-colors cursor-pointer border-t border-slate-100"
                  >
                    <Upload size={13} />
                    Restaurar Datos
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-6 relative z-10">
        {/* Month Tabs Navigation */}
        <MonthTabs
          currentMonth={currentMonth}
          onMonthSelect={setCurrentMonth}
        />

        {/* Income / Expense Side-by-Side Tables */}
        <FinanceTable
          incomeItems={incomeItems}
          expenseItems={expenseItems}
          columnWidths={columnWidths}
          onIncomeChange={handleIncomeChange}
          onExpenseChange={handleExpenseChange}
          onAddIncome={handleAddIncome}
          onAddExpense={handleAddExpense}
          onDeleteIncome={handleDeleteIncome}
          onDeleteExpense={handleDeleteExpense}
          onColumnResize={handleColumnWidthResize}
        />

        {/* Balance Cards & Variations */}
        <BalanceCards
          allYearsData={allYearsData}
          selectedYear={selectedYear}
          currentMonth={currentMonth}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />

        {/* Historical Summary Table (custom red grids & subcolumns) */}
        <HistoricalSummaryTable
          allYearsData={allYearsData}
          onUpdateHistoricalManual={handleUpdateHistoricalManual}
          onAddHistoricalYear={handleAddHistoricalYear}
          onDeleteHistoricalYear={handleDeleteHistoricalYear}
          onAddSubcolumn={handleAddSubcolumn}
          onDeleteSubcolumn={handleDeleteSubcolumn}
          onRenameHistoricalYear={handleRenameHistoricalYear}
          onRenameSubcolumn={handleRenameSubcolumn}
          openDatosMensual={() => setIsDatosMensualOpen(true)}
          openDatosAno={() => setIsDatosAnoOpen(true)}
        />
      </main>

      {/* LARGE ANALYSIS MODALS (Recharts graphs) */}
      <DatosAnoModal
        isOpen={isDatosAnoOpen}
        onClose={() => setIsDatosAnoOpen(false)}
        allYearsData={allYearsData}
      />

      <DatosMensualModal
        isOpen={isDatosMensualOpen}
        onClose={() => setIsDatosMensualOpen(false)}
        allYearsData={allYearsData}
        defaultYear={selectedYear}
      />

      {/* Reusable custom confirmation / alert modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        cancelLabel={modalConfig.cancelLabel}
        isAlert={modalConfig.isAlert}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
