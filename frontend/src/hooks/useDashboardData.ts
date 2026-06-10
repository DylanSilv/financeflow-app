import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

// ─── Types ───────────────────────────────────────────────────

export interface BalanceTotal {
  balance:       number;
  totalIncome:   number;
  totalExpenses: number;
  monthIncome:   number;
  monthExpenses: number;
  monthBalance:  number;
}

export interface AccountBalance {
  id:       string;
  name:     string;
  type:               'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT';
  color:              string | null;
  balance:            number;
  income:             number;
  expenses:           number;
  receivedThisMonth:  boolean | null;
  monthlyAmount:      number | null;
}

export interface CategoryExpense {
  name:       string;
  color:      string;
  total:      number;
  percentage: number;
}

export interface MonthlyIncome {
  year:  number;
  month: number;
  label: string;
  total: number;
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

// ─── Hook ────────────────────────────────────────────────────

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

    const endpoints = [
      '/dashboard/balance-total',
      '/dashboard/balance-cuentas',
      '/dashboard/gastos-categoria',
      '/dashboard/evolucion',
      '/dashboard/prestamos',
      '/dashboard/ahorros',
    ] as const;

    const results = await Promise.allSettled(endpoints.map(ep => api.get(ep)));

    const [rt, rc, rg, re, rp, ra] = results.map(r =>
      r.status === 'fulfilled' ? r.value.data : null,
    );

    const anyFailed = results.some(r => r.status === 'rejected');

    setData({
      balanceTotal:     rt,
      balanceCuentas:   rc,
      gastosCategorias: rg,
      evolucion:        re,
      prestamos:        rp,
      ahorros:          ra,
      loading:          false,
      error:            anyFailed ? 'Algunos datos no pudieron cargarse.' : null,
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { ...data, refetch: fetchAll };
}
