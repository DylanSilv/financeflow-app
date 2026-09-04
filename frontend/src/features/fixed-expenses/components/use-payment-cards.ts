import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export interface PaymentCard {
  id: string;
  name: string;
  balance: number;
  /** Clases de gradiente de Tailwind, igual que en la pantalla de tarjetas. */
  color: string;
  accountId: string | null;
}

/** Tarjetas disponibles como origen de pago de una cuenta fija. */
export function usePaymentCards() {
  const [cards, setCards] = useState<PaymentCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('get_cards').then(
      ({ data }) => {
        if (!cancelled) setCards((data as PaymentCard[]) ?? []);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return cards;
}
