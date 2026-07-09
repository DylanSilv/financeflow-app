import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface Transaction {
  id:            string;
  title:         string;
  amount:        number;
  date:          string;
  type:          'INCOME' | 'EXPENSE';
  paymentMethod: string;
  category?:     { id: string; name: string; color: string } | null;
  accountId?:    string | null;
}

interface State {
  transactions: Transaction[];
  loading:      boolean;
  error:        string | null;
  hasMore:      boolean;
}

interface UseTransactionData extends State {
  refetch:           () => void;
  loadMore:          () => void;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Pick<Transaction, 'title' | 'amount' | 'date' | 'type' | 'paymentMethod'>> & { categoryName?: string; categoryColor?: string }) => Promise<void>;
}

const TAKE = 50;

export function useTransactionData(
  filters: { search?: string; dateFrom?: string; dateTo?: string; accountId?: string; cardId?: string; type?: 'INCOME' | 'EXPENSE' } = {},
): UseTransactionData {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [hasMore,      setHasMore]      = useState(false);
  const [currentSkip,  setCurrentSkip]  = useState(0);

  const buildParams = useCallback((skip: number): Record<string, string> => {
    const p: Record<string, string> = { take: String(TAKE), skip: String(skip) };
    if (filters.search)    p['search']    = filters.search;
    if (filters.dateFrom)  p['dateFrom']  = filters.dateFrom;
    if (filters.dateTo)    p['dateTo']    = filters.dateTo;
    if (filters.accountId) p['accountId'] = filters.accountId;
    if (filters.cardId)    p['cardId']    = filters.cardId;
    if (filters.type)      p['type']      = filters.type;
    return p;
  }, [filters.search, filters.dateFrom, filters.dateTo, filters.accountId, filters.cardId, filters.type]);

  const doFetch = useCallback(async (skip: number, replace: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Transaction[]>('/transactions', { params: buildParams(skip) });
      setTransactions(prev => replace ? data : [...prev, ...data]);
      setHasMore(data.length === TAKE);
    } catch {
      setError('Error al cargar movimientos.');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    setCurrentSkip(0);
    doFetch(0, true);
  }, [doFetch]);

  const refetch = useCallback(() => {
    setCurrentSkip(0);
    doFetch(0, true);
  }, [doFetch]);

  const loadMore = useCallback(() => {
    const next = currentSkip + TAKE;
    setCurrentSkip(next);
    doFetch(next, false);
  }, [currentSkip, doFetch]);

  const deleteTransaction = useCallback(async (id: string) => {
    await api.delete(`/transactions/${id}`);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Parameters<UseTransactionData['updateTransaction']>[1]) => {
    const { data } = await api.patch<Transaction>(`/transactions/${id}`, updates);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  return { transactions, loading, error, hasMore, refetch, loadMore, deleteTransaction, updateTransaction };
}
