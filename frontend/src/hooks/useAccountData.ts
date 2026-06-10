import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface Account {
  id:             string;
  name:           string;
  type:           'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT';
  color:          string | null;
  initialBalance: number;
  balance:        number;
}

interface State {
  accounts: Account[];
  loading:  boolean;
  error:    string | null;
}

interface UseAccountData extends State {
  refetch:       () => void;
  deleteAccount: (id: string) => Promise<void>;
}

export function useAccountData(): UseAccountData {
  const [state, setState] = useState<State>({ accounts: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data } = await api.get<Account[]>('/accounts');
      setState({ accounts: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar cuentas.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteAccount = useCallback(async (id: string) => {
    await api.delete(`/accounts/${id}`);
    setState(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id) }));
  }, []);

  return { ...state, refetch: fetchAll, deleteAccount };
}
