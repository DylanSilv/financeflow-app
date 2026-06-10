import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

export interface AccountOption { id: string; name: string; type: string; }

// Caché de módulo compartida entre todos los componentes que usan esta hook
let _cache: AccountOption[] | null = null;
let _lastFetch = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

export function invalidateAccountsCache() {
  _cache = null;
  _lastFetch = 0;
}

export function useAccountsCache() {
  const [accounts, setAccounts] = useState<AccountOption[]>(_cache ?? []);
  const [loading,  setLoading]  = useState(!_cache);

  useEffect(() => {
    if (_cache && Date.now() - _lastFetch < CACHE_TTL) {
      setAccounts(_cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get<AccountOption[]>('/accounts')
      .then(r => {
        _cache      = r.data;
        _lastFetch  = Date.now();
        setAccounts(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading };
}
