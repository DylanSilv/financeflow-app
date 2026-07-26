import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Hash, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Toggle } from '@/components/ui/Toggle';

interface Account { id: string; name: string; type: string; }

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
}

export const AddFixedExpenseModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [name,              setName]              = useState('');
  const [amount,            setAmount]            = useState('');
  const [dueDate,           setDueDate]           = useState('1');
  const [autoPay,           setAutoPay]           = useState(false);
  const [accountId,         setAccountId]         = useState('');
  const [accounts,          setAccounts]          = useState<Account[]>([]);
  const [hasInstallments,   setHasInstallments]   = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments,  setPaidInstallments]  = useState('0');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  useEffect(() => {
    supabase.from('Account').select('id, name, type').eq('isArchived', false).order('name')
      .then(({ data }) => { setAccounts(data ?? []); if (data?.length) setAccountId(data[0].id); }, () => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('El nombre del servicio es obligatorio.'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('El monto debe ser mayor a $0.'); return; }
    const parsedDue = parseInt(dueDate, 10);
    if (!dueDate || isNaN(parsedDue) || parsedDue < 1 || parsedDue > 31) {
      setError('El día de vencimiento debe estar entre 1 y 31.'); return;
    }
    if (autoPay && !accountId) {
      setError('Seleccioná una cuenta para el pago automático.'); return;
    }
    if (hasInstallments) {
      if (!totalInstallments || parseInt(totalInstallments, 10) < 1) {
        setError('El total de cuotas debe ser al menos 1.'); return;
      }
      if (parseInt(paidInstallments, 10) > parseInt(totalInstallments, 10)) {
        setError('Las cuotas pagadas no pueden superar el total.'); return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_fixed_expense_with_loan', {
        p_name:               name,
        p_amount:             parseFloat(amount),
        p_due_date:           parseInt(dueDate, 10),
        p_auto_pay:           autoPay,
        p_account_id:         autoPay ? (accountId || null) : null,
        p_total_installments: hasInstallments ? parseInt(totalInstallments, 10) : null,
        p_paid_installments:  hasInstallments ? parseInt(paidInstallments,  10) : 0,
      });
      if (error) throw error;

      setName(''); setAmount(''); setDueDate('1');
      setAutoPay(false); setHasInstallments(false);
      setTotalInstallments(''); setPaidInstallments('0');
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('alta de gasto fijo falló:', err);
      setError('No se pudo guardar el gasto fijo.');
    } finally {
      setLoading(false);
    }
  };

  const paid  = parseInt(paidInstallments  || '0', 10);
  const total = parseInt(totalInstallments || '0', 10);
  const pct   = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Nueva Cuenta Fija</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Nombre */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre del Servicio</label>
                  <input
                    type="text" required value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Spotify, Alquiler, Gimnasio"
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Monto + Día */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                      {hasInstallments ? 'Monto por cuota' : 'Monto Mensual'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600">$</span>
                      <input
                        type="number" required step="0.01" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Día de Vencimiento</label>
                    <input
                      type="number" required min="1" max="31" value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      placeholder="Ej. 15"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Toggle cuotas */}
                <Toggle
                  checked={hasInstallments}
                  onChange={setHasInstallments}
                  label="Pago en cuotas"
                  sublabel="Tiene un número fijo de cuotas"
                  icon={<Hash className="w-4 h-4" />}
                />

                {/* Campos de cuotas (condicional) */}
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
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Total de cuotas</label>
                          <input
                            type="number" required={hasInstallments} min="1" value={totalInstallments}
                            onChange={e => setTotalInstallments(e.target.value)}
                            placeholder="Ej. 12"
                            className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Cuotas ya pagadas</label>
                          <input
                            type="number" min="0" max={totalInstallments || undefined} value={paidInstallments}
                            onChange={e => setPaidInstallments(e.target.value)}
                            placeholder="0"
                            className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Mini preview de progreso */}
                      {total > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-[#161616] border border-zinc-800/60">
                          <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                            <span>{paid} de {total} cuotas pagadas</span>
                            <span className="font-semibold text-zinc-300">{pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300 bg-indigo-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auto-pago */}
                <Toggle
                  checked={autoPay}
                  onChange={setAutoPay}
                  label="Pago Automático"
                  sublabel="Se debitará solo cada mes"
                  icon={<RefreshCw className="w-4 h-4" />}
                />

                {/* Cuenta de débito — solo visible con autoPay activo */}
                <AnimatePresence>
                  {autoPay && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Cuenta de débito</label>
                        <select
                          value={accountId} onChange={e => setAccountId(e.target.value)}
                          className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                        >
                          <option value="">Seleccioná una cuenta</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <p className="text-xs text-indigo-400">Se debitará automáticamente cuando abras la app.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="pt-1">
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Cuenta Fija'}
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
