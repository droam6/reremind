export interface CycleRecord {
  id: string;
  cycleEndDate: string;
  incomeAmount: number;
  totalCommitted: number;
  remainingOnPayday: number;
  paymentsCovered: number;
  totalPayments: number;
  createdAt: string;
}

export interface LifetimeStats {
  totalBillsWatched: number;
  totalAmountWatched: number;
  cyclesCompleted: number;
  firstUsedDate: string;
  currentStreak: number;
  bestStreak: number;
}
