import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface CardTransaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
}

interface Options {
  /** Sólo se consulta cuando el historial está desplegado. */
  enabled: boolean;
  cardId?: string;
  accountId?: string | null;
}

/**
 * Últimos movimientos de una tarjeta. Las de crédito se consultan por cardId
 * y sólo gastos; las de débito, por la cuenta asociada y en ambos sentidos.
 */
export function useCardTransactions({ enabled, cardId, accountId }: Options) {
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (!cardId && !accountId) return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        let query = supabase
          .from('Transaction')
          .select('id, title, amount, date, type')
          .order('date', { ascending: false })
          .limit(8);

        query = cardId
          ? query.eq('cardId', cardId).eq('type', 'EXPENSE')
          : query.eq('accountId', accountId!);

        const { data } = await query;
        if (!cancelled) {
          setTransactions(
            (data ?? []).map(t => ({ ...t, amount: Number(t.amount) })) as CardTransaction[],
          );
        }
      } catch (err) {
        console.error('carga de movimientos de la tarjeta falló:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, cardId, accountId]);

  return { transactions, loading };
}
