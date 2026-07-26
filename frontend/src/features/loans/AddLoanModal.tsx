import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown } from 'lucide-react';
import { CreateLoanInput } from '@/hooks/useLoanData';
import { scheduleSummary } from '@/lib/loanMath';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (data: CreateLoanInput) => Promise<void>;
}

type Mode = 'CUOTAS' | 'INTERES';

const fmt = (n: number) =>
  `$${n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const inputClass =
  'w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white ' +
  'focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600';

export const AddLoanModal = ({ isOpen, onClose, onSubmit }: Props) => {
  // 'CUOTAS'  → compra financiada sin interés: se pide el total y se deriva la cuota.
  // 'INTERES' → préstamo real: se pide capital y cuota, y se deriva la tasa.
  const [mode,              setMode]              = useState<Mode>('CUOTAS');
  const [name,              setName]              = useState('');
  const [amount,            setAmount]            = useState('');   // total o capital, según el modo
  const [installmentAmount, setInstallmentAmount] = useState('');   // sólo en 'INTERES'
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments,  setPaidInstallments]  = useState('0');
  const [startDate,         setStartDate]         = useState('');
  const [notes,             setNotes]             = useState('');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  const total  = parseInt(totalInstallments || '0', 10);
  const paid   = parseInt(paidInstallments  || '0', 10);
  const pct    = total > 0 ? Math.round((paid / total) * 100) : 0;
  const monto  = parseFloat(amount) || 0;

  // En cuotas la cuota se deriva; con interés la carga el usuario.
  const cuota = mode === 'CUOTAS'
    ? (total > 0 ? monto / total : 0)
    : (parseFloat(installmentAmount) || 0);

  const resumen = mode === 'INTERES' && monto > 0 && cuota > 0 && total > 0
    ? scheduleSummary(monto, cuota, total)
    : null;

  const handleClose = () => {
    setMode('CUOTAS'); setName(''); setAmount(''); setInstallmentAmount('');
    setTotalInstallments(''); setPaidInstallments('0');
    setStartDate(''); setNotes(''); setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    if (monto <= 0) {
      setError(mode === 'CUOTAS' ? 'El monto total debe ser mayor a $0.' : 'El capital debe ser mayor a $0.');
      return;
    }
    if (total < 1) { setError('El total de cuotas debe ser al menos 1.'); return; }
    if (paid > total) { setError('Las cuotas pagadas no pueden superar el total.'); return; }
    if (mode === 'INTERES') {
      if (cuota <= 0) { setError('La cuota mensual debe ser mayor a $0.'); return; }
      if (cuota * total <= monto) {
        setError('Con esos números no hay interés: el total de cuotas no supera al capital. Usá "Compra en cuotas".');
        return;
      }
      if (resumen?.annualNominalPct == null) {
        setError('No se pudo calcular la tasa con esos valores. Revisá capital, cuota y plazo.');
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        name:              name.trim(),
        originalAmount:    monto,
        installmentAmount: Number(cuota.toFixed(2)),
        totalInstallments: total,
        paidInstallments:  paid,
        interestRate:      mode === 'INTERES' ? Number(resumen!.annualNominalPct!.toFixed(4)) : null,
        startDate:         startDate || undefined,
        notes:             notes.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      console.error('alta de préstamo falló:', err);
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
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Nuevo Compromiso</h2>
                </div>
                <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Tipo */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Tipo</span>
                  <div className="grid grid-cols-2 gap-2 bg-[#161616] p-1 rounded-xl border border-zinc-800">
                    {([
                      ['CUOTAS',  'Compra en cuotas'],
                      ['INTERES', 'Préstamo con interés'],
                    ] as const).map(([m, label]) => (
                      <button
                        key={m} type="button" onClick={() => { setMode(m); setError(null); }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          mode === m ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    {mode === 'CUOTAS'
                      ? 'Sin interés: indicás el total y la cuota se calcula sola.'
                      : 'Indicá capital, cuota y plazo; la tasa la calculamos nosotros.'}
                  </p>
                </div>

                {/* Nombre */}
                <div className="space-y-2">
                  <label htmlFor="loan-name" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre</label>
                  <input
                    id="loan-name" type="text" required value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Creditel, Banco, Familiar..."
                    className={inputClass}
                  />
                </div>

                {/* Monto + cuota/plazo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="loan-amount" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                      {mode === 'CUOTAS' ? 'Monto total' : 'Capital prestado'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600 text-sm">$</span>
                      <input
                        id="loan-amount" type="number" step="0.01" min="0.01" required
                        value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="loan-total-inst" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Total de cuotas</label>
                    <input
                      id="loan-total-inst" type="number" min="1" required
                      value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)}
                      placeholder="Ej. 12"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {mode === 'INTERES' && (
                    <div className="space-y-2">
                      <label htmlFor="loan-installment" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Cuota mensual</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-zinc-600 text-sm">$</span>
                        <input
                          id="loan-installment" type="number" step="0.01" min="0.01" required
                          value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)}
                          placeholder="0.00"
                          className={`${inputClass} pl-8`}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label htmlFor="loan-paid-inst" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Ya pagadas</label>
                    <input
                      id="loan-paid-inst" type="number" min="0" max={totalInstallments || undefined}
                      value={paidInstallments} onChange={e => setPaidInstallments(e.target.value)}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Resumen del cronograma */}
                {total > 0 && (monto > 0 || cuota > 0) && (
                  <div className="p-3 rounded-xl bg-[#161616] border border-zinc-800/60 space-y-2.5">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{paid} de {total} cuotas pagadas</span>
                      <span className="font-semibold text-zinc-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>

                    {mode === 'CUOTAS' && cuota > 0 && (
                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="text-zinc-500">Cuota mensual</span>
                        <span className="text-indigo-400 font-semibold">{fmt(cuota)}</span>
                      </div>
                    )}

                    {mode === 'INTERES' && resumen?.annualNominalPct != null && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Tasa nominal anual</span>
                          <span className="text-indigo-400 font-semibold">{resumen.annualNominalPct.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Tasa efectiva anual</span>
                          <span className="text-zinc-300">{resumen.annualEffectivePct!.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Intereses totales</span>
                          <span className="text-zinc-300">{fmt(resumen.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Vas a pagar en total</span>
                          <span className="text-zinc-300">{fmt(resumen.totalPaid)}</span>
                        </div>
                      </div>
                    )}

                    {mode === 'INTERES' && monto > 0 && cuota > 0 && cuota * total <= monto && (
                      <p className="text-[10px] text-amber-500/90 pt-1">
                        Con estos números no hay interés. Si la compra es sin recargo, usá «Compra en cuotas».
                      </p>
                    )}
                  </div>
                )}

                {/* Fecha de inicio + Notas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="loan-start" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Fecha de inicio <span className="text-zinc-700 normal-case">(opcional)</span></label>
                    <input
                      id="loan-start" type="date" value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="loan-notes" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Notas <span className="text-zinc-700 normal-case">(opcional)</span></label>
                    <input
                      id="loan-notes" type="text" value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ej. banco, garantía..."
                      className={inputClass}
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {loading ? 'Registrando...' : 'Registrar'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
