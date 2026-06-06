import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface Transaction {
  id:            string;
  title:         string;
  amount:        number;
  date:          string;
  type:          'INCOME' | 'EXPENSE';
  paymentMethod: string;
  category?:     { name: string; color: string } | null;
}

interface State {
  transactions: Transaction[];
  loading:      boolean;
  error:        string | null;
}

interface UseTransactionData extends State {
  refetch:           () => void;
  deleteTransaction: (id: string) => Promise<void>;
}

export function useTransactionData(
  filters: { type?: string; search?: string } = {},
): UseTransactionData {
  const [state, setState] = useState<State>({
    transactions: [],
    loading:      true,
    error:        null,
  });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params: Record<string, string> = { take: '200' };
      if (filters.type && filters.type !== 'ALL') params['type'] = filters.type;
      if (filters.search) params['search'] = filters.search;

      const { data } = await api.get<Transaction[]>('/transactions', { params });
      setState({ transactions: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar movimientos.' }));
    }
  }, [filters.type, filters.search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteTransaction = useCallback(async (id: string) => {
    await api.delete(`/transactions/${id}`);
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  }, []);

  return { ...state, refetch: fetchAll, deleteTransaction };
}
