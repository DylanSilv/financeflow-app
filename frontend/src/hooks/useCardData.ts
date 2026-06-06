import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

export interface Card {
  id:             string;
  name:           string;
  type:           'CREDIT' | 'DEBIT';
  brand:          string;
  lastFourDigits: string;
  color:          string;
  limit:          number;
  balance:        number;
  accountId:      string | null;
}

interface State {
  cards:   Card[];
  loading: boolean;
  error:   string | null;
}

interface UseCardData extends State {
  refetch:    () => void;
  deleteCard: (id: string) => Promise<void>;
}

export function useCardData(): UseCardData {
  const [state, setState] = useState<State>({ cards: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data } = await api.get<Card[]>('/cards');
      setState({ cards: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar tarjetas.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteCard = useCallback(async (id: string) => {
    await api.delete(`/cards/${id}`);
    setState(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== id),
    }));
  }, []);

  return { ...state, refetch: fetchAll, deleteCard };
}
