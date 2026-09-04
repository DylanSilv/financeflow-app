import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorSwatches, type Swatch } from '@/components/color-swatches';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Account } from '@/hooks/useAccountData';

/**
 * El `value` es lo que guarda la DB (viene de la app vieja, así que no se
 * puede cambiar); `color` es sólo el hex con el que se pinta el swatch.
 */
export const ACCOUNT_COLORS: readonly Swatch[] = [
  { value: 'indigo', label: 'Índigo', color: '#6366f1' },
  { value: 'violet', label: 'Violeta', color: '#8b5cf6' },
  { value: 'sky', label: 'Celeste', color: '#0ea5e9' },
  { value: 'emerald', label: 'Verde', color: '#10b981' },
  { value: 'amber', label: 'Ámbar', color: '#f59e0b' },
  { value: 'rose', label: 'Rosa', color: '#f43f5e' },
  { value: 'zinc', label: 'Gris', color: '#a1a1aa' },
  { value: 'orange', label: 'Naranja', color: '#f97316' },
];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Cuenta Corriente',
  SAVINGS: 'Caja de Ahorro',
  CASH: 'Efectivo',
  BENEFIT: 'Beneficio',
};

type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  account?: Account | null;
}

export const AccountModal = ({ isOpen, onClose, onSuccess, account }: Props) => {
  const isEdit = !!account;
  const user = useAuthStore(s => s.user);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[0].value);
  const [initial, setInitial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account) {
      setName(account.name);
      setType(account.type);
      setColor(account.color ?? ACCOUNT_COLORS[0].value);
      setInitial(String(account.initialBalance));
    } else if (isOpen) {
      setName('');
      setType('CHECKING');
      setColor(ACCOUNT_COLORS[0].value);
      setInitial('');
    }
    setError(null);
  }, [isOpen, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      color,
      initialBalance: parseFloat(initial) || 0,
    };

    setLoading(true);
    try {
      if (isEdit) {
        const { error } = await supabase.from('Account').update(payload).eq('id', account!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Account').insert({ ...payload, userId: user!.id });
        if (error) throw error;
      }
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? 'No se pudo guardar la cuenta.');
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
              <Landmark className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? 'Actualizá los datos de la cuenta.'
                  : 'Agregá una cuenta bancaria o de efectivo.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nombre</Label>
            <Input
              id="account-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. BROU Corriente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">Tipo</Label>
            <Select value={type} onValueChange={v => setType(v as AccountType)}>
              <SelectTrigger id="account-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-initial">
              Saldo inicial <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="account-initial"
                type="number"
                step="0.01"
                min="0"
                value={initial}
                onChange={e => setInitial(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Color</Label>
            <ColorSwatches swatches={ACCOUNT_COLORS} value={color} onChange={setColor} />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
