export type IncomeFrequency = 'weekly' | 'fortnightly' | 'monthly';

export interface Income {
  amount: number;
  frequency: IncomeFrequency;
  nextPayday: string;
}
