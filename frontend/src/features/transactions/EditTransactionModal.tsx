import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';

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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/lib/supabase';
import { insufficientFundsMessage } from '@/lib/fundsError';
import type { Transaction } from '@/hooks/useTransactionData';

interface ApiCategory {
  id: string;
  name: string;
  color: string | null;
}

const PAY_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CREDIT_CARD', label: 'Tarjeta crédito' },
  { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

/** El Select de Radix no admite "" como valor, así que el vacío va con clave. */
const NO_CATEGORY = 'none';

function toLocalDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>;
}

export const EditTransactionModal = ({ transaction, onClose, onSave }: Props) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('Category')
      .select('id, name, color')
      .order('name')
      .then(({ data }) => setCategories(data ?? []), () => {});
  }, []);

  useEffect(() => {
    if (!transaction) return;
    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setDate(toLocalDate(transaction.date));
    setType(transaction.type);
    setPaymentMethod(transaction.paymentMethod);
    setCategoryId(transaction.category?.id ?? NO_CATEGORY);
    setError(null);
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setError(null);

    if (!title.trim()) return setError('El concepto es obligatorio.');
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return setError('El monto debe ser mayor a $0.');
    }

    setLoading(true);
    try {
      await onSave(transaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        date: `${date}T12:00:00.000Z`,
        type,
        paymentMethod,
        categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      });
      onClose();
    } catch (err) {
      console.error('edición de movimiento falló:', err);
      setError(insufficientFundsMessage(err, 'No se pudo guardar. Intentá de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={transaction !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Pencil className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Editar movimiento</DialogTitle>
              <DialogDescription>Actualizá el concepto, el monto o la categoría.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={v => v && setType(v as 'EXPENSE' | 'INCOME')}
            variant="outline"
            className="w-full *:flex-1"
          >
            <ToggleGroupItem value="EXPENSE">Gasto</ToggleGroupItem>
            <ToggleGroupItem value="INCOME">Ingreso</ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-2">
            <Label htmlFor="edit-tx-title">Concepto</Label>
            <Input id="edit-tx-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tx-amount">Monto</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="edit-tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tx-date">Fecha</Label>
              <Input
                id="edit-tx-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tx-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="edit-tx-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tx-payment">Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="edit-tx-payment" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
