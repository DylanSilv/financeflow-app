import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Card {
  id:             string;
  name:           string;
  type:           'CREDIT' | 'DEBIT';
  brand:          string;
  lastFourDigits: string;
  color:          string;
  limit:          number;
  balance:        number;
  balanceUsed:    number;
  accountId:      string | null;
  statementDay:   number | null;
  dueDay:         number | null;
}

interface State {
  cards:   Card[];
  loading: boolean;
  error:   string | null;
}

interface UseCardData extends State {
  refetch:    () => void;
  deleteCard: (id: string) => Promise<void>;
  updateCard: (id: string, data: Partial<Pick<Card, 'name' | 'brand' | 'lastFourDigits' | 'color' | 'limit' | 'accountId' | 'statementDay' | 'dueDay'>>) => Promise<void>;
}

export function useCardData(): UseCardData {
  const [state, setState] = useState<State>({ cards: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.rpc('get_cards');
      if (error) throw error;

      const cards: Card[] = ((data as any[]) ?? []).map((c: any) => ({
        id:             c.id,
        name:           c.name,
        type:           c.type,
        brand:          c.brand ?? 'VISA',
        lastFourDigits: c.lastFourDigits ?? '0000',
        color:          c.color ?? 'from-zinc-900 to-zinc-700',
        limit:          Number(c.limit ?? 0),
        balance:        Number(c.balance ?? 0),
        balanceUsed:    Number(c.balanceUsed ?? 0),
        accountId:      c.accountId ?? null,
        statementDay:   c.statementDay ?? null,
        dueDay:         c.dueDay ?? null,
      }));

      setState({ cards, loading: false, error: null });
    } catch (err) {
      console.error('carga de tarjetas falló:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar tarjetas.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteCard = useCallback(async (id: string) => {
    await supabase.from('Card').delete().eq('id', id);
    setState(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== id) }));
  }, []);

  const updateCard = useCallback(async (id: string, data: object) => {
    await supabase.from('Card').update(data).eq('id', id);
    await fetchAll();
  }, [fetchAll]);

  return { ...state, refetch: fetchAll, deleteCard, updateCard };
}
