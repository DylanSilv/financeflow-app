import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Clock, RefreshCw, Trash2, ChevronRight, CreditCard, X, Pencil, Zap } from 'lucide-react';
import { useFixedExpenseData, FixedExpense } from '@/hooks/useFixedExpenseData';
import { AddFixedExpenseModal } from './AddFixedExpenseModal';
import { EditFixedExpenseModal } from './EditFixedExpenseModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase';

interface AutoPayResult {
  count: number;
  paid: { id: string; name: string; amount: number }[];
}

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

interface CardOption {
  id:        string;
  name:      string;
  balance:   number;
  color:     string;
  accountId: string | null;
}

function useCards() {
  const [cards, setCards] = useState<CardOption[]>([]);
  useEffect(() => {
    supabase.rpc('get_cards')
      .then(({ data }) => setCards((data as CardOption[]) ?? []), () => {});
  }, []);
  return cards;
}

// ─── Fila individual ─────────────────────────────────────────

function ExpenseRow({
  expense,
  cards,
  index,
  onPay,
  onToggleAutoPay: _onToggleAutoPay,
  onRequestEdit,
  onRequestDelete,
}: {
  expense:          FixedExpense;
  cards:            CardOption[];
  index:            number;
  onPay:            (id: string, accountId?: string) => Promise<void>;
  onToggleAutoPay:  (id: string) => Promise<void>;
  onRequestEdit:    (expense: FixedExpense) => void;
  onRequestDelete:  (id: string) => void;
}) {
  const [showPay,      setShowPay]      = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);
  const [paying,       setPaying]       = useState(false);
  const [payError,     setPayError]     = useState<string | null>(null);

  const isPaid    = expense.status === 'PAID';
  const isOverdue = expense.status === 'OVERDUE';
  const hasCuotas = expense.paidInstallments !== null && expense.totalInstallments !== null;
  const pct       = hasCuotas
    ? Math.round((expense.paidInstallments! / expense.totalInstallments!) * 100) : 0;

  const handleOpenPay = () => {
    const first = cards.find(c => c.accountId) ?? cards[0] ?? null;
    setSelectedCard(first);
    setShowPay(true);
  };

  const handleConfirm = async () => {
    setPaying(true);
    setPayError(null);
    try {
      await onPay(expense.id, selectedCard?.accountId ?? undefined);
      setShowPay(false);
    } catch (err) {
      console.error('pago de gasto fijo falló:', err);
      setPayError('No se pudo registrar el pago. Intentá de nuevo.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
      className={`transition-colors group ${isPaid ? 'hover:bg-zinc-800/20' : 'hover:bg-zinc-800/30'}`}
    >
      {/* Fila principal */}
      <div className="flex items-center gap-4 px-4 py-3.5">
        {/* Indicador de estado */}
        <div className="flex-shrink-0 w-5 flex justify-center">
          {isPaid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : isOverdue ? (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-0.5" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70 mt-0.5" />
          )}
        </div>

        {/* Nombre + info cuotas */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium truncate ${isPaid ? 'text-zinc-400' : 'text-zinc-100'}`}>
              {expense.name}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0 border border-red-500/20">
                Vencida
              </span>
            )}
            {expense.loanName && (
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                cuotas
              </span>
            )}
            {expense.autoPay && (
              <RefreshCw className="w-3 h-3 text-indigo-400/60 flex-shrink-0" />
            )}
          </div>
          {hasCuotas && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-24 bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : '#6366f1' }} />
              </div>
              <span className="text-[10px] text-zinc-500">
                {expense.paidInstallments}/{expense.totalInstallments} cuotas
              </span>
            </div>
          )}
        </div>

        {/* Día de vencimiento + último pago */}
        <div className="hidden sm:block flex-shrink-0 w-24 text-center">
          <span className="text-xs text-zinc-500">día {expense.dueDate}</span>
          {expense.lastPaidAt && (
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Últ. {new Date(expense.lastPaidAt).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>

        {/* Monto */}
        <div className="flex-shrink-0 w-24 text-right">
          <span className={`text-sm font-semibold tabular-nums ${
            isPaid ? 'text-zinc-500' : isOverdue ? 'text-red-400' : 'text-zinc-100'
          }`}>
            ${expense.amount.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex-shrink-0 flex items-center justify-end gap-1 w-36">
          {/* Iconos editar/borrar: aparecen en hover sin empujar el botón Pagar */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={() => onRequestEdit(expense)} aria-label="Editar cuenta fija"
              className="p-1.5 text-zinc-700 hover:text-indigo-400 transition-all rounded-lg hover:bg-indigo-400/10"
            >
              <Pencil className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={() => onRequestDelete(expense.id)} aria-label="Eliminar cuenta fija"
              className="p-1.5 text-zinc-700 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {isPaid ? (
            <span className="text-xs text-emerald-500/80 font-medium whitespace-nowrap">✓ pagado</span>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenPay}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              Pagar <ChevronRight className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Panel de pago con animación */}
      <AnimatePresence>
        {showPay && (
          <motion.div
            key="pay-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 bg-[#0f0f0f] border border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">
                    Pagar <span className="text-indigo-400">${expense.amount.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</span> desde...
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPay(false)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Selector de tarjetas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cards.map(card => (
                  <motion.button
                    key={card.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCard(card)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedCard?.id === card.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-zinc-800 hover:border-zinc-600 bg-[#161616]'
                    }`}
                  >
                    <div className={`w-8 h-6 rounded-md bg-gradient-to-br ${card.color} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-200 truncate">{card.name}</p>
                      <p className={`text-xs font-semibold tabular-nums ${
                        card.balance < expense.amount ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        ${card.balance.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {selectedCard?.id === card.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    )}
                  </motion.button>
                ))}

                {/* Opción sin tarjeta */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCard(null)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedCard === null && showPay
                      ? 'border-zinc-600 bg-zinc-800/40'
                      : 'border-zinc-800 hover:border-zinc-600 bg-[#161616]'
                  }`}
                >
                  <div className="w-8 h-6 rounded-md bg-zinc-700 flex-shrink-0 flex items-center justify-center">
                    <span className="text-zinc-500 text-[9px]">—</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Sin tarjeta</p>
                    <p className="text-[10px] text-zinc-600">Solo marca pagado</p>
                  </div>
                </motion.button>
              </div>

              {/* Saldo post-pago */}
              {selectedCard && selectedCard.accountId && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                    selectedCard.balance - expense.amount < 0
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-zinc-800/40 border border-zinc-700/50'
                  }`}
                >
                  <span className="text-zinc-400">Saldo después del pago</span>
                  <span className={`font-semibold tabular-nums ${
                    selectedCard.balance - expense.amount < 0 ? 'text-red-400' : 'text-zinc-200'
                  }`}>
                    ${(selectedCard.balance - expense.amount).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                    {selectedCard.balance - expense.amount < 0 && ' ⚠'}
                  </span>
                </motion.div>
              )}

              {/* Error de pago */}
              {payError && (
                <p className="text-xs text-red-400 px-1">{payError}</p>
              )}

              {/* Confirmar */}
              <div className="flex gap-2 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  disabled={paying}
                  className="flex-1 bg-white text-black font-semibold py-2 rounded-lg text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {paying ? 'Registrando...' : `Confirmar pago${selectedCard ? ` — ${selectedCard.name}` : ''}`}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPay(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────

