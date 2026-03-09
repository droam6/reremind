export type PayFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly';

export type PaymentCategory = 'rent' | 'utilities' | 'subscriptions' | 'bnpl' | 'insurance' | 'transport' | 'groceries' | 'other';

export interface Payment {
  id: string;
  name: string;
  amount: number;
  frequency: PayFrequency;
  nextDueDate: string;
  category: PaymentCategory;
  cardId?: string;
  createdAt: string;
  isSplit?: boolean;
  splitCount?: number;
  fullAmount?: number;
}

export interface Card {
  id: string;
  label: string;
  lastFour?: string;
}
