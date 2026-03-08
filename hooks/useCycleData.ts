import { useMemo } from 'react';
import { Income } from '../types/income';
import { Payment } from '../types/payment';
import { calculateCycleData, CycleData } from '../utils/calculations';

export function useCycleData(income: Income | null, payments: Payment[]): CycleData | null {
  return useMemo(() => {
    if (!income) return null;
    return calculateCycleData(income, payments);
  }, [income, payments]);
}
