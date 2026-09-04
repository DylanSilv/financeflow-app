import React, { useState } from 'react';
import { CreditCard as CardIcon } from 'lucide-react';

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
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useAccountsCache } from '@/hooks/useAccountsCache';

import { BANKS, type Bank } from './banks';
import { BankPicker } from './components/bank-picker';
import { CardPreview } from './components/card-preview';

type CardType = 'CREDIT' | 'DEBIT';
type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX';

const BRAND_LABELS: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
};

const NO_ACCOUNT = 'none';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddCardModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const user = useAuthStore(s => s.user);
  const { accounts } = useAccountsCache();

  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CardType>('CREDIT');
  const [brand, setBrand] = useState<CardBrand>('VISA');
  const [limit, setLimit] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [accountId, setAccountId] = useState(NO_ACCOUNT);
  const [statementDay, setStatementDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    // Sólo autocompletamos si el nombre está vacío o quedó de otro banco.
    if (!name || BANKS.some(b => b.name === name)) setName(bank.name);
  };

  const reset = () => {
    setSelectedBank(null);
    setName('');
    setLimit('');
    setLastFour('');
    setStatementDay('');
    setDueDay('');
    setAccountId(NO_ACCOUNT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBank) return setError('Seleccioná el banco emisor de la tarjeta.');
    if (!name.trim()) return setError('El nombre de la tarjeta es obligatorio.');
    if (lastFour.length !== 4) return setError('Ingresá exactamente los últimos 4 dígitos.');
    if (type === 'CREDIT' && (!limit || parseFloat(limit) <= 0)) {
      return setError('El límite de crédito debe ser mayor a $0.');
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.from('Card').insert({
        name,
        type,
        brand,
        lastFourDigits: lastFour.slice(-4),
        color: selectedBank.gradient,
        limit: type === 'CREDIT' ? parseFloat(limit) : null,
        accountId: accountId === NO_ACCOUNT ? null : accountId,
        statementDay: type === 'CREDIT' && statementDay ? parseInt(statementDay, 10) : null,
        dueDay: type === 'CREDIT' && dueDay ? parseInt(dueDay, 10) : null,
        userId: user!.id,
      });
      if (err) throw err;

      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('alta de tarjeta falló:', err);
      setError('No se pudo registrar la tarjeta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CardIcon className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Vincular tarjeta</DialogTitle>
              <DialogDescription>Registrá una tarjeta de crédito o débito.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BankPicker value={selectedBank} onChange={handleBankSelect} />

          {selectedBank && (
            <CardPreview bank={selectedBank} name={name} brand={brand} lastFour={lastFour} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Nombre de la tarjeta</Label>
              <Input
                id="card-name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Itaú Visa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-last-four">Últimos 4 dígitos</Label>
              <Input
                id="card-last-four"
                required
                inputMode="numeric"
                maxLength={4}
                value={lastFour}
                onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))}
                placeholder="4242"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-type">Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as CardType)}>
                <SelectTrigger id="card-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Crédito</SelectItem>
                  <SelectItem value="DEBIT">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-brand">Franquicia</Label>
              <Select value={brand} onValueChange={v => setBrand(v as CardBrand)}>
                <SelectTrigger id="card-brand" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BRAND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="card-account">
                Vincular a cuenta <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="card-account" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>Sin vincular</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accountId !== NO_ACCOUNT && (
                <p className="text-muted-foreground text-xs">
                  El saldo se calculará automáticamente desde los movimientos de esa cuenta.
                </p>
              )}
            </div>
          )}

          {type === 'CREDIT' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="card-limit">Límite de crédito</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    $
                  </span>
                  <Input
                    id="card-limit"
                    type="number"
                    required
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-statement-day">
                    Día de cierre{' '}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="card-statement-day"
                    type="number"
                    min="1"
                    max="31"
                    value={statementDay}
                    onChange={e => setStatementDay(e.target.value)}
                    placeholder="Ej. 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-due-day">
                    Día de vencimiento{' '}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="card-due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                    placeholder="Ej. 13"
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading || !selectedBank} className="w-full">
              {loading ? 'Registrando…' : 'Confirmar registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