export const FixedExpenses = () => {
  const { expenses, loading, updateExpense, toggleAutoPay, deleteExpense, refetch, markAsPaid, runAutoPay: _runAutoPay } = useFixedExpenseData();
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [editTarget,     setEditTarget]     = useState<FixedExpense | null>(null);
  const [pendingDelete,  setPendingDelete]  = useState<string | null>(null);
  const [autoPayResult,  setAutoPayResult]  = useState<AutoPayResult | null>(null);
  const [autoPayLoading, setAutoPayLoading] = useState(false);
  const hasRunRef = useRef(false);
  const cards = useCards();

  const runAutoPay = async (manual = false) => {
    if (autoPayLoading) return;
    setAutoPayLoading(true);
    try {
      const result = await _runAutoPay();
      if (result.count > 0 || manual) {
        setAutoPayResult(result);
        if (result.count > 0) refetch();
      }
    } catch (err) {
      console.error('run_autopay falló:', err);
      if (manual) setAutoPayResult({ count: 0, paid: [] });
    } finally {
      setAutoPayLoading(false);
    }
  };

  // Ejecutar AutoPay una vez al montar la página
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    runAutoPay();
  }, []);

  const handlePay = async (id: string, accountId?: string) => {
    await markAsPaid(id, accountId);
    refetch();
  };

  const pending = expenses.filter(e => e.status !== 'PAID').sort((a, b) => a.dueDate - b.dueDate);
  const paid    = expenses.filter(e => e.status === 'PAID').sort((a, b) => a.dueDate - b.dueDate);

  const totalMonthly = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid    = paid.reduce((s, e) => s + e.amount, 0);
  const paidPct      = totalMonthly > 0 ? (totalPaid / totalMonthly) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <motion.header {...fadeUp()} className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Cuentas Fijas</h1>
          <p className="text-zinc-400 mt-1">Seguimiento de tus pagos recurrentes del mes.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => runAutoPay(true)}
            disabled={autoPayLoading}
            title="Procesar pagos automáticos ahora"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-zinc-700 text-zinc-400 hover:text-white hover:border-indigo-500 transition-colors disabled:opacity-40"
          >
            <Zap className={`w-4 h-4 ${autoPayLoading ? 'animate-pulse text-indigo-400' : ''}`} />
            AutoPay
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Nueva Cuenta Fija
          </motion.button>
        </div>
      </motion.header>

      {/* Banner AutoPay */}
      <AnimatePresence>
        {autoPayResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
              autoPayResult.count > 0
                ? 'bg-indigo-500/10 border-indigo-500/30'
                : 'bg-zinc-800/40 border-zinc-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <Zap className={`w-4 h-4 mt-0.5 flex-shrink-0 ${autoPayResult.count > 0 ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <div>
                {autoPayResult.count > 0 ? (
                  <>
                    <p className="text-sm font-medium text-indigo-300">
                      AutoPay procesó {autoPayResult.count} pago{autoPayResult.count !== 1 ? 's' : ''} automáticamente
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {autoPayResult.paid.map(p =>
                        `${p.name} ($${p.amount.toLocaleString('es-UY', { minimumFractionDigits: 0 })})`
                      ).join(' · ')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400">No hay pagos automáticos pendientes por hoy.</p>
                )}
              </div>
            </div>
            <button onClick={() => setAutoPayResult(null)} className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumen del mes */}
      <motion.div {...fadeUp(0.1)} className="bg-[#111111] border border-zinc-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Progreso del mes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                ${totalPaid.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-zinc-500 text-sm">
                de ${totalMonthly.toLocaleString('es-UY', { minimumFractionDigits: 0 })} total mensual
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-bold text-white">{Math.round(paidPct)}%</span>
            <p className="text-xs text-zinc-500">pagado</p>
          </div>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${paidPct}%` }}
            transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-zinc-600">{paid.length} pagadas</span>
          <span className="text-xs text-zinc-600">{pending.length} pendientes</span>
        </div>
      </motion.div>

      {/* Lista */}
      {loading ? (
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-zinc-800/30">
              <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-16 hidden sm:block" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div {...fadeUp(0.15)} className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">

          {/* Columnas header */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-b border-zinc-800/60 bg-[#0f0f0f]">
            <div className="w-5" />
            <div className="flex-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Servicio</div>
            <div className="w-24 text-center text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Vence</div>
            <div className="w-24 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Monto</div>
            <div className="w-36 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Estado</div>
          </div>

          {/* Sección pendientes */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/5 border-b border-zinc-800/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-yellow-500/70" />
                  <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-widest">
                    Pendientes
                  </span>
                  <span className="text-xs bg-yellow-500/10 text-yellow-500/70 px-1.5 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  ${pending.reduce((s, e) => s + e.amount, 0).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="divide-y divide-zinc-800/30">
                {pending.map((e, i) => (
                  <ExpenseRow
                    key={e.id} expense={e} cards={cards} index={i}
                    onPay={handlePay}
                    onToggleAutoPay={toggleAutoPay}
                    onRequestEdit={setEditTarget}
                    onRequestDelete={setPendingDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sección pagadas */}
          {paid.length > 0 && (
            <div className={pending.length > 0 ? 'border-t border-zinc-800/60' : ''}>
              <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/5 border-b border-zinc-800/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                  <span className="text-xs font-semibold text-emerald-500/80 uppercase tracking-widest">Pagadas</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-500/70 px-1.5 py-0.5 rounded-full">{paid.length}</span>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  ${totalPaid.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="divide-y divide-zinc-800/20">
                {paid.map((e, i) => (
                  <ExpenseRow
                    key={e.id} expense={e} cards={cards} index={i}
                    onPay={handlePay}
                    onToggleAutoPay={toggleAutoPay}
                    onRequestEdit={setEditTarget}
                    onRequestDelete={setPendingDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {expenses.length === 0 && (
            <div className="py-16 text-center text-zinc-600">
              <p className="text-sm">No hay cuentas fijas registradas.</p>
            </div>
          )}
        </motion.div>
      )}

      <AddFixedExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refetch} />

      <EditFixedExpenseModal
        expense={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateExpense}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar cuenta fija?"
        description="Se eliminará el servicio y sus datos de cuotas asociados. Esta acción es irreversible."
        confirmLabel="Eliminar"
        onConfirm={() => { if (pendingDelete) deleteExpense(pendingDelete); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default FixedExpenses;
