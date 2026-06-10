import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown } from 'lucide-react';
import { CreateLoanInput } from '@/hooks/useLoanData';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (data: CreateLoanInput) => Promise<void>;
}

export const AddLoanModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [name,              setName]              = useState('');
  const [originalAmount,    setOriginalAmount]    = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments,  setPaidInstallments]  = useState('0');
  const [startDate,         setStartDate]         = useState('');
  const [notes,             setNotes]             = useState('');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  const total  = parseInt(totalInstallments  || '0', 10);
  const paid   = parseInt(paidInstallments   || '0', 10);
  const pct    = total > 0 ? Math.round((paid / total) * 100) : 0;
  const remaining = Math.max(
    (parseFloat(originalAmount) || 0) - (parseFloat(installmentAmount) || 0) * paid,
    0,
  );

  const handleClose = () => {
    setName(''); setOriginalAmount(''); setInstallmentAmount('');
    setTotalInstallments(''); setPaidInstallments('0');
    setStartDate(''); setNotes(''); setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!originalAmount || parseFloat(originalAmount) <= 0)    { setError('El monto total debe ser mayor a $0.'); return; }
    if (!installmentAmount || parseFloat(installmentAmount) <= 0) { setError('El monto de cuota debe ser mayor a $0.'); return; }
    if (!totalInstallments || parseInt(totalInstallments, 10) < 1) { setError('El total de cuotas debe ser al menos 1.'); return; }
    if (paid > total) { setError('Las cuotas pagadas no pueden superar el total.'); return; }

    setLoading(true);
    try {
      await onSubmit({
        name:              name.trim(),
        originalAmount:    parseFloat(originalAmount),
        installmentAmount: parseFloat(installmentAmount),
        totalInstallments: parseInt(totalInstallments, 10),
        paidInstallments:  paid,
        startDate:         startDate || undefined,
        notes:             notes.trim() || undefined,
      });
      handleClose();
    } catch {
      setError('No se pudo registrar el préstamo. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Nuevo Préstamo Personal</h2>
                </div>
                <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Nombre */}
                <div className="space-y-2">
                  <label htmlFor="loan-name" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre del préstamo</label>
                  <input
                    id="loan-name"
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej. Creditel, Banco, Familiar..."
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Monto total + Cuota */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="loan-total" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Monto total</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600 text-sm">$</span>
                      <input
                        id="loan-total"
                        type="number" step="0.01" min="0.01" required value={originalAmount}
                        onChange={e => setOriginalAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="loan-installment" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Cuota mensual</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600 text-sm">$</span>
                      <input
                        id="loan-installment"
                        type="number" step="0.01" min="0.01" required value={installmentAmount}
                        onChange={e => setInstallmentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Total cuotas + Pagadas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="loan-total-inst" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Total de cuotas</label>
                    <input
                      id="loan-total-inst"
                      type="number" min="1" required value={totalInstallments}
                      onChange={e => setTotalInstallments(e.target.value)}
                      placeholder="Ej. 12"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="loan-paid-inst" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Ya pagadas</label>
                    <input
                      id="loan-paid-inst"
                      type="number" min="0" max={totalInstallments || undefined} value={paidInstallments}
                      onChange={e => setPaidInstallments(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Preview de progreso */}
                {total > 0 && (
                  <div className="p-3 rounded-xl bg-[#161616] border border-zinc-800/60 space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{paid} de {total} cuotas pagadas</span>
                      <span className="font-semibold text-zinc-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    {remaining > 0 && (
                      <p className="text-[10px] text-zinc-600">
                        Deuda restante: ${remaining.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                )}

                {/* Fecha de inicio + Notas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="loan-start" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Fecha de inicio <span className="text-zinc-700 normal-case">(opcional)</span></label>
                    <input
                      id="loan-start"
                      type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="loan-notes" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Notas <span className="text-zinc-700 normal-case">(opcional)</span></label>
                    <input
                      id="loan-notes"
                      type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Ej. banco, tasa..."
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Registrar Préstamo'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
