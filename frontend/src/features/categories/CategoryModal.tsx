import React, { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorSwatches, type Swatch } from '@/components/color-swatches';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Category } from '@/hooks/useCategoryData';

/** El hex se guarda tal cual en la DB. */
export const CATEGORY_COLORS: readonly Swatch[] = [
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#eab308', label: 'Amarillo' },
  { value: '#10b981', label: 'Verde' },
  { value: '#06b6d4', label: 'Celeste' },
  { value: '#6366f1', label: 'Índigo' },
  { value: '#a855f7', label: 'Violeta' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#71717a', label: 'Gris' },
  { value: '#f59e0b', label: 'Ámbar' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#84cc16', label: 'Lima' },
];

/** El gris con el que la DB marca las categorías sin color asignado. */
export const DEFAULT_CATEGORY_COLOR = '#71717a';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  category?: Category | null;
}

export const CategoryModal = ({ isOpen, onClose, onSuccess, category }: Props) => {
  const isEdit = !!category;
  const user = useAuthStore(s => s.user);
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      setName(category.name);
      setColor(category.color ?? CATEGORY_COLORS[0].value);
    } else if (isOpen) {
      setName('');
      setColor(CATEGORY_COLORS[0].value);
    }
    setError(null);
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('El nombre es obligatorio.');

    setLoading(true);
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('Category')
          .update({ name: name.trim(), color })
          .eq('id', category!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Category')
          .insert({ name: name.trim(), color, userId: user!.id });
        if (error) throw error;
      }
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? 'No se pudo guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Tag className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
              <DialogDescription>
                Elegí un nombre y un color para identificarla.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-8 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <div className="flex-1 space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Supermercado"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Color</Label>
            <ColorSwatches swatches={CATEGORY_COLORS} value={color} onChange={setColor} />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
