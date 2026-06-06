import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface Loan {
  id:                string;
  name:              string;
  loanType:          'PERSONAL' | 'PURCHASE';
  status:            'ACTIVE' | 'PAID' | 'CANCELLED';
  originalAmount:    number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments:  number;
  remainingAmount:   number;
  progress:          number;
  startDate:         string | null;
  endDate:           string | null;
  notes:             string | null;
}

interface State { loans: Loan[]; loading: boolean; error: string | null; }

interface UseLoanData extends State {
  refetch:        () => void;
  payInstallment: (id: string, accountId?: string) => Promise<void>;
}

export function useLoanData(status?: 'ACTIVE' | 'PAID'): UseLoanData {
  const [state, setState] = useState<State>({ loans: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = status ? { status } : {};
      const { data } = await api.get<Loan[]>('/loans', { params });
      setState({ loans: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar préstamos.' }));
    }
  }, [status]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const payInstallment = useCallback(async (id: string, accountId?: string) => {
    const { data } = await api.post<Loan>(`/loans/${id}/pay`, { accountId });
    setState(prev => ({
      ...prev,
      loans: prev.loans.map(l => l.id === id ? { ...l, ...data } : l),
    }));
  }, []);

  return { ...state, refetch: fetchAll, payInstallment };
}
