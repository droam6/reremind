import { CycleData } from '../hooks/useCycleData';
import { CycleRecord, LifetimeStats } from '../types/history';
import { formatCurrency } from './formatCurrency';
import { capitalizeName } from './capitalize';

export function getPulseMessage(
  cycleData: CycleData,
  history: CycleRecord[],
  stats: LifetimeStats | null
): string {
  // 1. If remainingAfterBills is 0
  if (cycleData.remainingAfterBills <= 0) {
    return "It's tight right now. You'll get through this.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // 2. If a payment is due today
  const todayPayment = cycleData.cycleOccurrences.find(
    (occ) => occ.nextDueDate === todayStr
  );
  if (todayPayment) {
    return `Heads up — ${capitalizeName(todayPayment.name)} hits today.`;
  }

  // 3. If 2+ payments cluster tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowPayments = cycleData.cycleOccurrences.filter(
    (occ) => occ.nextDueDate === tomorrowStr
  );
  if (tomorrowPayments.length >= 2) {
    const total = tomorrowPayments.reduce((sum, p) => sum + p.amount, 0);
    return `${tomorrowPayments.length} payments hit tomorrow. Brace for ${formatCurrency(total)}.`;
  }

  // 4. If remaining < income * 0.1
  if (cycleData.remainingAfterBills < cycleData.incomeAmount * 0.1) {
    return 'Getting close. Be mindful the next few days.';
  }

  // 5. If current streak > 0
  if (stats && stats.currentStreak > 0) {
    return `You've gone ${stats.currentStreak} ${stats.currentStreak === 1 ? 'cycle' : 'cycles'} without hitting zero. Keep it up.`;
  }

  // 6. If last cycle remaining > previous
  if (history.length >= 2) {
    const lastCycle = history[history.length - 1];
    const secondLastCycle = history[history.length - 2];
    if (lastCycle.remainingOnPayday > secondLastCycle.remainingOnPayday) {
      return "You had more left last payday than the one before. That's real progress.";
    }
  }

  // 7. Default
  const days = cycleData.daysUntilPayday;
  return `You have ${days} ${days === 1 ? 'day' : 'days'} until payday. You've got this.`;
}
