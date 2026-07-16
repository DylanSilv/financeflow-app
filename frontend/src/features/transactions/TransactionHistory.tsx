import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactionData } from '@/hooks/useTransactionData';
import { AddTransactionModal } from './AddTransactionModal';
import { EditTransactionModal } from './EditTransactionModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, ArrowDownRight, ArrowUpRight, Trash2, Plus, Filter, Pencil, ChevronLeft, ChevronRight, ArrowRight, Landmark, CreditCard } from 'lucide-react';
import { AddTransferModal } from './AddTransferModal';
import { useTransferData } from '@/hooks/useTransferData';
import { useAccountsCache } from '@/hooks/useAccountsCache';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/hooks/useTransactionData';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function toUTCBounds(date: Date): { dateFrom: string; dateTo: string } {
  const y = date.getFullYear(), m = date.getMonth();
  const from = new Date(Date.UTC(y, m, 1));
  const to   = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo:   to.toISOString().slice(0, 10),
  };
}

interface CreditCardOption { id: string; name: string; }

export const TransactionHistory = () => {
  const [isModalOpen,         setIsModalOpen]         = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { createTransfer } = useTransferData();
  const { accounts } = useAccountsCache();
  const [creditCards,     setCreditCards]     = useState<CreditCardOption[]>([]);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterType,      setFilterType]      = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterCardId,    setFilterCardId]    = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string; amount: number } | null>(null);
  const [editTarget,    setEditTarget]    = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  useEffect(() => {
    supabase.from('Card').select('id, name, type').order('name')
      .then(({ data }) => setCreditCards((data ?? []).filter((c: any) => c.type === 'CREDIT')), () => {});
  }, []);

  const bounds   = selectedMonth ? toUTCBounds(selectedMonth) : {};
  const { transactions, loading, hasMore, refetch, loadMore, deleteTransaction, updateTransaction } = useTransactionData({
    search:    searchTerm || undefined,
    accountId: filterAccountId || undefined,
    cardId:    filterCardId    || undefined,
    type:      filterType === 'ALL' ? undefined : filterType,
    ...bounds,
  });

  const prevMonth = () => setSelectedMonth(d => {
    const base = d ?? new Date();
    return new Date(base.getFullYear(), base.getMonth() - 1);
  });
  const nextMonth = () => setSelectedMonth(d => {
    const base = d ?? new Date();
    const next = new Date(base.getFullYear(), base.getMonth() + 1);
    return next > new Date() ? null : next;
  });

  const monthLabel = selectedMonth
    ? `${MONTHS_ES[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`
    : 'Todos';

  return (
    <div className="flex flex-col gap-8">
      <motion.header {...fadeUp()} className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Historial de Movimientos</h1>
          <p className="text-zinc-400 mt-1">Explora, filtra y administra todas tus transacciones.</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" /> Transferir
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Nuevo Movimiento
          </motion.button>
        </div>
      </motion.header>

      {/* Filtros */}
      <motion.div {...fadeUp(0.1)} className="flex flex-col gap-3">

        {/* Búsqueda + tipo + cuenta */}
        <div className="bg-[#111111] border border-zinc-800 rounded-xl p-2 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Buscar por concepto..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
            />
          </div>

          {accounts.length > 0 && (
            <div className="relative w-full md:w-48">
              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <select
                value={filterAccountId}
                onChange={e => { setFilterAccountId(e.target.value); setFilterCardId(''); }}
                className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Todas las cuentas</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {creditCards.length > 0 && (
            <div className="relative w-full md:w-48">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <select
                value={filterCardId}
                onChange={e => { setFilterCardId(e.target.value); setFilterAccountId(''); }}
                className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Todas las tarjetas</option>
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800 w-full md:w-auto">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map(type => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`flex-1 md:px-6 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  filterType === type ? 'bg-[#1a1a1a] text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {type === 'ALL' ? 'Todos' : type === 'INCOME' ? 'Ingresos' : 'Gastos'}
              </button>
            ))}
          </div>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-zinc-300 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} disabled={!selectedMonth}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-default">
            <ChevronRight className="w-4 h-4" />
          </button>
          {selectedMonth && (
            <button onClick={() => setSelectedMonth(null)}
              className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded-md hover:bg-zinc-800 transition-all">
              Ver todos
            </button>
          )}
        </div>
      </motion.div>

      {/* Lista */}
      <motion.div {...fadeUp(0.15)} className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-[#161616] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-5">Concepto</div>
          <div className="col-span-3">Categoría</div>
          <div className="col-span-2 text-right">Fecha</div>
          <div className="col-span-2 text-right">Monto</div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {loading ? (
            <div className="divide-y divide-zinc-800/50">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <motion.div {...fadeUp()} className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-zinc-800/20 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-zinc-300 font-medium text-lg">No hay movimientos</h3>
              <p className="text-zinc-500 text-sm mt-1">
                {selectedMonth ? `Sin movimientos en ${monthLabel}.` : 'Intenta ajustar los filtros o el término de búsqueda.'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {transactions.map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                  className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-zinc-800/20 transition-colors group"
                >
                  <div className="col-span-5 flex items-center gap-4 w-full">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-100 truncate">{t.title}</h4>
                      <p className="text-xs text-zinc-500 md:hidden mt-0.5">{new Date(t.date).toLocaleDateString('es-UY')}</p>
                    </div>
                  </div>

                  <div className="col-span-3 w-full hidden md:flex items-center gap-2">
                    {t.category && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.category.color }} />
                        <span className="text-sm text-zinc-400">{t.category.name}</span>
                      </>
                    )}
                  </div>

                  <div className="col-span-2 w-full hidden md:block text-right">
                    <span className="text-sm text-zinc-500">
                      {new Date(t.date).toLocaleDateString('es-UY')}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between md:justify-end gap-2 w-full">
                    <span className={`font-semibold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-100'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}${Math.abs(Number(t.amount)).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setEditTarget(t)}
                        aria-label="Editar movimiento"
                        className="p-1.5 text-zinc-500 hover:text-indigo-400 bg-[#161616] border border-zinc-800 md:bg-transparent md:border-transparent rounded-lg transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setPendingDelete({ id: t.id, title: t.title, amount: Number(t.amount) })}
                        aria-label="Eliminar movimiento"
                        className="p-1.5 text-zinc-500 hover:text-red-400 bg-[#161616] border border-zinc-800 md:bg-transparent md:border-transparent rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load more */}
        {!loading && hasMore && (
          <div className="p-4 border-t border-zinc-800/50 flex justify-center">
            <button onClick={loadMore}
              className="text-sm text-zinc-400 hover:text-white px-6 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-all">
              Cargar más
            </button>
          </div>
        )}
      </motion.div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refetch} />

      <AddTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={async (data) => { await createTransfer(data); refetch(); }}
      />

      <EditTransactionModal
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateTransaction}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar movimiento?"
        description={`"${pendingDelete?.title}" — $${pendingDelete?.amount.toFixed(2)}. Esta acción es irreversible.`}
        confirmLabel="Eliminar"
        onConfirm={() => { if (pendingDelete) deleteTransaction(pendingDelete.id); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default TransactionHistory;
