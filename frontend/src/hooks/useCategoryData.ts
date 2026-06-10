import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

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
      const { data } = await api.get<Category[]>('/categories');
      setState({ categories: data, loading: false, error: null });
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Error al cargar categorías.' }));
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteCategory = useCallback(async (id: string) => {
    await api.delete(`/categories/${id}`);
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, []);

  return { ...state, refetch: fetchAll, deleteCategory };
}
