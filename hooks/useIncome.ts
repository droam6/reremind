import { useState, useEffect, useCallback } from 'react';
import { Income } from '../types/income';
import { getIncome, saveIncome as persistIncome } from '../utils/storage';

export function useIncome() {
  const [income, setIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await getIncome();
    setIncome(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveIncome = useCallback(async (data: Income) => {
    await persistIncome(data);
    setIncome(data);
  }, []);

  const clearIncome = useCallback(async () => {
    await persistIncome({ amount: 0, frequency: 'fortnightly', nextPayday: '' });
    setIncome(null);
  }, []);

  return { income, loading, saveIncome, clearIncome, reload };
}
