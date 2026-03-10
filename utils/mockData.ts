import {
  saveIncome,
  savePayments,
  saveCards,
  saveUserProfile,
  saveCycleHistory,
  saveLifetimeStats,
  saveSavingsGoal,
} from './storage';
import { Income } from '../types/income';
import { Payment, Card } from '../types/payment';
import { UserProfile } from '../types/user';
import { CycleRecord, LifetimeStats } from '../types/history';
import { generateId } from './generateId';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function loadMockData(): Promise<void> {
  const now = new Date();

  // Mock income: $2,100 fortnightly, next payday in 5 days
  const income: Income = {
    amount: 2100,
    frequency: 'fortnightly',
    nextPayday: toDateString(addDays(now, 5)),
  };

  // Mock payments (8 realistic Australian payments)
  const payments: Payment[] = [
    {
      id: generateId(),
      name: 'Rent',
      amount: 650,
      frequency: 'fortnightly',
      nextDueDate: toDateString(addDays(now, 3)),
      category: 'rent',
      createdAt: subtractMonths(now, 3).toISOString(),
    },
    {
      id: generateId(),
      name: 'Afterpay - Nike',
      amount: 37.50,
      frequency: 'fortnightly',
      nextDueDate: toDateString(addDays(now, 1)),
      category: 'bnpl',
      createdAt: subtractMonths(now, 1).toISOString(),
    },
    {
      id: generateId(),
      name: 'Zip - JB Hi-Fi',
      amount: 62,
      frequency: 'fortnightly',
      nextDueDate: toDateString(addDays(now, 4)),
      category: 'bnpl',
      createdAt: subtractMonths(now, 2).toISOString(),
    },
    {
      id: generateId(),
      name: 'Electricity',
      amount: 120,
      frequency: 'monthly',
      nextDueDate: toDateString(addDays(now, 6)),
      category: 'utilities',
      createdAt: subtractMonths(now, 3).toISOString(),
    },
    {
      id: generateId(),
      name: 'Phone',
      amount: 65,
      frequency: 'monthly',
      nextDueDate: toDateString(addDays(now, 2)),
      category: 'utilities',
      createdAt: subtractMonths(now, 3).toISOString(),
    },
    {
      id: generateId(),
      name: 'Netflix',
      amount: 16.99,
      frequency: 'monthly',
      nextDueDate: toDateString(addDays(now, 8)),
      category: 'subscriptions',
      createdAt: subtractMonths(now, 2).toISOString(),
    },
    {
      id: generateId(),
      name: 'Spotify',
      amount: 12.99,
      frequency: 'monthly',
      nextDueDate: toDateString(addDays(now, 10)),
      category: 'subscriptions',
      createdAt: subtractMonths(now, 2).toISOString(),
    },
    {
      id: generateId(),
      name: 'Car Insurance',
      amount: 85,
      frequency: 'monthly',
      nextDueDate: toDateString(addDays(now, 5)),
      category: 'insurance',
      createdAt: subtractMonths(now, 3).toISOString(),
    },
  ];

  // Mock cards (2)
  const cards: Card[] = [
    {
      id: generateId(),
      label: 'CommBank Debit',
      lastFour: '4521',
    },
    {
      id: generateId(),
      label: 'NAB Visa',
      lastFour: '8832',
    },
  ];

  // Mock cycle history (6 completed cycles, going back 3 months)
  // Each cycle is 14 days apart (fortnightly)
  const cycleHistory: CycleRecord[] = [
    {
      id: generateId(),
      cycleEndDate: toDateString(subtractMonths(now, 3)),
      incomeAmount: 2100,
      totalCommitted: 1680,
      remainingOnPayday: 47,
      paymentsCovered: 8,
      totalPayments: 8,
      createdAt: subtractMonths(now, 3).toISOString(),
    },
    {
      id: generateId(),
      cycleEndDate: toDateString(addDays(subtractMonths(now, 3), 14)),
      incomeAmount: 2100,
      totalCommitted: 1650,
      remainingOnPayday: 112,
      paymentsCovered: 8,
      totalPayments: 8,
      createdAt: addDays(subtractMonths(now, 3), 14).toISOString(),
    },
    {
      id: generateId(),
      cycleEndDate: toDateString(addDays(subtractMonths(now, 2), 0)),
      incomeAmount: 2100,
      totalCommitted: 1720,
      remainingOnPayday: 23,
      paymentsCovered: 8,
      totalPayments: 8,
      createdAt: addDays(subtractMonths(now, 2), 0).toISOString(),
    },
    {
      id: generateId(),
      cycleEndDate: toDateString(addDays(subtractMonths(now, 2), 14)),
      incomeAmount: 2100,
      totalCommitted: 1590,
      remainingOnPayday: 189,
      paymentsCovered: 8,
      totalPayments: 8,
      createdAt: addDays(subtractMonths(now, 2), 14).toISOString(),
    },
    {
      id: generateId(),
      cycleEndDate: toDateString(addDays(subtractMonths(now, 1), 0)),
      incomeAmount: 2100,
      totalCommitted: 1610,
      remainingOnPayday: 156,
      paymentsCovered: 8,
      totalPayments: 8,
      createdAt: addDays(subtractMonths(now, 1), 0).toISOString(),
    },
    {
      id: generateId(),
      cycleEndDate: toDateString(addDays(subtractMonths(now, 1), 14)),
      incomeAmount: 2100,
      totalCommitted: 1580,
      remainingOnPayday: 201,
      paymentsCovered: 8,
      totalPayments: 8,
      createdAt: addDays(subtractMonths(now, 1), 14).toISOString(),
    },
  ];

  // Mock lifetime stats
  const lifetimeStats: LifetimeStats = {
    totalBillsWatched: 48, // 8 payments × 6 cycles
    totalAmountWatched: 9830,
    cyclesCompleted: 6,
    firstUsedDate: toDateString(subtractMonths(now, 3)),
    currentStreak: 4,
    bestStreak: 4,
  };

  // Mock user profile with premium enabled
  const userProfile: UserProfile = {
    onboardingComplete: true,
    isPremium: true,
    createdAt: subtractMonths(now, 3).toISOString(),
  };

  // Mock savings goal
  const savingsGoal = 150;

  // Save all data to AsyncStorage
  await saveIncome(income);
  await savePayments(payments);
  await saveCards(cards);
  await saveCycleHistory(cycleHistory);
  await saveLifetimeStats(lifetimeStats);
  await saveUserProfile(userProfile);
  await saveSavingsGoal(savingsGoal);

  console.log('Mock data loaded successfully');
}
