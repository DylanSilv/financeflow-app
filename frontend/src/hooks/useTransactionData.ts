import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  updateTransaction: (id: string, updates: Partial<Pick<Transaction, 'title' | 'amount' | 'date' | 'type' | 'paymentMethod'>> & { categoryId?: string | null }) => Promise<void>;
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

  const buildQuery = useCallback((skip: number) => {
    let q = supabase
      .from('Transaction')
      .select('id, title, amount, date, type, paymentMethod, accountId, category:Category(id, name, color)')
      .order('date', { ascending: false })
      .range(skip, skip + TAKE - 1);

    if (filters.type)      q = q.eq('type', filters.type);
    if (filters.accountId) q = q.eq('accountId', filters.accountId);
    if (filters.cardId)    q = q.eq('cardId', filters.cardId);
    if (filters.dateFrom)  q = q.gte('date', filters.dateFrom);
    if (filters.dateTo)    q = q.lte('date', filters.dateTo);
    if (filters.search)    q = q.ilike('title', `%${filters.search}%`);
    return q;
  }, [filters.search, filters.dateFrom, filters.dateTo, filters.accountId, filters.cardId, filters.type]); // eslint-disable-line

  const doFetch = useCallback(async (skip: number, replace: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await buildQuery(skip);
      if (err) throw err;

      const rows: Transaction[] = (data ?? []).map((t: any) => ({
        id:            t.id,
        title:         t.title,
        amount:        Number(t.amount),
        date:          t.date,
        type:          t.type,
        paymentMethod: t.paymentMethod,
        category:      t.category ?? null,
        accountId:     t.accountId ?? null,
      }));

      setTransactions(prev => replace ? rows : [...prev, ...rows]);
      setHasMore(rows.length === TAKE);
    } catch (err) {
      console.error('carga de movimientos falló:', err);
      setError('Error al cargar movimientos.');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    setCurrentSkip(0);
    doFetch(0, true);
  }, [doFetch]);

  const refetch  = useCallback(() => { setCurrentSkip(0); doFetch(0, true); }, [doFetch]);
  const loadMore = useCallback(() => {
    const next = currentSkip + TAKE;
    setCurrentSkip(next);
    doFetch(next, false);
  }, [currentSkip, doFetch]);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.rpc('delete_transaction', { p_tx_id: id });
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Parameters<UseTransactionData['updateTransaction']>[1]) => {
    const { error: err } = await supabase
      .from('Transaction')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (err) throw err;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  return { transactions, loading, error, hasMore, refetch, loadMore, deleteTransaction, updateTransaction };
}
