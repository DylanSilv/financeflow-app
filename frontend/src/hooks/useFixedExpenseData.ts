import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface FixedExpense {
  id:                string;
  name:              string;
  amount:            number;
  dueDate:           number;
  autoPay:           boolean;
  accountId:         string | null;
  status:            'PENDING' | 'PAID' | 'OVERDUE';
  lastPaidAt:        string | null;
  loanId:            string | null;
  loanName:          string | null;
  paidInstallments:  number | null;
  totalInstallments: number | null;
  installmentAmount: number | null;
}

interface State {
  expenses: FixedExpense[];
  loading:  boolean;
  error:    string | null;
}

interface UseFixedExpenseData extends State {
  refetch:        () => void;
  updateExpense:  (id: string, data: { name?: string; amount?: number; dueDate?: number; autoPay?: boolean; accountId?: string | null }) => Promise<void>;
  markAsPaid:     (id: string) => Promise<void>;
  toggleAutoPay:  (id: string) => Promise<void>;
  deleteExpense:  (id: string) => Promise<void>;
}

export function useFixedExpenseData(): UseFixedExpenseData {
  const [state, setState] = useState<State>({ expenses: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data } = await api.get<FixedExpense[]>('/fixed-expenses');
      setState({ expenses: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar gastos fijos.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateExpense = useCallback(async (id: string, data: { name?: string; amount?: number; dueDate?: number; autoPay?: boolean; accountId?: string | null }) => {
    const { data: updated } = await api.patch<FixedExpense>(`/fixed-expenses/${id}`, data);
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updated } : e),
    }));
  }, []);

  const markAsPaid = useCallback(async (id: string) => {
    const { data } = await api.patch<FixedExpense>(`/fixed-expenses/${id}/pay`);
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, status: data.status } : e),
    }));
  }, []);

  const toggleAutoPay = useCallback(async (id: string) => {
    const { data } = await api.patch<FixedExpense>(`/fixed-expenses/${id}/autopay`);
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, autoPay: data.autoPay } : e),
    }));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await api.delete(`/fixed-expenses/${id}`);
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  }, []);

  return { ...state, refetch: fetchAll, updateExpense, markAsPaid, toggleAutoPay, deleteExpense };
}
