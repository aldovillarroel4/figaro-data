export interface IncomeItem {
  description: string;
  amount: number;
}

export interface ExpenseItem {
  description: string;
  amount: number;
  percentage: number;
}

export interface MonthData {
  income: IncomeItem[];
  expenses: ExpenseItem[];
}

export interface ColumnWidths {
  [tableId: string]: {
    [colIndex: number]: number;
  };
}

export interface YearData {
  [monthName: string]: MonthData | any; // Could also contain columnWidths
  columnWidths?: ColumnWidths;
}

export interface HistoricalSubData {
  bruto: number;
  liq: number;
  pct: number;
}

export interface HistoricalManualMonth {
  [personKey: string]: HistoricalSubData;
}

export interface HistoricalManualYear {
  [monthName: string]: HistoricalManualMonth | any;
  __explicit?: boolean;
}

export interface HistoricalHeader {
  yearLabel: string;
  sub: string[];
}

export interface AllYearsData {
  [year: number]: YearData;
  _historicalYears?: number[];
  _historicalManual?: {
    [year: number]: HistoricalManualYear;
  };
  _historicalHeaders?: {
    [year: number]: HistoricalHeader;
  };
}
