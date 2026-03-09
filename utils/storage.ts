import AsyncStorage from '@react-native-async-storage/async-storage';
import { Income } from '../types/income';
import { Payment, Card } from '../types/payment';
import { UserProfile } from '../types/user';
import { CycleRecord, LifetimeStats } from '../types/history';

const KEYS = {
  INCOME: '@reremind/income',
  PAYMENTS: '@reremind/payments',
  CARDS: '@reremind/cards',
  USER: '@reremind/user',
  HISTORY: '@reremind/history',
  LIFETIME: '@reremind/lifetime',
  SAVINGS_GOAL: '@reremind/savingsGoal',
  SAVINGS_NUDGE: '@reremind/showSavingsNudge',
} as const;

export async function getIncome(): Promise<Income | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.INCOME);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to read income:', e);
    return null;
  }
}

export async function saveIncome(income: Income): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.INCOME, JSON.stringify(income));
  } catch (e) {
    console.error('Failed to save income:', e);
  }
}

export async function getPayments(): Promise<Payment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read payments:', e);
    return [];
  }
}

export async function savePayments(payments: Payment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  } catch (e) {
    console.error('Failed to save payments:', e);
  }
}

export async function addPayment(payment: Payment): Promise<void> {
  try {
    const existing = await getPayments();
    existing.push(payment);
    await savePayments(existing);
  } catch (e) {
    console.error('Failed to add payment:', e);
  }
}

export async function removePayment(id: string): Promise<void> {
  try {
    const existing = await getPayments();
    const filtered = existing.filter((p) => p.id !== id);
    await savePayments(filtered);
  } catch (e) {
    console.error('Failed to remove payment:', e);
  }
}

export async function getCards(): Promise<Card[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CARDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read cards:', e);
    return [];
  }
}

export async function saveCards(cards: Card[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards:', e);
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to read user profile:', e);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

// Cycle history

export async function getCycleHistory(): Promise<CycleRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read cycle history:', e);
    return [];
  }
}

export async function saveCycleHistory(history: CycleRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save cycle history:', e);
  }
}

export async function addCycleRecord(record: CycleRecord): Promise<void> {
  try {
    const existing = await getCycleHistory();
    existing.push(record);
    await saveCycleHistory(existing);
  } catch (e) {
    console.error('Failed to add cycle record:', e);
  }
}

// Lifetime stats

export async function getLifetimeStats(): Promise<LifetimeStats | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LIFETIME);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to read lifetime stats:', e);
    return null;
  }
}

export async function saveLifetimeStats(stats: LifetimeStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LIFETIME, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save lifetime stats:', e);
  }
}

// Savings nudge

export async function getSavingsGoal(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVINGS_GOAL);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveSavingsGoal(amount: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SAVINGS_GOAL, JSON.stringify(amount));
  } catch (e) {
    console.error('Failed to save savings goal:', e);
  }
}

export async function clearSavingsGoal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.SAVINGS_GOAL);
  } catch (e) {
    console.error('Failed to clear savings goal:', e);
  }
}

export async function getSavingsNudgeFlag(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVINGS_NUDGE);
    return raw === 'true';
  } catch (e) {
    return false;
  }
}

export async function setSavingsNudgeFlag(show: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SAVINGS_NUDGE, String(show));
  } catch (e) {
    console.error('Failed to set savings nudge flag:', e);
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.INCOME, KEYS.PAYMENTS, KEYS.CARDS, KEYS.USER,
      KEYS.HISTORY, KEYS.LIFETIME, KEYS.SAVINGS_GOAL, KEYS.SAVINGS_NUDGE,
    ]);
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}
