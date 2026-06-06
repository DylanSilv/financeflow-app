import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Hash } from 'lucide-react';
import { api } from '@/lib/axios';

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
  const [hasInstallments,   setHasInstallments]   = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments,  setPaidInstallments]  = useState('0');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) return;
    if (hasInstallments && !totalInstallments) return;

    setLoading(true);
    setError(null);
    try {
      await api.post('/fixed-expenses', {
        name,
        amount:            parseFloat(amount),
        dueDate:           parseInt(dueDate, 10),
        autoPay,
        hasInstallments,
        totalInstallments: hasInstallments ? parseInt(totalInstallments, 10) : undefined,
        paidInstallments:  hasInstallments ? parseInt(paidInstallments,  10) : undefined,
      });

      setName(''); setAmount(''); setDueDate('1');
      setAutoPay(false); setHasInstallments(false);
      setTotalInstallments(''); setPaidInstallments('0');
      onClose();
      onSuccess?.();
    } catch {
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
                <div
                  onClick={() => setHasInstallments(!hasInstallments)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    hasInstallments
                      ? 'bg-indigo-500/10 border-indigo-500/30'
                      : 'bg-[#161616] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Hash className={`w-4 h-4 ${hasInstallments ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">Pago en cuotas</p>
                      <p className="text-xs text-zinc-500">Tiene un número fijo de cuotas</p>
                    </div>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasInstallments ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasInstallments ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </div>

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
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#161616] border border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-white">Pago Automático</p>
                    <p className="text-xs text-zinc-500">Se debitará solo cada mes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPay(!autoPay)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoPay ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoPay ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

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
