import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Category {
  id:               string;
  name:             string;
  color:            string | null;
  icon:             string | null;
  transactionCount: number;
}

interface State {
  categories: Category[];
  loading:    boolean;
  error:      string | null;
}

export function useCategoryData() {
  const [state, setState] = useState<State>({ categories: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('Category')
        .select('id, name, color, icon, transactions:Transaction(count)')
        .order('name');
      if (error) throw error;

      const categories: Category[] = (data ?? []).map((c: any) => ({
        id:               c.id,
        name:             c.name,
        color:            c.color ?? null,
        icon:             c.icon ?? null,
        transactionCount: c.transactions?.[0]?.count ?? 0,
      }));

      setState({ categories, loading: false, error: null });
    } catch (err) {
      console.error('carga de categorías falló:', err);
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar categorías.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('Category').delete().eq('id', id);
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, []);

  return { ...state, refetch: fetchAll, deleteCategory };
}
