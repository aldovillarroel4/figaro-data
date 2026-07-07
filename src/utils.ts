import { AllYearsData, YearData, MonthData, HistoricalSubData } from './types';

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function formatCLP(number: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

export function formatCLPInput(number: number): string {
  return number === 0 ? '' : number.toLocaleString('es-CL');
}

export function parseCLPInput(val: string): number {
  return Number(val.replace(/\D/g, '')) || 0;
}

export function calculateSecondFloor(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

export function calculateVariationPercentage(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function getYearTotals(allYearsData: AllYearsData, year: number) {
  let totalIncome = 0;
  let totalExpenses = 0;
  let monthsWithData = 0;

  const yearData = allYearsData[year];
  if (yearData && typeof yearData === 'object') {
    MONTHS.forEach(month => {
      const monthData = yearData[month] as MonthData;
      if (!monthData || typeof monthData !== 'object') return;
      
      const incomeArray = Array.isArray(monthData.income) ? monthData.income : [];
      const expensesArray = Array.isArray(monthData.expenses) ? monthData.expenses : [];

      const monthIncome = incomeArray.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
      const monthExpenses = expensesArray.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

      if (monthIncome > 0 || monthExpenses > 0) {
        monthsWithData++;
        totalIncome += monthIncome;
        totalExpenses += monthExpenses;
      }
    });
  }

  const totalProfit = totalIncome - totalExpenses;
  const avgProfit = monthsWithData > 0 ? totalProfit / monthsWithData : 0;
  const avgIncome = monthsWithData > 0 ? totalIncome / monthsWithData : 0;

  return {
    totalProfit,
    avgProfit,
    avgIncome,
    monthsWithData
  };
}

export function getMonthTotals(allYearsData: AllYearsData, year: number, month: string) {
  const yearData = allYearsData[year];
  if (!yearData || !yearData[month]) {
    return { income: 0, expenses: 0, profit: 0 };
  }
  const m = yearData[month] as MonthData;
  const income = Array.isArray(m.income) ? m.income.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;
  const expenses = Array.isArray(m.expenses) ? m.expenses.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;
  const profit = income - expenses;
  return { income, expenses, profit };
}

export function getMonthlyChartDataForYear(allYearsData: AllYearsData, year: number) {
  const ganPer: number[] = [];
  const porcA: number[] = [];
  const porcM: number[] = [];
  const tLiqM: number[] = [];

  MONTHS.forEach(month => {
    const manualYear = allYearsData._historicalManual && allYearsData._historicalManual[year];
    const manual = manualYear && manualYear[month] ? manualYear[month] : null;

    if (manual) {
      const aPct = Number(manual.aldo?.pct) || 0;
      const mPct = Number(manual.marcos?.pct) || 0;
      const mLiq = Number(manual.marcos?.liq) || 0;
      const gan = aPct + mPct;
      
      ganPer.push(Math.round(gan));
      porcA.push(Math.round(aPct));
      porcM.push(Math.round(mPct));
      tLiqM.push(Math.round(mLiq));
    } else {
      const mv = getMonthTotals(allYearsData, year, month);
      ganPer.push(Math.round(mv.profit));
      porcA.push(0);
      porcM.push(0);
      tLiqM.push(0);
    }
  });

  return { months: MONTHS, ganPer, porcA, porcM, tLiqM };
}

export function getChartDataFromHistorical(allYearsData: AllYearsData) {
  const years = Array.isArray(allYearsData._historicalYears) ? allYearsData._historicalYears.slice().map(Number) : [2022];
  // Sorted chronologically
  const sortedYears = years.slice().sort((a, b) => a - b);

  const ganPerProm: number[] = [];
  const porcPromA: number[] = [];
  const porcPromM: number[] = [];
  const tLiqPromM: number[] = [];

  sortedYears.forEach(year => {
    let sumPctA = 0, sumPctM = 0;
    let liqAnoM = 0;
    let monthsWithA = 0, monthsWithM = 0, monthsWithYear = 0;

    MONTHS.forEach(m => {
      const mm = (allYearsData._historicalManual && allYearsData._historicalManual[year]?.[m]) || null;
      if (mm) {
        const aPct = Number(mm.aldo?.pct) || 0;
        const mPct = Number(mm.marcos?.pct) || 0;
        const mLq = Number(mm.marcos?.liq) || 0;
        const aBr = Number(mm.aldo?.bruto) || 0;
        const aLq = Number(mm.aldo?.liq) || 0;
        const mBr = Number(mm.marcos?.bruto) || 0;

        sumPctA += aPct;
        sumPctM += mPct;
        liqAnoM += mLq;

        const hasA = (aBr !== 0 || aLq !== 0 || aPct !== 0);
        const hasM = (mBr !== 0 || mLq !== 0 || mPct !== 0);
        if (hasA) monthsWithA++;
        if (hasM) monthsWithM++;
        if (hasA || hasM) monthsWithYear++;
      } else {
        const mv = getMonthTotals(allYearsData, year, m);
        if (mv.income > 0 || mv.expenses > 0) monthsWithYear++;
      }
    });

    let ganPerAno = sumPctA + sumPctM;
    if (ganPerAno === 0 && !allYearsData._historicalManual?.[year]?.__explicit) {
      let totalProfit = 0;
      let countMonths = 0;
      MONTHS.forEach(m => {
        const mv = getMonthTotals(allYearsData, year, m);
        totalProfit += mv.profit;
        if (mv.income > 0 || mv.expenses > 0) countMonths++;
      });
      ganPerAno = totalProfit;
      monthsWithYear = countMonths;
      liqAnoM = 0;
    }

    const ganPerPromVal = monthsWithYear > 0 ? (ganPerAno / monthsWithYear) : 0;
    const porcPromAVal = monthsWithA > 0 ? (sumPctA / monthsWithA) : 0;
    const porcPromMVal = monthsWithM > 0 ? (sumPctM / monthsWithM) : 0;
    const tLiqPromMVal = monthsWithM > 0 ? (liqAnoM / monthsWithM) : 0;

    ganPerProm.push(Math.round(ganPerPromVal));
    porcPromA.push(Math.round(porcPromAVal));
    porcPromM.push(Math.round(porcPromMVal));
    tLiqPromM.push(Math.round(tLiqPromMVal));
  });

  return {
    years: sortedYears.map(String),
    ganPerProm,
    porcPromA,
    porcPromM,
    tLiqPromM
  };
}
