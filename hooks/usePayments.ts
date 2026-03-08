import { useState, useEffect, useCallback } from 'react';
import { Payment } from '../types/payment';
import {
  getPayments,
  savePayments,
  addPayment as persistAdd,
  removePayment as persistRemove,
} from '../utils/storage';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPayment = useCallback(async (payment: Payment) => {
    await persistAdd(payment);
    setPayments((prev) => [...prev, payment]);
  }, []);

  const removePayment = useCallback(async (id: string) => {
    await persistRemove(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePayment = useCallback(async (updated: Payment) => {
    setPayments((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      savePayments(next);
      return next;
    });
  }, []);

  const clearPayments = useCallback(async () => {
    await savePayments([]);
    setPayments([]);
  }, []);

  return { payments, loading, addPayment, removePayment, updatePayment, clearPayments, reload };
}
