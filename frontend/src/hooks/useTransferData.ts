import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export interface Transfer {
  id:            string;
  amount:        number;
  date:          string;
  description:   string | null;
  fromAccountId: string;
  toAccountId:   string;
  fromName:      string;
  toName:        string;
}

interface State { transfers: Transfer[]; loading: boolean; }

interface UseTransferData extends State {
  createTransfer: (data: { fromAccountId: string; toAccountId: string; amount: number; date?: string; description?: string }) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
  refetch:        () => void;
}

export function useTransferData(): UseTransferData {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const user = useAuthStore(s => s.user);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('Transfer')
        .select(`
          id, amount, date, description, fromAccountId, toAccountId,
          fromAccount:Account!fromAccountId(name),
          toAccount:Account!toAccountId(name)
        `)
        .order('date', { ascending: false })
        .limit(100);

      setTransfers(
        (data ?? []).map((t: any) => ({
          id:            t.id,
          amount:        Number(t.amount),
          date:          t.date,
          description:   t.description ?? null,
          fromAccountId: t.fromAccountId,
          toAccountId:   t.toAccountId,
          fromName:      t.fromAccount?.name ?? '',
          toName:        t.toAccount?.name   ?? '',
        })),
      );
    } catch (err) { console.error('carga de transferencias falló:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createTransfer = useCallback(async (input: Parameters<UseTransferData['createTransfer']>[0]) => {
    if (!user) throw new Error('Usuario no autenticado');
    const { error } = await supabase.from('Transfer').insert({
      amount:        input.amount,
      date:          input.date ? new Date(input.date).toISOString() : new Date().toISOString(),
      description:   input.description?.trim() || null,
      fromAccountId: input.fromAccountId,
      toAccountId:   input.toAccountId,
      userId:        user.id,
    });
    if (error) throw error;
    await fetchAll();
  }, [user, fetchAll]);

  const deleteTransfer = useCallback(async (id: string) => {
    await supabase.from('Transfer').delete().eq('id', id);
    setTransfers(prev => prev.filter(t => t.id !== id));
  }, []);

  return { transfers, loading, createTransfer, deleteTransfer, refetch: fetchAll };
}
