import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { outstandingPrincipal, remainingPayments } from '@/lib/loanMath';

export interface Loan {
  id:                string;
  name:              string;
  loanType:          'PERSONAL' | 'PURCHASE';
  status:            'ACTIVE' | 'PAID' | 'CANCELLED';
  /** Con tasa: capital prestado. Sin tasa: total a pagar. Ver lib/loanMath. */
  originalAmount:    number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments:  number;
  /** Nominal anual en %. Null si es una compra en cuotas sin interés. */
  interestRate:      number | null;
  /** Lo que falta desembolsar: cuota × cuotas restantes. Siempre aplica. */
  remainingPayments: number;
  /** Lo que costaría cancelar hoy. Null si el préstamo no tiene interés. */
  principalBalance:  number | null;
  progress:          number;
  paidThisMonth:     boolean;
  startDate:         string | null;
  endDate:           string | null;
  notes:             string | null;
}

interface State { loans: Loan[]; loading: boolean; error: string | null; }

interface UseLoanData extends State {
  refetch:        () => void;
  createLoan:     (data: CreateLoanInput) => Promise<void>;
  updateLoan:     (id: string, data: { name: string; notes?: string }) => Promise<void>;
  payInstallment: (id: string, accountId?: string) => Promise<void>;
  deleteLoan:     (id: string) => Promise<void>;
}

export interface CreateLoanInput {
  name:              string;
  /** Con tasa: capital prestado. Sin tasa: total a pagar. */
  originalAmount:    number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments:  number;
  /** Nominal anual en %, o null si es una compra en cuotas sin interés. */
  interestRate?:     number | null;
  startDate?:        string;
  notes?:            string;
}

function mapLoan(l: any, paidThisMonthIds: Set<string>): Loan {
  const paid    = l.paidInstallments;
  const total   = l.totalInstallments;
  const capital = Number(l.originalAmount);
  const cuota   = Number(l.installmentAmount);
  const tasa    = l.interestRate != null ? Number(l.interestRate) : null;

  return {
    id:                l.id,
    name:              l.name,
    loanType:          l.loanType,
    status:            l.status,
    originalAmount:    capital,
    installmentAmount: cuota,
    totalInstallments: total,
    paidInstallments:  paid,
    interestRate:      tasa,
    // Los dos saldos se derivan siempre del cronograma, así que no dependen de
    // que `currentBalance` esté actualizado ni de que se haya pagado por la app.
    remainingPayments: remainingPayments(cuota, total, paid),
    principalBalance:  outstandingPrincipal(capital, cuota, paid, tasa),
    progress:          total > 0 ? Math.round((paid / total) * 100) : 0,
    paidThisMonth:     paidThisMonthIds.has(l.id),
    startDate:         l.startDate ?? null,
    endDate:           l.endDate   ?? null,
    notes:             l.notes     ?? null,
  };
}

export function useLoanData(statusFilter?: 'ACTIVE' | 'PAID'): UseLoanData {
  const [state, setState] = useState<State>({ loans: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      let q = supabase.from('Loan').select('*').order('name');
      if (statusFilter) q = q.eq('status', statusFilter);

      const [{ data: loans, error: lErr }, { data: txs, error: tErr }] = await Promise.all([
        q,
        supabase
          .from('Transaction')
          .select('loanId')
          .not('loanId', 'is', null)
          .gte('date', monthStart)
          .lte('date', monthEnd),
      ]);

      if (lErr) throw lErr;
      if (tErr) throw tErr;

      const paidSet = new Set((txs ?? []).map((t: any) => t.loanId as string));
      setState({
        loans:   (loans ?? []).map((l: any) => mapLoan(l, paidSet)),
        loading: false,
        error:   null,
      });
    } catch (err) {
      console.error('carga de préstamos falló:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar préstamos.' }));
    }
  }, [statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const payInstallment = useCallback(async (id: string, accountId?: string) => {
    const { data, error } = await supabase.rpc('pay_loan_installment', {
      p_loan_id:    id,
      p_account_id: accountId ?? null,
    });
    if (error) throw error;
    const updated = data as any;
    setState(prev => ({
      ...prev,
      loans: prev.loans.map(l => l.id === id
        ? {
            ...l,
            paidInstallments:  updated.paidInstallments,
            status:            updated.status,
            // Recalculamos con la misma función que en la carga, en vez de leer
            // lo que devuelve el RPC, para que ambos caminos den siempre igual.
            remainingPayments: remainingPayments(l.installmentAmount, l.totalInstallments, updated.paidInstallments),
            principalBalance:  outstandingPrincipal(l.originalAmount, l.installmentAmount, updated.paidInstallments, l.interestRate),
            progress:          Number(updated.progress),
          }
        : l,
      ),
    }));
  }, []);

  const updateLoan = useCallback(async (id: string, data: { name: string; notes?: string }) => {
    const { error } = await supabase.from('Loan').update(data).eq('id', id);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const deleteLoan = useCallback(async (id: string) => {
    await supabase.from('Loan').delete().eq('id', id);
    setState(prev => ({ ...prev, loans: prev.loans.filter(l => l.id !== id) }));
  }, []);

  const createLoan = useCallback(async (data: CreateLoanInput) => {
    const { data: user } = await supabase.from('User').select('id').single();
    const paid  = data.paidInstallments;
    const total = data.totalInstallments;
    const { error } = await supabase.from('Loan').insert({
      name:              data.name,
      loanType:          'PERSONAL',
      status:            paid >= total ? 'PAID' : 'ACTIVE',
      originalAmount:    data.originalAmount,
      installmentAmount: data.installmentAmount,
      totalInstallments: total,
      paidInstallments:  paid,
      interestRate:      data.interestRate ?? null,
      startDate:         data.startDate ?? null,
      notes:             data.notes?.trim() || null,
      userId:            (user as any)?.id,
    });
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  return { ...state, refetch: fetchAll, createLoan, updateLoan, payInstallment, deleteLoan };
}
