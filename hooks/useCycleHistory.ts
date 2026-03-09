import { useState, useEffect, useCallback } from 'react';
import { CycleRecord } from '../types/history';
import {
  getCycleHistory,
  addCycleRecord as persistAdd,
  saveCycleHistory,
} from '../utils/storage';

export function useCycleHistory() {
  const [history, setHistory] = useState<CycleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await getCycleHistory();
    setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRecord = useCallback(async (record: CycleRecord) => {
    await persistAdd(record);
    setHistory((prev) => [...prev, record]);
  }, []);

  const clearHistory = useCallback(async () => {
    await saveCycleHistory([]);
    setHistory([]);
  }, []);

  return { history, loading, addRecord, clearHistory, reload };
}
