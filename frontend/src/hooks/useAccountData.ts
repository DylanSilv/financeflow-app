import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
      const { data, error } = await supabase.rpc('get_balance_por_cuenta');
      if (error) throw error;

      const accounts = ((data as any[]) ?? []).map((a: any) => ({
        id:             a.id,
        name:           a.name,
        type:           a.type,
        color:          a.color ?? null,
        initialBalance: 0, // balance por cuenta no expone initialBalance; se carga bajo demanda
        balance:        Number(a.balance),
      }));

      // Enriquecer con initialBalance para el modal de edición
      const { data: rawAccounts } = await supabase
        .from('Account')
        .select('id, initialBalance')
        .eq('isArchived', false);

      const initMap = new Map<string, number>(
        (rawAccounts ?? []).map(a => [a.id, Number(a.initialBalance ?? 0)]),
      );

      setState({
        accounts: accounts.map(a => ({ ...a, initialBalance: initMap.get(a.id) ?? 0 })),
        loading:  false,
        error:    null,
      });
    } catch (err) {
      console.error('carga de cuentas falló:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar cuentas.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteAccount = useCallback(async (id: string) => {
    await supabase.from('Account').update({ isArchived: true }).eq('id', id);
    setState(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id) }));
  }, []);

  return { ...state, refetch: fetchAll, deleteAccount };
}
