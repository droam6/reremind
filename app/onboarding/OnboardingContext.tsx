import { createContext, useContext, useState, ReactNode } from 'react';
import { IncomeFrequency } from '../../types/income';
import { Payment, PayFrequency, PaymentCategory } from '../../types/payment';

interface OnboardingIncome {
  amount: number;
  frequency: IncomeFrequency;
  nextPayday: string;
}

interface OnboardingState {
  income: OnboardingIncome;
  payments: Payment[];
  setIncomeAmount: (amount: number) => void;
  setIncomeFrequency: (frequency: IncomeFrequency) => void;
  setIncomeNextPayday: (nextPayday: string) => void;
  addPayment: (payment: Payment) => void;
  removePayment: (id: string) => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [income, setIncome] = useState<OnboardingIncome>({
    amount: 0,
    frequency: 'fortnightly',
    nextPayday: '',
  });
  const [payments, setPayments] = useState<Payment[]>([]);

  const setIncomeAmount = (amount: number) => {
    setIncome((prev) => ({ ...prev, amount }));
  };

  const setIncomeFrequency = (frequency: IncomeFrequency) => {
    setIncome((prev) => ({ ...prev, frequency }));
  };

  const setIncomeNextPayday = (nextPayday: string) => {
    setIncome((prev) => ({ ...prev, nextPayday }));
  };

  const addPayment = (payment: Payment) => {
    setPayments((prev) => [...prev, payment]);
  };

  const removePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <OnboardingContext.Provider
      value={{ income, payments, setIncomeAmount, setIncomeFrequency, setIncomeNextPayday, addPayment, removePayment }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
