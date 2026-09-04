import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { fmtDec } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface ApiCategory {
  id: string;
  name: string;
  color: string | null;
}

interface CardOption {
  id: string;
  name: string;
  type: string;
  dueDay: number | null;
  limit: number | null;
  balanceUsed: number;
}

/** Fila cruda de `Card`: Postgres devuelve los numeric como string. */
interface RawCard {
  id: string;
  name?: string;
  type?: string;
  dueDay?: number | null;
  limit?: string | number | null;
  balanceUsed?: string | number | null;
}

const toCardOption = (c: RawCard): CardOption => ({
  id: c.id,
  name: c.name ?? '',
  type: c.type ?? '',
  dueDay: c.dueDay ?? null,
  limit: c.limit != null ? Number(c.limit) : null,
  balanceUsed: Number(c.balanceUsed ?? 0),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAY_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CREDIT_CARD', label: 'Tarjeta crédito' },
  { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

/** El Select de Radix no admite "" como valor, así que el vacío va con clave. */
const NONE = 'none';

/** YYYY-MM-DD en hora local. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Mediodía UTC, para que la fecha no se corra por timezone. */
function toUTCNoon(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}

const money = (n: number) => `$${fmtDec(n)}`;

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO);
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId, setCategoryId] = useState(NONE);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState(NONE);
  const [withCuotas, setWithCuotas] = useState(false);
  const [numCuotas, setNumCuotas] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CardOption[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setAmount('');
    setDate(todayISO());
    setType('EXPENSE');
    setPaymentMethod('CASH');
    setWithCuotas(false);
    setNumCuotas('');
    setError(null);
  }, [isOpen]);

  useEffect(() => {
    supabase
      .from('Account')
      .select('id, name, type')
      .eq('isArchived', false)
      .order('name')
      .then(({ data }) => {
        setAccounts(data ?? []);
        if (data?.length) setAccountId(data[0].id);
      }, () => {});

    supabase
      .from('Category')
      .select('id, name, color')
      .order('name')
      .then(({ data }) => setCategories(data ?? []), () => {});

    supabase
      .from('Card')
      .select('id, name, type, dueDay, limit, balanceUsed')
      .order('name')
      .then(({ data }) => {
        const credit = ((data ?? []) as RawCard[]).filter(c => c.type === 'CREDIT').map(toCardOption);
        setCreditCards(credit);
        if (credit.length) setCardId(credit[0].id);
      }, () => {});
  }, []);

  // Los saldos se releen cada vez que se abre el modal: si acabás de guardar un
  // gasto, el disponible que teníamos en memoria ya quedó viejo.
  useEffect(() => {
    if (!isOpen) return;

    supabase.rpc('get_balance_por_cuenta').then(({ data }) => {
      const rows = (data ?? []) as { id: string; balance: number }[];
      setBalances(Object.fromEntries(rows.map(r => [r.id, Number(r.balance)])));
    }, () => {});

    supabase
      .from('Card')
      .select('id, limit, balanceUsed')
      .then(({ data }) => {
        const byId = new Map(((data ?? []) as RawCard[]).map(c => [c.id, c]));
        setCreditCards(prev =>
          prev.map(c => {
            const fresh = byId.get(c.id);
            return fresh
              ? {
                  ...c,
                  limit: fresh.limit != null ? Number(fresh.limit) : null,
                  balanceUsed: Number(fresh.balanceUsed ?? 0),
                }
              : c;
          }),
        );
      }, () => {});
  }, [isOpen]);

  // Disponible del medio de pago elegido. Null significa "sin tope que validar":
  // un ingreso, o una tarjeta sin límite cargado. Replica lo que hace
  // available_funds() en la base, que es quien realmente bloquea.
  const availableFunds: number | null = (() => {
    if (type !== 'EXPENSE') return null;
    if (paymentMethod === 'CREDIT_CARD') {
      const card = creditCards.find(c => c.id === cardId);
      if (!card || card.limit == null || card.limit <= 0) return null;
      return card.limit - card.balanceUsed;
    }
    if (accountId && balances[accountId] != null) return balances[accountId];
    return null;
  })();

  const parsedAmountPreview = parseFloat(amount) || 0;
  const insufficientFunds = availableFunds != null && parsedAmountPreview > availableFunds;
  // Aviso temprano: el gasto no supera el disponible pero se come más del 80 %.
  const nearlyOutOfFunds =
    !insufficientFunds &&
    availableFunds != null &&
    availableFunds > 0 &&
    parsedAmountPreview > 0 &&
    parsedAmountPreview > availableFunds * 0.8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError('El concepto es obligatorio.');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return setError('El monto debe ser mayor a $0.');
    }

    if (!date) return setError('La fecha es obligatoria.');
    if (isNaN(new Date(toUTCNoon(date)).getTime())) return setError('Fecha inválida.');

    const parsedCuotas =
      withCuotas && paymentMethod === 'CREDIT_CARD' ? parseInt(numCuotas, 10) : 0;
    if (withCuotas && paymentMethod === 'CREDIT_CARD') {
      if (!numCuotas || isNaN(parsedCuotas) || parsedCuotas < 2) {
        return setError('La cantidad de cuotas debe ser 2 o más.');
      }
    }

    if (type === 'EXPENSE' && availableFunds != null && parsedAmount > availableFunds) {
      return setError(`Saldo insuficiente. Disponible: ${money(availableFunds)}.`);
    }

    setLoading(true);
    try {
      const { error: txErr } = await supabase.rpc('create_transaction', {
        p_title: title,
        p_amount: parsedAmount,
        p_date: toUTCNoon(date),
        p_type: type,
        p_payment_method: paymentMethod,
        p_category_id: categoryId === NONE ? null : categoryId,
        p_card_id: paymentMethod === 'CREDIT_CARD' && cardId !== NONE ? cardId : null,
        p_account_id: paymentMethod !== 'CREDIT_CARD' ? accountId || null : null,
      });
      if (txErr) throw txErr;

      if (parsedCuotas >= 2 && paymentMethod === 'CREDIT_CARD') {
        const selectedCard = creditCards.find(c => c.id === cardId);
        const { error: feErr } = await supabase.rpc('create_fixed_expense_with_loan', {
          p_name: `Cuotas: ${title}`,
          p_amount: parsedAmount / parsedCuotas,
          p_due_date: selectedCard?.dueDay ?? 10,
          p_total_installments: parsedCuotas,
          p_paid_installments: 0,
        });
        if (feErr) throw feErr;
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('create_transaction falló:', err);
      // La base valida de nuevo: entre que leímos el disponible y guardamos, el
      // saldo pudo cambiar (otra pestaña, otro dispositivo).
      setError(insufficientFundsMessage(err, 'No se pudo guardar el movimiento. Intentá de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const cuotaPreview =
    amount && numCuotas && parseInt(numCuotas, 10) >= 2 && !isNaN(parseFloat(amount))
      ? parseFloat(amount) / parseInt(numCuotas, 10)
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
          <DialogDescription>Registrá un ingreso o un gasto.</DialogDescription>
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
            <Label htmlFor="add-tx-title">Concepto</Label>
            <Input
              id="add-tx-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Cena con amigos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-tx-amount">Monto</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="add-tx-amount"
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
              <Label htmlFor="add-tx-date">
                <Calendar className="size-3" /> Fecha
              </Label>
              <Input
                id="add-tx-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={todayISO()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-tx-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="add-tx-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin categoría</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-tx-payment">Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="add-tx-payment" className="w-full">
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

          {paymentMethod === 'CREDIT_CARD'
            ? creditCards.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="add-tx-card">Tarjeta de crédito</Label>
                    <Select value={cardId} onValueChange={setCardId}>
                      <SelectTrigger id="add-tx-card" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Sin tarjeta</SelectItem>
                        {creditCards.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {type === 'EXPENSE' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id="add-tx-cuotas-toggle"
                          checked={withCuotas}
                          onCheckedChange={checked => {
                            setWithCuotas(checked === true);
                            setNumCuotas('');
                          }}
                        />
                        <Label htmlFor="add-tx-cuotas-toggle">Compra en cuotas</Label>
                      </div>

                      {withCuotas && (
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="add-tx-cuotas">Cantidad de cuotas</Label>
                            <Input
                              id="add-tx-cuotas"
                              type="number"
                              min="2"
                              max="72"
                              value={numCuotas}
                              onChange={e => setNumCuotas(e.target.value)}
                              placeholder="Ej. 12"
                            />
                          </div>
                          {cuotaPreview !== null && (
                            <div className="flex-1 space-y-1">
                              <p className="text-muted-foreground text-xs">Cuota mensual</p>
                              <p className="py-2 text-sm font-semibold tabular-nums">
                                {money(cuotaPreview)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            : accounts.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="add-tx-account">Cuenta</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="add-tx-account" className="w-full">
                      <SelectValue />
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
              )}

          {availableFunds != null && (
            <div
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs',
                insufficientFunds
                  ? 'border-danger/30 bg-danger/10 text-danger'
                  : nearlyOutOfFunds
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                    : 'bg-muted/50 text-muted-foreground',
              )}
            >
              <span>
                {insufficientFunds
                  ? 'Saldo insuficiente'
                  : nearlyOutOfFunds
                    ? 'Te quedás casi sin saldo'
                    : 'Disponible'}
              </span>
              <span className="font-semibold tabular-nums">
                {money(availableFunds)}
                {parsedAmountPreview > 0 && !insufficientFunds && (
                  <span className="font-normal opacity-70">
                    {' → '}
                    {money(availableFunds - parsedAmountPreview)}
                  </span>
                )}
              </span>
            </div>
          )}

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading || insufficientFunds} className="w-full">
              {loading
                ? 'Guardando…'
                : insufficientFunds
                  ? 'Saldo insuficiente'
                  : 'Guardar movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
