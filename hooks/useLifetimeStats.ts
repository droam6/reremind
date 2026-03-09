import { useState, useEffect, useCallback } from 'react';
import { LifetimeStats } from '../types/history';
import { getLifetimeStats, saveLifetimeStats } from '../utils/storage';

const DEFAULT_STATS: LifetimeStats = {
  totalBillsWatched: 0,
  totalAmountWatched: 0,
  cyclesCompleted: 0,
  firstUsedDate: new Date().toISOString().split('T')[0],
  currentStreak: 0,
  bestStreak: 0,
};

export function useLifetimeStats() {
  const [stats, setStats] = useState<LifetimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await getLifetimeStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const initStats = useCallback(async (billCount: number, totalAmount: number) => {
    const initial: LifetimeStats = {
      ...DEFAULT_STATS,
      firstUsedDate: new Date().toISOString().split('T')[0],
      totalBillsWatched: billCount,
      totalAmountWatched: totalAmount,
    };
    await saveLifetimeStats(initial);
    setStats(initial);
  }, []);

  const incrementBillsWatched = useCallback(async (count: number, amount: number) => {
    const current = (await getLifetimeStats()) || DEFAULT_STATS;
    const updated: LifetimeStats = {
      ...current,
      totalBillsWatched: current.totalBillsWatched + count,
      totalAmountWatched: current.totalAmountWatched + amount,
    };
    await saveLifetimeStats(updated);
    setStats(updated);
  }, []);

  const incrementCyclesCompleted = useCallback(async () => {
    const current = (await getLifetimeStats()) || DEFAULT_STATS;
    const updated: LifetimeStats = {
      ...current,
      cyclesCompleted: current.cyclesCompleted + 1,
    };
    await saveLifetimeStats(updated);
    setStats(updated);
  }, []);

  const updateStreak = useCallback(async (remainingOnPayday: number) => {
    const current = (await getLifetimeStats()) || DEFAULT_STATS;
    let updated: LifetimeStats;
    if (remainingOnPayday > 0) {
      const newStreak = current.currentStreak + 1;
      updated = {
        ...current,
        currentStreak: newStreak,
        bestStreak: Math.max(current.bestStreak, newStreak),
      };
    } else {
      updated = {
        ...current,
        currentStreak: 0,
      };
    }
    await saveLifetimeStats(updated);
    setStats(updated);
  }, []);

  return { stats, loading, initStats, incrementBillsWatched, incrementCyclesCompleted, updateStreak, reload };
}
