import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { insufficientFundsMessage } from '@/lib/fundsError';
import { useAccountsCache } from '@/hooks/useAccountsCache';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (data: { fromAccountId: string; toAccountId: string; amount: number; date: string; description?: string }) => Promise<void>;
}

export const AddTransferModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const { accounts } = useAccountsCache();

  const [fromId,      setFromId]      = useState('');
  const [toId,        setToId]        = useState('');
  const [amount,      setAmount]      = useState('');
  const [date,        setDate]        = useState(todayISO);
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleClose = () => {
    setFromId(''); setToId(''); setAmount('');
    setDate(todayISO()); setDescription(''); setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromId || !toId) { setError('Seleccioná las cuentas de origen y destino.'); return; }
    if (fromId === toId)  { setError('Las cuentas deben ser diferentes.'); return; }
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) { setError('El monto debe ser mayor a $0.'); return; }

    setLoading(true);
    try {
      await onSubmit({
        fromAccountId: fromId,
        toAccountId:   toId,
        amount:        n,
        date:          `${date}T12:00:00.000Z`,
        description:   description.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      console.error('alta de transferencia falló:', err);
      setError(insufficientFundsMessage(err, 'No se pudo registrar la transferencia. Intentá de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
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
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Nueva Transferencia</h2>
                </div>
                <button onClick={handleClose} aria-label="Cerrar" className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">

                {/* Origen → Destino */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="transfer-from" className="text-xs font-medium text-zinc-500">Desde</label>
                    <select id="transfer-from" value={fromId} onChange={e => setFromId(e.target.value)} required
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="">Seleccioná...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="mt-5 flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="transfer-to" className="text-xs font-medium text-zinc-500">Hacia</label>
                    <select id="transfer-to" value={toId} onChange={e => setToId(e.target.value)} required
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="">Seleccioná...</option>
                      {accounts.filter(a => a.id !== fromId).map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Monto + Fecha */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="transfer-amount" className="text-xs font-medium text-zinc-500">Monto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                      <input id="transfer-amount" type="number" step="0.01" min="0.01" value={amount}
                        onChange={e => setAmount(e.target.value)} required
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="transfer-date" className="text-xs font-medium text-zinc-500">Fecha</label>
                    <input id="transfer-date" type="date" value={date} onChange={e => setDate(e.target.value)} required
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label htmlFor="transfer-description" className="text-xs font-medium text-zinc-500">Descripción <span className="text-zinc-700">(opcional)</span></label>
                  <input id="transfer-description" type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Ej. Pago de alquiler, recarga..."
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={handleClose}
                    className="flex-1 bg-zinc-800 text-zinc-300 font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50">
                    {loading ? 'Registrando...' : 'Transferir'}
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
