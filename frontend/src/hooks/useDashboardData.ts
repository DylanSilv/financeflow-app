import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface BalanceTotal {
  balance:       number;
  totalIncome:   number;
  totalExpenses: number;
  monthIncome:   number;
  monthExpenses: number;
  monthBalance:  number;
}

export interface AccountBalance {
  id:                  string;
  name:                string;
  type:                'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT';
  color:               string | null;
  balance:             number;
  income:              number;
  expenses:            number;
  receivedThisMonth:   boolean | null;
  monthlyAmount:       number | null;
}

export interface CategoryExpense {
  name:       string;
  color:      string;
  total:      number;
  percentage: number;
}

export interface MonthlyEvolution {
  year:     number;
  month:    number;
  label:    string;
  income:   number;
  expenses: number;
  balance:  number;
}

export interface ActiveLoan {
  id:                string;
  name:              string;
  loanType:          'PERSONAL' | 'PURCHASE';
  originalAmount:    number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments:  number;
  remainingAmount:   number;
  progress:          number;
  endDate:           string | null;
  notes:             string | null;
}

export interface SavingsGoal {
  id:            string;
  name:          string;
  targetAmount:  number;
  currentAmount: number;
  deadline:      string | null;
  color:         string | null;
  progress:      number;
}

export interface DashboardData {
  balanceTotal:       BalanceTotal          | null;
  balanceCuentas:     AccountBalance[]       | null;
  gastosCategorias:   { categories: CategoryExpense[]; total: number } | null;
  evolucion:          MonthlyEvolution[]     | null;
  prestamos:          ActiveLoan[]           | null;
  ahorros:            SavingsGoal[]          | null;
  loading:            boolean;
  error:              string | null;
  refetch:            () => void;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, 'refetch'>>({
    balanceTotal:     null,
    balanceCuentas:   null,
    gastosCategorias: null,
    evolucion:        null,
    prestamos:        null,
    ahorros:          null,
    loading:          true,
    error:            null,
  });

  const fetchAll = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    const results = await Promise.allSettled([
      supabase.rpc('get_balance_total'),
      supabase.rpc('get_balance_por_cuenta'),
      supabase.rpc('get_gastos_por_categoria'),
      supabase.rpc('get_evolucion_patrimonial'),
      supabase.from('Loan').select('*').eq('status', 'ACTIVE').order('name'),
      supabase.from('SavingsGoal').select('*').order('name'),
    ]);

    const [rBT, rBC, rGC, rEP, rL, rA] = results.map(r =>
      r.status === 'fulfilled' ? r.value.data : null,
    );

    const anyFailed = results.some(r => r.status === 'rejected');

    // Mapear préstamos activos
    const prestamos: ActiveLoan[] | null = rL
      ? (rL as any[]).map((l: any) => ({
          id:                l.id,
          name:              l.name,
          loanType:          l.loanType,
          originalAmount:    Number(l.originalAmount),
          installmentAmount: Number(l.installmentAmount),
          totalInstallments: l.totalInstallments,
          paidInstallments:  l.paidInstallments,
          remainingAmount:   Math.max(Number(l.originalAmount) - Number(l.installmentAmount) * l.paidInstallments, 0),
          progress:          l.totalInstallments > 0 ? Math.round((l.paidInstallments / l.totalInstallments) * 100) : 0,
          endDate:           l.endDate ?? null,
          notes:             l.notes   ?? null,
        }))
      : null;

    // Mapear metas de ahorro
    const ahorros: SavingsGoal[] | null = rA
      ? (rA as any[]).map((g: any) => ({
          id:            g.id,
          name:          g.name,
          targetAmount:  Number(g.targetAmount),
          currentAmount: Number(g.currentAmount),
          deadline:      g.deadline ?? null,
          color:         g.color    ?? null,
          progress:      Number(g.targetAmount) > 0
            ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
            : 0,
        }))
      : null;

    setData({
      balanceTotal:     rBT as BalanceTotal | null,
      balanceCuentas:   rBC as AccountBalance[] | null,
      gastosCategorias: rGC as { categories: CategoryExpense[]; total: number } | null,
      evolucion:        rEP as MonthlyEvolution[] | null,
      prestamos,
      ahorros,
      loading:          false,
      error:            anyFailed ? 'Algunos datos no pudieron cargarse.' : null,
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { ...data, refetch: fetchAll };
}
