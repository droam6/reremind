import AsyncStorage from '@react-native-async-storage/async-storage';
import { Income } from '../types/income';
import { Payment, Card } from '../types/payment';
import { UserProfile } from '../types/user';

const KEYS = {
  INCOME: '@reremind/income',
  PAYMENTS: '@reremind/payments',
  CARDS: '@reremind/cards',
  USER: '@reremind/user',
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

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([KEYS.INCOME, KEYS.PAYMENTS, KEYS.CARDS, KEYS.USER]);
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}
