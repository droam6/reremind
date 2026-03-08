import { Income } from '../types/income';
import { Payment, PayFrequency } from '../types/payment';

export interface PaymentCluster {
  date: string;
  payments: Payment[];
  total: number;
}

export interface CycleData {
  remainingAfterBills: number;
  totalCommitted: number;
  daysUntilPayday: number;
  nextPayment: Payment | null;
  upcomingPayments: Payment[];
  paymentClusters: PaymentCluster[];
  cycleProgress: number;
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

function getPaymentOccurrencesInRange(
  payment: Payment,
  cycleStart: Date,
  cycleEnd: Date
): string[] {
  const occurrences: string[] = [];
  const paymentCycleDays = getCycleDays(payment.frequency);
  let current = startOfDay(new Date(payment.nextDueDate));

  // Walk backward to find the first occurrence at or before cycle start
  while (current > cycleStart) {
    current = addDays(current, -paymentCycleDays);
  }

  // Walk forward through the cycle
  while (current <= cycleEnd) {
    if (current >= cycleStart) {
      occurrences.push(current.toISOString().split('T')[0]);
    }
    current = addDays(current, paymentCycleDays);
  }

  return occurrences;
}

export function calculateCycleData(income: Income, payments: Payment[]): CycleData {
  const today = startOfDay(new Date());
  const nextPayday = startOfDay(new Date(income.nextPayday));
  const cycleDays = getCycleDays(income.frequency);

  const daysUntilPayday = diffDays(today, nextPayday);

  // If payday is today or past, the cycle is complete
  if (daysUntilPayday <= 0) {
    return {
      remainingAfterBills: income.amount,
      totalCommitted: 0,
      daysUntilPayday: 0,
      nextPayment: null,
      upcomingPayments: [],
      paymentClusters: [],
      cycleProgress: 1,
    };
  }

  const cycleStart = addDays(nextPayday, -cycleDays);
  const cycleEnd = addDays(nextPayday, -1);

  // Collect all payment occurrences in this cycle with their dates
  const paymentOccurrences: { payment: Payment; date: string }[] = [];

  for (const payment of payments) {
    const dates = getPaymentOccurrencesInRange(payment, cycleStart, cycleEnd);
    for (const date of dates) {
      paymentOccurrences.push({ payment, date });
    }
  }

  const totalCommitted = paymentOccurrences.reduce((sum, o) => sum + o.payment.amount, 0);
  const remainingAfterBills = Math.max(0, income.amount - totalCommitted);

  // Filter to only future occurrences for upcoming list
  const todayStr = today.toISOString().split('T')[0];
  const futureOccurrences = paymentOccurrences
    .filter((o) => o.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextPayment = futureOccurrences.length > 0 ? futureOccurrences[0].payment : null;
  const upcomingPayments = futureOccurrences
    .slice(0, 3)
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
  };
}
