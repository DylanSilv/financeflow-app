import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  markAsPaid:     (id: string, accountId?: string) => Promise<void>;
  toggleAutoPay:  (id: string) => Promise<void>;
  deleteExpense:  (id: string) => Promise<void>;
  runAutoPay:     () => Promise<{ paid: { id: string; name: string; amount: number }[]; count: number }>;
}

function sameYearMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function effectiveStatus(
  status: string,
  lastPaidAt: string | null,
  loanStatus?: string | null,
): 'PENDING' | 'PAID' | 'OVERDUE' {
  if (status !== 'PAID') return status as any;
  if (loanStatus === 'PAID') return 'PAID';
  if (!lastPaidAt) return 'PAID';
  return sameYearMonth(new Date(lastPaidAt), new Date()) ? 'PAID' : 'PENDING';
}

export function useFixedExpenseData(): UseFixedExpenseData {
  const [state, setState] = useState<State>({ expenses: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('FixedExpense')
        .select(`
          id, name, amount, dueDate, autoPay, accountId, status, lastPaidAt, loanId,
          loan:Loan(name, status, paidInstallments, totalInstallments, installmentAmount)
        `)
        .order('dueDate', { ascending: true });

      if (error) throw error;

      const expenses: FixedExpense[] = (data ?? []).map((e: any) => ({
        id:                e.id,
        name:              e.name,
        amount:            Number(e.amount),
        dueDate:           e.dueDate,
        autoPay:           e.autoPay,
        accountId:         e.accountId ?? null,
        status:            effectiveStatus(e.status, e.lastPaidAt, e.loan?.status),
        lastPaidAt:        e.lastPaidAt ?? null,
        loanId:            e.loanId ?? null,
        loanName:          e.loan?.name ?? null,
        paidInstallments:  e.loan?.paidInstallments  ?? null,
        totalInstallments: e.loan?.totalInstallments ?? null,
        installmentAmount: e.loan ? Number(e.loan.installmentAmount) : null,
      }));

      setState({ expenses, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar gastos fijos.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateExpense = useCallback(async (id: string, data: Parameters<UseFixedExpenseData['updateExpense']>[1]) => {
    const { error } = await supabase.from('FixedExpense').update(data).eq('id', id);
    if (error) throw error;
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...data } : e),
    }));
  }, []);

  const markAsPaid = useCallback(async (id: string, accountId?: string) => {
    const { error } = await supabase.rpc('mark_expense_paid', {
      p_expense_id: id,
      p_account_id: accountId ?? null,
    });
    if (error) throw error;
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id
        ? { ...e, status: 'PAID', lastPaidAt: new Date().toISOString() }
        : e,
      ),
    }));
  }, []);

  const toggleAutoPay = useCallback(async (id: string) => {
    const expense = state.expenses.find(e => e.id === id);
    if (!expense) return;
    const newVal = !expense.autoPay;
    const { error } = await supabase.from('FixedExpense').update({ autoPay: newVal }).eq('id', id);
    if (error) throw error;
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, autoPay: newVal } : e),
    }));
  }, [state.expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const expense = state.expenses.find(e => e.id === id);
    await supabase.from('FixedExpense').delete().eq('id', id);
    if (expense?.loanId) {
      const { data: hasTx } = await supabase
        .from('Transaction')
        .select('id', { count: 'exact', head: true })
        .eq('loanId', expense.loanId);
      if (!(hasTx as any)?.length) {
        await supabase.from('Loan').delete().eq('id', expense.loanId);
      }
    }
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, [state.expenses]);

  const runAutoPay = useCallback(async () => {
    const { data, error } = await supabase.rpc('run_autopay');
    if (error) throw error;
    await fetchAll();
    return data as { paid: { id: string; name: string; amount: number }[]; count: number };
  }, [fetchAll]);

  return { ...state, refetch: fetchAll, updateExpense, markAsPaid, toggleAutoPay, deleteExpense, runAutoPay };
}
