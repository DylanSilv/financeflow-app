import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '@/lib/axios';

interface Account { id: string; name: string; type: string; }

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { name: 'Comida',       color: '#ef4444' },
  { name: 'Trabajo',      color: '#10b981' },
  { name: 'Ocio',         color: '#a855f7' },
  { name: 'Transporte',   color: '#eab308' },
  { name: 'Salud',        color: '#06b6d4' },
  { name: 'Servicios',    color: '#6366f1' },
  { name: 'Compras',      color: '#f97316' },
  { name: 'Sin categoría', color: '#71717a' },
];

const PAY_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'CREDIT_CARD',   label: 'Tarjeta crédito' },
  { value: 'DEBIT_CARD',    label: 'Tarjeta débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

export const AddTransactionModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [title,         setTitle]         = useState('');
  const [amount,        setAmount]        = useState('');
  const [type,          setType]          = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [category,      setCategory]      = useState(CATEGORIES[0].name);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [accountId,     setAccountId]     = useState('');
  const [accounts,      setAccounts]      = useState<Account[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    api.get<Account[]>('/accounts').then(r => {
      setAccounts(r.data);
      if (r.data.length > 0) setAccountId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    setLoading(true);
    setError(null);
    try {
      const cat = CATEGORIES.find(c => c.name === category);
      await api.post('/transactions', {
        title,
        amount:        parseFloat(amount),
        type,
        date:          new Date().toISOString(),
        paymentMethod,
        categoryName:  cat?.name,
        categoryColor: cat?.color,
        accountId:     accountId || undefined,
      });

      setTitle('');
      setAmount('');
      setPaymentMethod('CASH');
      onClose();
      onSuccess?.();
    } catch {
      setError('No se pudo guardar el movimiento. Intenta de nuevo.');
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

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Concepto</label>
                  <input
                    type="text" required value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Cena con amigos"
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Monto</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-500">$</span>
                      <input
                        type="number" required step="0.01" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoría</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Forma de pago</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    {PAY_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Cuenta</label>
                    <select
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="pt-4 mt-2 border-t border-zinc-800/50">
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Movimiento'}
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
