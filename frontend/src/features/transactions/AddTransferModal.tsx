import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

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
import { useAccountsCache } from '@/hooks/useAccountsCache';
import { insufficientFundsMessage } from '@/lib/fundsError';

/** YYYY-MM-DD en hora local. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description?: string;
  }) => Promise<void>;
}

export const AddTransferModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const { accounts } = useAccountsCache();

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setFromId('');
    setToId('');
    setAmount('');
    setDate(todayISO());
    setDescription('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromId || !toId) return setError('Seleccioná las cuentas de origen y destino.');
    if (fromId === toId) return setError('Las cuentas deben ser diferentes.');
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return setError('El monto debe ser mayor a $0.');
    }

    setLoading(true);
    try {
      await onSubmit({
        fromAccountId: fromId,
        toAccountId: toId,
        amount: parsedAmount,
        date: `${date}T12:00:00.000Z`,
        description: description.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      console.error('alta de transferencia falló:', err);
      setError(
        insufficientFundsMessage(err, 'No se pudo registrar la transferencia. Intentá de nuevo.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <ArrowRight className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Nueva transferencia</DialogTitle>
              <DialogDescription>Mové dinero entre tus cuentas.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-from">Desde</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger id="transfer-from" className="w-full">
                  <SelectValue placeholder="Cuenta origen" />
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

            <div className="space-y-2">
              <Label htmlFor="transfer-to">Hacia</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger id="transfer-to" className="w-full">
                  <SelectValue placeholder="Cuenta destino" />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Monto</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-date">Fecha</Label>
              <Input
                id="transfer-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={todayISO()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-description">
              Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="transfer-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej. Pasaje a caja de ahorro"
            />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registrando…' : 'Registrar transferencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
