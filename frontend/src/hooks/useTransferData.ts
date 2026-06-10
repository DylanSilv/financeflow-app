import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Transfer[]>('/transfers');
      setTransfers(data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createTransfer = useCallback(async (data: Parameters<UseTransferData['createTransfer']>[0]) => {
    const { data: t } = await api.post<Transfer>('/transfers', data);
    setTransfers(prev => [t, ...prev]);
  }, []);

  const deleteTransfer = useCallback(async (id: string) => {
    await api.delete(`/transfers/${id}`);
    setTransfers(prev => prev.filter(t => t.id !== id));
  }, []);

  return { transfers, loading, createTransfer, deleteTransfer, refetch: fetchAll };
}
