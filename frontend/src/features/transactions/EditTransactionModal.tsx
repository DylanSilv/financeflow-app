import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import { api } from '@/lib/axios';
import { Transaction } from '@/hooks/useTransactionData';

interface ApiCategory { id: string; name: string; color: string | null; }

const PAY_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'CREDIT_CARD',   label: 'Tarjeta crédito' },
  { value: 'DEBIT_CARD',    label: 'Tarjeta débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

function toLocalDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

interface Props {
  transaction: Transaction | null;
  onClose:     () => void;
  onSave:      (id: string, updates: Record<string, unknown>) => Promise<void>;
}

export const EditTransactionModal = ({ transaction, onClose, onSave }: Props) => {
  const [title,         setTitle]         = useState('');
  const [amount,        setAmount]        = useState('');
  const [date,          setDate]          = useState('');
  const [type,          setType]          = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [categoryId,    setCategoryId]    = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [categories,    setCategories]    = useState<ApiCategory[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    api.get<ApiCategory[]>('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!transaction) return;
    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setDate(toLocalDate(transaction.date));
    setType(transaction.type);
    setPaymentMethod(transaction.paymentMethod);
    setCategoryId(transaction.category?.id ?? '');
    setError(null);
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('El concepto es obligatorio.'); return; }
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) { setError('El monto debe ser mayor a $0.'); return; }

    setLoading(true);
    try {
      await onSave(transaction!.id, {
        title:         title.trim(),
        amount:        n,
        date:          `${date}T12:00:00.000Z`,
        type,
        paymentMethod,
        categoryId:    categoryId || null,
      });
      onClose();
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {transaction && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              className="bg-[#111111] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Pencil className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Editar Movimiento</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Tipo */}
                <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800">
                  {(['EXPENSE', 'INCOME'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        type === t ? 'bg-[#1a1a1a] text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                    </button>
                  ))}
                </div>

                {/* Concepto */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-tx-title" className="text-xs font-medium text-zinc-500">Concepto</label>
                  <input id="edit-tx-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Monto + Fecha */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-tx-amount" className="text-xs font-medium text-zinc-500">Monto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                      <input id="edit-tx-amount" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-tx-date" className="text-xs font-medium text-zinc-500">Fecha</label>
                    <input id="edit-tx-date" type="date" value={date} onChange={e => setDate(e.target.value)} required
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-tx-category" className="text-xs font-medium text-zinc-500">Categoría</label>
                  <select id="edit-tx-category" value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Método de pago */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-tx-payment" className="text-xs font-medium text-zinc-500">Forma de pago</label>
                  <select id="edit-tx-payment" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    {PAY_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-zinc-800 text-zinc-300 font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
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
