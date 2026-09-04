import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, RefreshCw } from 'lucide-react';

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
import { SwitchField } from '@/components/ui/switch-field';
import { useAccountsCache } from '@/hooks/useAccountsCache';
import type { FixedExpense } from '@/hooks/useFixedExpenseData';

interface Props {
  expense: FixedExpense | null;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      name?: string;
      amount?: number;
      dueDate?: number;
      autoPay?: boolean;
      accountId?: string | null;
    },
  ) => Promise<void>;
}

export const EditFixedExpenseModal = ({ expense, onClose, onSave }: Props) => {
  const { accounts } = useAccountsCache();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [autoPay, setAutoPay] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expense) return;
    setName(expense.name);
    setAmount(String(expense.amount));
    setDueDate(String(expense.dueDate));
    setAutoPay(expense.autoPay);
    setAccountId(expense.accountId ?? '');
    setError(null);
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
    setError(null);

    if (!name.trim()) return setError('El nombre es obligatorio.');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError('El monto debe ser mayor a $0.');
    const parsedDue = parseInt(dueDate, 10);
    if (isNaN(parsedDue) || parsedDue < 1 || parsedDue > 31) {
      return setError('El día de vencimiento debe estar entre 1 y 31.');
    }
    if (autoPay && !accountId) return setError('Seleccioná una cuenta para el pago automático.');

    setLoading(true);
    try {
      await onSave(expense.id, {
        name: name.trim(),
        amount: parsedAmount,
        dueDate: parsedDue,
        autoPay,
        accountId: autoPay ? accountId || null : null,
      });
      onClose();
    } catch (err) {
      console.error('edición de gasto fijo falló:', err);
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={expense !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Pencil className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Editar cuenta fija</DialogTitle>
              <DialogDescription>Actualizá el monto, el vencimiento o el AutoPay.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-fe-name">Nombre</Label>
            <Input id="edit-fe-name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fe-amount">Monto</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="edit-fe-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fe-due">Día de vencimiento</Label>
              <Input
                id="edit-fe-due"
                type="number"
                min="1"
                max="31"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <SwitchField
            checked={autoPay}
            onChange={setAutoPay}
            label="Pago automático"
            sublabel="Se debita solo cada mes"
            icon={<RefreshCw className="size-4" />}
          />

          <AnimatePresence>
            {autoPay && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1">
                  <Label htmlFor="edit-fe-account">Cuenta de débito</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="edit-fe-account" className="w-full">
                      <SelectValue placeholder="Seleccioná una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
