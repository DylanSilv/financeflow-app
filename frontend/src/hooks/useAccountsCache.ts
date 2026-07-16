import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AccountOption { id: string; name: string; type: string; }

let _cache: AccountOption[] | null = null;
let _lastFetch = 0;
const CACHE_TTL = 2 * 60 * 1000;

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
    void (async () => {
      try {
        const { data } = await supabase
          .from('Account')
          .select('id, name, type')
          .eq('isArchived', false)
          .order('name');
        _cache     = (data ?? []) as AccountOption[];
        _lastFetch = Date.now();
        setAccounts(_cache);
      } catch { /* silencioso */ } finally { setLoading(false); }
    })();
  }, []);

  return { accounts, loading };
}
