import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface CreditCardOption {
  id: string;
  name: string;
}

/** Tarjetas de crédito, para filtrar el historial por tarjeta. */
export function useCreditCards() {
  const [cards, setCards] = useState<CreditCardOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('Card')
      .select('id, name')
      .eq('type', 'CREDIT')
      .order('name')
      .then(
        ({ data }) => {
          if (!cancelled) setCards((data ?? []) as CreditCardOption[]);
        },
        () => {},
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return cards;
}
