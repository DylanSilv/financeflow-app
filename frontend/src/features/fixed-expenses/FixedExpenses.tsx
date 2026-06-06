import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, RefreshCw, Trash2, ChevronRight, CreditCard, X } from 'lucide-react';
import { useFixedExpenseData, FixedExpense } from '@/hooks/useFixedExpenseData';
import { AddFixedExpenseModal } from './AddFixedExpenseModal';
import { api } from '@/lib/axios';

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
    api.get<CardOption[]>('/cards').then(r => setCards(r.data)).catch(() => {});
  }, []);
  return cards;
}

// ─── Fila individual ─────────────────────────────────────────

function ExpenseRow({
  expense,
  cards,
  onPay,
  onToggleAutoPay,
  onDelete,
}: {
  expense:         FixedExpense;
  cards:           CardOption[];
  onPay:           (id: string, accountId?: string) => Promise<void>;
  onToggleAutoPay: (id: string) => Promise<void>;
  onDelete:        (id: string) => Promise<void>;
}) {
  const [showPay,      setShowPay]      = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);
  const [paying,       setPaying]       = useState(false);

  const isPaid    = expense.status === 'PAID';
  const isOverdue = expense.status === 'OVERDUE';
  const hasCuotas = expense.paidInstallments !== null && expense.totalInstallments !== null;
  const pct       = hasCuotas
    ? Math.round((expense.paidInstallments! / expense.totalInstallments!) * 100) : 0;

  // Al abrir el selector, preseleccionar primera tarjeta con cuenta vinculada
  const handleOpenPay = () => {
    const first = cards.find(c => c.accountId) ?? cards[0] ?? null;
    setSelectedCard(first);
    setShowPay(true);
  };

  const handleConfirm = async () => {
    setPaying(true);
    try {
      await onPay(expense.id, selectedCard?.accountId ?? undefined);
      setShowPay(false);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={`transition-colors group ${isPaid ? 'hover:bg-zinc-800/20' : 'hover:bg-zinc-800/30'}`}>
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
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${isPaid ? 'text-zinc-400' : 'text-zinc-100'}`}>
              {expense.name}
            </span>
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

        {/* Día de vencimiento */}
        <div className="hidden sm:block flex-shrink-0 w-16 text-center">
          <span className="text-xs text-zinc-500">día {expense.dueDate}</span>
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
        <div className="flex-shrink-0 flex items-center gap-1 w-28 justify-end">
          {isPaid ? (
            <span className="text-xs text-emerald-500/80 font-medium">✓ pagado</span>
          ) : (
            <button
              onClick={handleOpenPay}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              Pagar <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1.5 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-400/10"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini menú de selección de tarjeta */}
      {showPay && (
        <div className="mx-4 mb-3 bg-[#0f0f0f] border border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-white">
                Pagar <span className="text-indigo-400">${expense.amount.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</span> desde...
              </span>
            </div>
            <button onClick={() => setShowPay(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de tarjetas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedCard?.id === card.id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-800 hover:border-zinc-600 bg-[#161616]'
                }`}
              >
                {/* Chip de color de la tarjeta */}
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
              </button>
            ))}

            {/* Opción sin tarjeta */}
            <button
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
            </button>
          </div>

          {/* Saldo post-pago de la tarjeta seleccionada */}
          {selectedCard && selectedCard.accountId && (
            <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
              selectedCard.balance - expense.amount < 0
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-zinc-800/40 border border-zinc-700/50'
            }`}>
              <span className="text-zinc-400">Saldo después del pago</span>
              <span className={`font-semibold tabular-nums ${
                selectedCard.balance - expense.amount < 0 ? 'text-red-400' : 'text-zinc-200'
              }`}>
                ${(selectedCard.balance - expense.amount).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                {selectedCard.balance - expense.amount < 0 && ' ⚠'}
              </span>
            </div>
          )}

          {/* Confirmar */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirm}
              disabled={paying}
              className="flex-1 bg-white text-black font-semibold py-2 rounded-lg text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {paying ? 'Registrando...' : `Confirmar pago${ selectedCard ? ` — ${selectedCard.name}` : ''}`}
            </button>
            <button
              onClick={() => setShowPay(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────

export const FixedExpenses = () => {
  const { expenses, loading, markAsPaid, toggleAutoPay, deleteExpense, refetch } = useFixedExpenseData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cards = useCards();

  // onPay con accountId opcional
  const handlePay = async (id: string, accountId?: string) => {
    if (accountId) {
      // Llamar directamente al API con accountId
      await api.patch(`/fixed-expenses/${id}/pay`, { accountId });
      refetch();
    } else {
      await markAsPaid(id);
    }
  };

  const pending = expenses.filter(e => e.status !== 'PAID').sort((a, b) => a.dueDate - b.dueDate);
  const paid    = expenses.filter(e => e.status === 'PAID').sort((a, b) => a.dueDate - b.dueDate);

  const totalMonthly = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid    = paid.reduce((s, e) => s + e.amount, 0);
  const paidPct      = totalMonthly > 0 ? (totalPaid / totalMonthly) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Cuentas Fijas</h1>
          <p className="text-zinc-400 mt-1">Seguimiento de tus pagos recurrentes del mes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Nueva Cuenta
        </button>
      </header>

      {/* Resumen del mes */}
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-5">
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
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-500 to-emerald-500"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-zinc-600">{paid.length} pagadas</span>
          <span className="text-xs text-zinc-600">{pending.length} pendientes</span>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-zinc-500 py-12">Cargando cuentas fijas...</div>
      ) : (
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">

          {/* Columnas header */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-b border-zinc-800/60 bg-[#0f0f0f]">
            <div className="w-5" />
            <div className="flex-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Servicio</div>
            <div className="w-16 text-center text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Vence</div>
            <div className="w-24 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Monto</div>
            <div className="w-28 text-right text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Estado</div>
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
                {pending.map(e => (
                  <ExpenseRow
                    key={e.id} expense={e} cards={cards}
                    onPay={handlePay}
                    onToggleAutoPay={toggleAutoPay}
                    onDelete={deleteExpense}
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
                  <span className="text-xs font-semibold text-emerald-500/80 uppercase tracking-widest">
                    Pagadas
                  </span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-500/70 px-1.5 py-0.5 rounded-full">
                    {paid.length}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  ${totalPaid.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="divide-y divide-zinc-800/20">
                {paid.map(e => (
                  <ExpenseRow
                    key={e.id} expense={e} cards={cards}
                    onPay={handlePay}
                    onToggleAutoPay={toggleAutoPay}
                    onDelete={deleteExpense}
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
        </div>
      )}

      <AddFixedExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default FixedExpenses;
