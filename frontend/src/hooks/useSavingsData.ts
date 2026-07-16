import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SavingsGoal {
  id:            string;
  name:          string;
  targetAmount:  number;
  currentAmount: number;
  deadline:      string | null;
  color:         string | null;
  progress:      number | null;
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

function mapGoal(g: any): SavingsGoal {
  const target  = Number(g.targetAmount);
  const current = Number(g.currentAmount);
  return {
    id:            g.id,
    name:          g.name,
    targetAmount:  target,
    currentAmount: current,
    deadline:      g.deadline ?? null,
    color:         g.color    ?? null,
    progress:      target > 0 ? Math.round((current / target) * 100) : null,
  };
}

export function useSavingsData(): UseSavingsData {
  const [state, setState] = useState<State>({ goals: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('SavingsGoal')
        .select('*')
        .order('name');
      if (error) throw error;
      setState({ goals: (data ?? []).map(mapGoal), loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar metas de ahorro.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateGoal = useCallback(async (id: string, data: { name?: string; targetAmount?: number; deadline?: string | null; color?: string }) => {
    const { error } = await supabase.from('SavingsGoal').update(data).eq('id', id);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const addFunds = useCallback(async (id: string, amount: number, accountId?: string) => {
    const { data, error } = await supabase.rpc('add_funds_to_goal', {
      p_goal_id:    id,
      p_amount:     amount,
      p_account_id: accountId ?? null,
    });
    if (error) throw error;
    const updated = data as any;
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id
        ? { ...g, currentAmount: Number(updated.currentAmount), progress: updated.progress }
        : g,
      ),
    }));
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await supabase.from('SavingsGoal').delete().eq('id', id);
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }, []);

  return { ...state, refetch: fetchAll, updateGoal, addFunds, deleteGoal };
}
