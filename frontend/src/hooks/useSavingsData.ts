import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface SavingsGoal {
  id:            string;
  name:          string;
  targetAmount:  number;
  currentAmount: number;
  deadline:      string | null;
  color:         string | null;
  progress:      number | null; // null = sin objetivo definido
}

interface State {
  goals:   SavingsGoal[];
  loading: boolean;
  error:   string | null;
}

interface UseSavingsData extends State {
  refetch:    () => void;
  addFunds:   (id: string, amount: number) => Promise<void>;
}

export function useSavingsData(): UseSavingsData {
  const [state, setState] = useState<State>({ goals: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data } = await api.get<SavingsGoal[]>('/savings');
      setState({ goals: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar metas de ahorro.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addFunds = useCallback(async (id: string, amount: number) => {
    const { data } = await api.patch<SavingsGoal>(`/savings/${id}/funds`, { amount });
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? data : g),
    }));
  }, []);

  return { ...state, refetch: fetchAll, addFunds };
}
