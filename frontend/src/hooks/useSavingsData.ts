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
  updateGoal: (id: string, data: { name?: string; targetAmount?: number; deadline?: string | null; color?: string }) => Promise<void>;
  addFunds:   (id: string, amount: number, accountId?: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
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

  const updateGoal = useCallback(async (id: string, data: { name?: string; targetAmount?: number; deadline?: string | null; color?: string }) => {
    const { data: updated } = await api.patch<SavingsGoal>(`/savings/${id}`, data);
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? updated : g),
    }));
  }, []);

  const addFunds = useCallback(async (id: string, amount: number, accountId?: string) => {
    const { data } = await api.patch<SavingsGoal>(`/savings/${id}/funds`, { amount, accountId });
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? data : g),
    }));
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await api.delete(`/savings/${id}`);
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
    }));
  }, []);

  return { ...state, refetch: fetchAll, updateGoal, addFunds, deleteGoal };
}
