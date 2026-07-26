import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { insufficientFundsMessage } from '@/lib/fundsError';

interface Account     { id: string; name: string; type: string; }
interface ApiCategory { id: string; name: string; color: string | null; }
interface CardOption  { id: string; name: string; type: string; dueDay: number | null; limit: number | null; balanceUsed: number; }

/** Fila cruda de `Card`: Postgres devuelve los numeric como string. */
interface RawCard {
  id: string; name?: string; type?: string; dueDay?: number | null;
  limit?: string | number | null; balanceUsed?: string | number | null;
}

const toCardOption = (c: RawCard): CardOption => ({
  id:          c.id,
  name:        c.name ?? '',
  type:        c.type ?? '',
  dueDay:      c.dueDay ?? null,
  limit:       c.limit != null ? Number(c.limit) : null,
  balanceUsed: Number(c.balanceUsed ?? 0),
});

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess?: () => void;
}

const PAY_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'CREDIT_CARD',   label: 'Tarjeta crédito' },
  { value: 'DEBIT_CARD',    label: 'Tarjeta débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

// YYYY-MM-DD en hora local
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Convierte YYYY-MM-DD a ISO con mediodía UTC para evitar drift por timezone
function toUTCNoon(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [title,         setTitle]         = useState('');
  const [amount,        setAmount]        = useState('');
  const [date,          setDate]          = useState(todayISO);
  const [type,          setType]          = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId,    setCategoryId]    = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [accountId,     setAccountId]     = useState('');
  const [cardId,        setCardId]        = useState('');
  const [withCuotas,    setWithCuotas]    = useState(false);
  const [numCuotas,     setNumCuotas]     = useState('');
  const [accounts,      setAccounts]      = useState<Account[]>([]);
  const [creditCards,   setCreditCards]   = useState<CardOption[]>([]);
  const [categories,    setCategories]    = useState<ApiCategory[]>([]);
  const [balances,      setBalances]      = useState<Record<string, number>>({});
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(''); setAmount(''); setDate(todayISO());
    setType('EXPENSE'); setCategoryId(''); setPaymentMethod('CASH');
    setWithCuotas(false); setNumCuotas(''); setError(null);
    setAccounts(prev => { if (prev.length > 0) setAccountId(prev[0].id); return prev; });
    setCreditCards(prev => { if (prev.length > 0) setCardId(prev[0].id); return prev; });
  }, [isOpen]);

  useEffect(() => {
    supabase.from('Account').select('id, name, type').eq('isArchived', false).order('name')
      .then(({ data }) => { setAccounts(data ?? []); if (data?.length) setAccountId(data[0].id); }, () => {});
    supabase.from('Category').select('id, name, color').order('name')
      .then(({ data }) => { setCategories(data ?? []); if (data?.length) setCategoryId(data[0].id); }, () => {});
    supabase.from('Card').select('id, name, type, dueDay, limit, balanceUsed').order('name')
      .then(({ data }) => {
        const credit = ((data ?? []) as RawCard[])
          .filter(c => c.type === 'CREDIT')
          .map(toCardOption);
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
    supabase.from('Card').select('id, limit, balanceUsed').then(({ data }) => {
      const byId = new Map(((data ?? []) as RawCard[]).map(c => [c.id, c]));
      setCreditCards(prev => prev.map(c => {
        const fresh = byId.get(c.id);
        return fresh
          ? { ...c, limit: fresh.limit != null ? Number(fresh.limit) : null, balanceUsed: Number(fresh.balanceUsed ?? 0) }
          : c;
      }));
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
    !insufficientFunds && availableFunds != null && availableFunds > 0 &&
    parsedAmountPreview > 0 && parsedAmountPreview > availableFunds * 0.8;

  const fmtMoney = (n: number) =>
    `$${n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El concepto es obligatorio.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser mayor a $0.');
      return;
    }

    if (!date) {
      setError('La fecha es obligatoria.');
      return;
    }
    const parsedDate = new Date(toUTCNoon(date));
    if (isNaN(parsedDate.getTime())) {
      setError('Fecha inválida.');
      return;
    }

    const parsedCuotas = withCuotas && paymentMethod === 'CREDIT_CARD' ? parseInt(numCuotas, 10) : 0;
    if (withCuotas && paymentMethod === 'CREDIT_CARD') {
      if (!numCuotas || isNaN(parsedCuotas) || parsedCuotas < 2) {
        setError('La cantidad de cuotas debe ser 2 o más.');
        return;
      }
    }

    if (type === 'EXPENSE' && availableFunds != null && parsedAmount > availableFunds) {
      setError(`Saldo insuficiente. Disponible: ${fmtMoney(availableFunds)}.`);
      return;
    }

    setLoading(true);
    try {
      const { error: txErr } = await supabase.rpc('create_transaction', {
        p_title:          title,
        p_amount:         parsedAmount,
        p_date:           toUTCNoon(date),
        p_type:           type,
        p_payment_method: paymentMethod,
        p_category_id:    categoryId || null,
        p_card_id:        paymentMethod === 'CREDIT_CARD' ? (cardId || null) : null,
        p_account_id:     paymentMethod !== 'CREDIT_CARD' ? (accountId || null) : null,
      });
      if (txErr) throw txErr;

      if (parsedCuotas >= 2 && paymentMethod === 'CREDIT_CARD') {
        const installmentAmount = parsedAmount / parsedCuotas;
        const selectedCard = creditCards.find(c => c.id === cardId);
        const dueDate = selectedCard?.dueDay ?? 10;
        const { error: feErr } = await supabase.rpc('create_fixed_expense_with_loan', {
          p_name:               `Cuotas: ${title}`,
          p_amount:             installmentAmount,
          p_due_date:           dueDate,
          p_total_installments: parsedCuotas,
          p_paid_installments:  0,
        });
        if (feErr) throw feErr;
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('create_transaction falló:', err);
      // La base valida de nuevo: entre que leímos el disponible y guardamos, el
      // saldo pudo cambiar (otra pestaña, otro dispositivo).
      setError(insufficientFundsMessage(err, 'No se pudo guardar el movimiento. Intenta de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="bg-[#111111] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Nuevo Movimiento</h2>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

                {/* Tipo: Gasto / Ingreso */}
                <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800">
                  {(['EXPENSE', 'INCOME'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        type === t
                          ? `bg-[#111111] ${t === 'EXPENSE' ? 'text-red-400' : 'text-emerald-400'} shadow-sm border border-zinc-800`
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                    </button>
                  ))}
                </div>

                {/* Concepto */}
                <div className="space-y-2">
                  <label htmlFor="add-tx-title" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Concepto</label>
                  <input
                    id="add-tx-title"
                    type="text" value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Cena con amigos"
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Monto + Fecha */}
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label htmlFor="add-tx-amount" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Monto</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-500">$</span>
                      <input
                        id="add-tx-amount"
                        type="number" step="0.01" min="0.01" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label htmlFor="add-tx-date" className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Fecha
                    </label>
                    <input
                      id="add-tx-date"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      max={todayISO()}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Categoría + Forma de pago */}
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label htmlFor="add-tx-category" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoría</label>
                    <select
                      id="add-tx-category"
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label htmlFor="add-tx-payment" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pago</label>
                    <select
                      id="add-tx-payment"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      {PAY_METHODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cuenta / Tarjeta de crédito */}
                {paymentMethod === 'CREDIT_CARD' ? (
                  creditCards.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="add-tx-card" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tarjeta de crédito</label>
                        <select
                          id="add-tx-card"
                          value={cardId}
                          onChange={e => setCardId(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="">Sin tarjeta</option>
                          {creditCards.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cuotas */}
                      {type === 'EXPENSE' && (
                        <div className="space-y-3">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={withCuotas}
                              onChange={e => { setWithCuotas(e.target.checked); setNumCuotas(''); }}
                              className="w-4 h-4 accent-indigo-500 rounded"
                            />
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Compra en cuotas</span>
                          </label>

                          {withCuotas && (
                            <div className="flex gap-4 items-start">
                              <div className="space-y-1 flex-1">
                                <label htmlFor="add-tx-cuotas" className="text-xs text-zinc-500">Cantidad de cuotas</label>
                                <input
                                  id="add-tx-cuotas"
                                  type="number" min="2" max="72" value={numCuotas}
                                  onChange={e => setNumCuotas(e.target.value)}
                                  placeholder="Ej. 12"
                                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                                />
                              </div>
                              {amount && numCuotas && parseInt(numCuotas) >= 2 && !isNaN(parseFloat(amount)) && (
                                <div className="space-y-1 flex-1 pt-0.5">
                                  <p className="text-xs text-zinc-500">Cuota mensual</p>
                                  <p className="text-sm font-semibold text-indigo-400 py-2.5">
                                    ${(parseFloat(amount) / parseInt(numCuotas)).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                ) : (
                  accounts.length > 0 && (
                    <div className="space-y-2">
                      <label htmlFor="add-tx-account" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Cuenta</label>
                      <select
                        id="add-tx-account"
                        value={accountId}
                        onChange={e => setAccountId(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )
                )}

                {/* Disponible del medio de pago elegido */}
                {availableFunds != null && (
                  <div
                    className={`flex items-center justify-between text-xs rounded-lg px-3 py-2.5 border ${
                      insufficientFunds
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : nearlyOutOfFunds
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span>
                      {insufficientFunds
                        ? 'Saldo insuficiente'
                        : nearlyOutOfFunds
                          ? 'Te quedás casi sin saldo'
                          : 'Disponible'}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {fmtMoney(availableFunds)}
                      {parsedAmountPreview > 0 && !insufficientFunds && (
                        <span className="font-normal opacity-70">
                          {' → '}{fmtMoney(availableFunds - parsedAmountPreview)}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="pt-4 mt-2 border-t border-zinc-800/50">
                  <button
                    type="submit" disabled={loading || insufficientFunds}
                    className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : insufficientFunds ? 'Saldo insuficiente' : 'Guardar Movimiento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
