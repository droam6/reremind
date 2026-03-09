import { Income } from '../types/income';
import { Payment, PayFrequency } from '../types/payment';
import { parseDate, toISODateString } from './formatDate';

export interface PaymentCluster {
  date: string;
  payments: Payment[];
  total: number;
}

export interface CyclePaymentOccurrence {
  payment: Payment;
  date: string;
}

export interface CycleData {
  remainingAfterBills: number;
  totalCommitted: number;
  daysUntilPayday: number;
  nextPayment: Payment | null;
  upcomingPayments: Payment[];
  paymentClusters: PaymentCluster[];
  cycleProgress: number;
  cycleOccurrences: CyclePaymentOccurrence[];
}

function getCycleDays(frequency: PayFrequency | Income['frequency']): number {
  switch (frequency) {
    case 'weekly': return 7;
    case 'fortnightly': return 14;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'yearly': return 365;
    default: return 30;
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(from: Date, to: Date): number {
  const msPerDay = 86400000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPaymentOccurrencesInRange(
  payment: Payment,
  cycleStart: Date,
  cycleEnd: Date
): string[] {
  const occurrences: string[] = [];
  const paymentCycleDays = getCycleDays(payment.frequency);
  let current = startOfDay(parseDate(payment.nextDueDate));

  // Walk backward to find the first occurrence at or before cycle start
  while (current > cycleStart) {
    current = addDays(current, -paymentCycleDays);
  }

  // Walk forward through the cycle
  while (current <= cycleEnd) {
    if (current >= cycleStart) {
      occurrences.push(toDateStr(current));
    }
    current = addDays(current, paymentCycleDays);
  }

  return occurrences;
}

export function calculateCycleData(income: Income, payments: Payment[]): CycleData {
  const today = startOfDay(new Date());
  const cycleDays = getCycleDays(income.frequency);

  // Parse nextPayday safely (handles DD/MM/YYYY and YYYY-MM-DD)
  let nextPayday = startOfDay(parseDate(income.nextPayday));

  // Auto-advance payday if it's today or in the past
  while (diffDays(today, nextPayday) <= 0) {
    nextPayday = addDays(nextPayday, cycleDays);
  }

  const daysUntilPayday = diffDays(today, nextPayday);
  const cycleStart = addDays(nextPayday, -cycleDays);
  const cycleEnd = addDays(nextPayday, -1);

  // Collect all payment occurrences in this cycle with their dates
  const paymentOccurrences: CyclePaymentOccurrence[] = [];

  for (const payment of payments) {
    const dates = getPaymentOccurrencesInRange(payment, cycleStart, cycleEnd);
    for (const date of dates) {
      paymentOccurrences.push({ payment, date });
    }
  }

  const totalCommitted = paymentOccurrences.reduce((sum, o) => sum + o.payment.amount, 0);
  const remainingAfterBills = Math.max(0, income.amount - totalCommitted);

  // Filter to only future occurrences (today or later) for upcoming list
  const todayStr = toDateStr(today);
  const futureOccurrences = paymentOccurrences
    .filter((o) => o.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextPayment = futureOccurrences.length > 0
    ? { ...futureOccurrences[0].payment, nextDueDate: futureOccurrences[0].date }
    : null;

  // Return enough for the next-payment card (index 0) + coming up list (indices 1-3)
  const upcomingPayments = futureOccurrences
    .slice(0, 5)
    .map((o) => ({ ...o.payment, nextDueDate: o.date }));

  // Build payment clusters (days with 2+ payments)
  const dateMap = new Map<string, Payment[]>();
  for (const o of futureOccurrences) {
    const existing = dateMap.get(o.date) || [];
    existing.push(o.payment);
    dateMap.set(o.date, existing);
  }

  const paymentClusters: PaymentCluster[] = [];
  for (const [date, clusterPayments] of dateMap) {
    if (clusterPayments.length >= 2) {
      paymentClusters.push({
        date,
        payments: clusterPayments,
        total: clusterPayments.reduce((sum, p) => sum + p.amount, 0),
      });
    }
  }
  paymentClusters.sort((a, b) => a.date.localeCompare(b.date));

  const totalDaysInCycle = cycleDays;
  const daysElapsed = totalDaysInCycle - daysUntilPayday;
  const cycleProgress = Math.min(1, Math.max(0, daysElapsed / totalDaysInCycle));

  return {
    remainingAfterBills,
    totalCommitted,
    daysUntilPayday,
    nextPayment,
    upcomingPayments,
    paymentClusters,
    cycleProgress,
    cycleOccurrences: paymentOccurrences,
  };
}

export interface DayPaymentInfo {
  date: string;
  payments: Payment[];
  total: number;
}

export function getDayPayments(payments: Payment[], dateStr: string): DayPaymentInfo {
  const target = startOfDay(parseDate(dateStr));
  const matching: Payment[] = [];

  for (const p of payments) {
    const cycleDays = getCycleDays(p.frequency);
    let current = startOfDay(parseDate(p.nextDueDate));

    // Walk backward past target
    while (current > target) {
      current = addDays(current, -cycleDays);
    }
    // Walk forward to find if it lands on target
    while (current <= target) {
      if (current.getTime() === target.getTime()) {
        matching.push(p);
        break;
      }
      current = addDays(current, cycleDays);
    }
  }

  return {
    date: dateStr,
    payments: matching,
    total: matching.reduce((sum, p) => sum + p.amount, 0),
  };
}

export function getWeekPayments(payments: Payment[]): DayPaymentInfo[] {
  const today = startOfDay(new Date());
  const days: DayPaymentInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const dateStr = toDateStr(date);
    days.push(getDayPayments(payments, dateStr));
  }
  return days;
}

export function getWeekTotal(payments: Payment[]): number {
  return getWeekPayments(payments).reduce((sum, d) => sum + d.total, 0);
}

export interface BusiestDayInfo {
  date: string;
  count: number;
  total: number;
}

export function getBusiestDay(payments: Payment[], days: number = 7): BusiestDayInfo {
  const today = startOfDay(new Date());
  let busiest: BusiestDayInfo = { date: '', count: 0, total: 0 };

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const dateStr = toDateStr(date);
    const info = getDayPayments(payments, dateStr);
    if (info.payments.length > busiest.count) {
      busiest = { date: dateStr, count: info.payments.length, total: info.total };
    }
  }

  return busiest;
}
