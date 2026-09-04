import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Hash, RefreshCw } from 'lucide-react';

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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SwitchField } from '@/components/ui/switch-field';
import { useAccountsCache } from '@/hooks/useAccountsCache';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddFixedExpenseModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const { accounts } = useAccountsCache();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('1');
  const [autoPay, setAutoPay] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [hasInstallments, setHasInstallments] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paid = parseInt(paidInstallments || '0', 10);
  const total = parseInt(totalInstallments || '0', 10);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('El nombre del servicio es obligatorio.');
    if (!amount || parseFloat(amount) <= 0) return setError('El monto debe ser mayor a $0.');
    const parsedDue = parseInt(dueDate, 10);
    if (!dueDate || isNaN(parsedDue) || parsedDue < 1 || parsedDue > 31) {
      return setError('El día de vencimiento debe estar entre 1 y 31.');
    }
    if (autoPay && !accountId) return setError('Seleccioná una cuenta para el pago automático.');
    if (hasInstallments) {
      if (!totalInstallments || total < 1) return setError('El total de cuotas debe ser al menos 1.');
      if (paid > total) return setError('Las cuotas pagadas no pueden superar el total.');
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_fixed_expense_with_loan', {
        p_name: name,
        p_amount: parseFloat(amount),
        p_due_date: parsedDue,
        p_auto_pay: autoPay,
        p_account_id: autoPay ? accountId || null : null,
        p_total_installments: hasInstallments ? total : null,
        p_paid_installments: hasInstallments ? paid : 0,
      });
      if (error) throw error;

      setName('');
      setAmount('');
      setDueDate('1');
      setAutoPay(false);
      setHasInstallments(false);
      setTotalInstallments('');
      setPaidInstallments('0');
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('alta de gasto fijo falló:', err);
      setError('No se pudo guardar el gasto fijo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CalendarDays className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Nueva cuenta fija</DialogTitle>
              <DialogDescription>Un pago recurrente para seguir mes a mes.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fe-name">Nombre del servicio</Label>
            <Input
              id="fe-name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Spotify, Alquiler, Gimnasio"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fe-amount">
                {hasInstallments ? 'Monto por cuota' : 'Monto mensual'}
              </Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="fe-amount"
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fe-due">Día de vencimiento</Label>
              <Input
                id="fe-due"
                type="number"
                required
                min="1"
                max="31"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                placeholder="Ej. 15"
              />
            </div>
          </div>

          <SwitchField
            checked={hasInstallments}
            onChange={setHasInstallments}
            label="Pago en cuotas"
            sublabel="Tiene un número fijo de cuotas"
            icon={<Hash className="size-4" />}
          />

          <AnimatePresence>
            {hasInstallments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="fe-total-inst">Total de cuotas</Label>
                    <Input
                      id="fe-total-inst"
                      type="number"
                      required
                      min="1"
                      value={totalInstallments}
                      onChange={e => setTotalInstallments(e.target.value)}
                      placeholder="Ej. 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fe-paid-inst">Cuotas ya pagadas</Label>
                    <Input
                      id="fe-paid-inst"
                      type="number"
                      min="0"
                      max={totalInstallments || undefined}
                      value={paidInstallments}
                      onChange={e => setPaidInstallments(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {total > 0 && (
                  <div className="bg-muted/50 mt-3 rounded-lg border p-3">
                    <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
                      <span>
                        {paid} de {total} cuotas pagadas
                      </span>
                      <span className="text-foreground font-semibold">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <SwitchField
            checked={autoPay}
            onChange={setAutoPay}
            label="Pago automático"
            sublabel="Se debitará solo cada mes"
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
                  <Label htmlFor="fe-account">Cuenta de débito</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="fe-account" className="w-full">
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
                  <p className="text-muted-foreground text-xs">
                    Se debitará automáticamente cuando abras la app.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando…' : 'Guardar cuenta fija'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
