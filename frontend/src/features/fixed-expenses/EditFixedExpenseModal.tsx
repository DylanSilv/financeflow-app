import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, RefreshCw } from 'lucide-react';
import { api } from '@/lib/axios';
import { FixedExpense } from '@/hooks/useFixedExpenseData';
import { Toggle } from '@/components/ui/Toggle';

interface Account { id: string; name: string; type: string; }

interface Props {
  expense:  FixedExpense | null;
  onClose:  () => void;
  onSave:   (id: string, data: { name?: string; amount?: number; dueDate?: number; autoPay?: boolean; accountId?: string | null }) => Promise<void>;
}

const INPUT_CLS = 'w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all';

export const EditFixedExpenseModal = ({ expense, onClose, onSave }: Props) => {
  const [name,      setName]      = useState('');
  const [amount,    setAmount]    = useState('');
  const [dueDate,   setDueDate]   = useState('');
  const [autoPay,   setAutoPay]   = useState(false);
  const [accountId, setAccountId] = useState('');
  const [accounts,  setAccounts]  = useState<Account[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    api.get<Account[]>('/accounts').then(r => setAccounts(r.data)).catch(() => {});
  }, []);

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
    setError(null);

    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { setError('El monto debe ser mayor a $0.'); return; }
    const d = parseInt(dueDate, 10);
    if (isNaN(d) || d < 1 || d > 31) { setError('El día de vencimiento debe estar entre 1 y 31.'); return; }
    if (autoPay && !accountId) { setError('Seleccioná una cuenta para el pago automático.'); return; }

    setLoading(true);
    try {
      await onSave(expense!.id, {
        name:      name.trim(),
        amount:    n,
        dueDate:   d,
        autoPay,
        accountId: autoPay ? (accountId || null) : null,
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
      {expense && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg"><Pencil className="w-4 h-4 text-indigo-400" /></div>
                  <h2 className="text-base font-semibold text-white">Editar Cuenta Fija</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Nombre</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className={INPUT_CLS} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Monto mensual</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-600 text-sm">$</span>
                      <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Día de vencimiento</label>
                    <input type="number" min="1" max="31" value={dueDate} onChange={e => setDueDate(e.target.value)} required className={INPUT_CLS} />
                  </div>
                </div>

                {/* AutoPay toggle */}
                <Toggle
                  checked={autoPay}
                  onChange={setAutoPay}
                  label="Pago Automático"
                  sublabel="Se debita solo cada mes"
                  icon={<RefreshCw className="w-4 h-4" />}
                />

                {/* Cuenta — visible solo con autoPay activo */}
                <AnimatePresence>
                  {autoPay && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-medium text-zinc-500">Cuenta de débito</label>
                        <select
                          value={accountId} onChange={e => setAccountId(e.target.value)}
                          className={`${INPUT_CLS} appearance-none`}
                        >
                          <option value="">Seleccioná una cuenta</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-zinc-800 text-zinc-300 rounded-xl py-2.5 text-sm hover:bg-zinc-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-white text-black font-semibold rounded-xl py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Guardar'}
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
