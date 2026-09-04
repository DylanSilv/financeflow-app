import React, { useState, useEffect } from 'react';
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
import { useAccountsCache } from '@/hooks/useAccountsCache';
import type { Card } from '@/hooks/useCardData';

import { bankByGradient, OTHER_BANK, type Bank } from './banks';
import { BankPicker } from './components/bank-picker';
import { CardPreview } from './components/card-preview';

type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX';

const BRAND_LABELS: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
};

const NO_ACCOUNT = 'none';

interface Props {
  card: Card | null;
  onClose: () => void;
  onSave: (id: string, data: object) => Promise<void>;
}

export const EditCardModal = ({ card, onClose, onSave }: Props) => {
  const { accounts } = useAccountsCache();

  const [selectedBank, setSelectedBank] = useState<Bank>(OTHER_BANK);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CardBrand>('VISA');
  const [lastFour, setLastFour] = useState('');
  const [accountId, setAccountId] = useState(NO_ACCOUNT);
  const [limit, setLimit] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    setSelectedBank(bankByGradient(card.color));
    setName(card.name);
    setBrand(card.brand as CardBrand);
    setLastFour(card.lastFourDigits);
    setAccountId(card.accountId ?? NO_ACCOUNT);
    setLimit(card.limit > 0 ? String(card.limit) : '');
    setStatementDay(card.statementDay ? String(card.statementDay) : '');
    setDueDay(card.dueDay ? String(card.dueDay) : '');
    setError(null);
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setError(null);

    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (lastFour.length !== 4) return setError('Ingresá exactamente los últimos 4 dígitos.');
    if (card.type === 'CREDIT' && limit && parseFloat(limit) <= 0) {
      return setError('El límite de crédito debe ser mayor a $0.');
    }

    setLoading(true);
    try {
      await onSave(card.id, {
        name,
        brand,
        lastFourDigits: lastFour,
        color: selectedBank.gradient,
        ...(card.type === 'CREDIT' && {
          limit: limit ? parseFloat(limit) : 0,
          statementDay: statementDay ? parseInt(statementDay, 10) : null,
          dueDay: dueDay ? parseInt(dueDay, 10) : null,
        }),
        accountId: accountId === NO_ACCOUNT ? null : accountId,
      });
      onClose();
    } catch (err) {
      console.error('edición de tarjeta falló:', err);
      setError('No se pudo guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={card !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CardIcon className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Editar tarjeta</DialogTitle>
              <DialogDescription>Actualizá los datos de la tarjeta.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BankPicker value={selectedBank} onChange={setSelectedBank} />

          <CardPreview bank={selectedBank} name={name} brand={brand} lastFour={lastFour} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-card-name">Nombre de la tarjeta</Label>
              <Input
                id="edit-card-name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-card-last-four">Últimos 4 dígitos</Label>
              <Input
                id="edit-card-last-four"
                required
                inputMode="numeric"
                maxLength={4}
                value={lastFour}
                onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-card-brand">Franquicia</Label>
            <Select value={brand} onValueChange={v => setBrand(v as CardBrand)}>
              <SelectTrigger id="edit-card-brand" className="w-full">
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

          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="edit-card-account">
                Vincular a cuenta{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="edit-card-account" className="w-full">
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
            </div>
          )}

          {card?.type === 'CREDIT' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-card-limit">Límite de crédito</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    $
                  </span>
                  <Input
                    id="edit-card-limit"
                    type="number"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-card-statement-day">
                    Día de cierre{' '}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="edit-card-statement-day"
                    type="number"
                    min="1"
                    max="31"
                    value={statementDay}
                    onChange={e => setStatementDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-card-due-day">
                    Día de vencimiento{' '}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="edit-card-due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

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
