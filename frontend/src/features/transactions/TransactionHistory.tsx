import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useAccountsCache } from '@/hooks/useAccountsCache';
import { useTransactionData, type Transaction } from '@/hooks/useTransactionData';
import { useTransferData } from '@/hooks/useTransferData';
import { fmtDec } from '@/lib/format';

import { AddTransactionModal } from './AddTransactionModal';
import { AddTransferModal } from './AddTransferModal';
import { EditTransactionModal } from './EditTransactionModal';
import { TransactionTable } from './components/transaction-table';
import {
  ALL_OPTION,
  TransactionFilters,
  type TypeFilter,
} from './components/transaction-filters';
import { useCreditCards } from './components/use-credit-cards';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Primer y último día del mes en UTC, que es como los guarda la DB. */
function toUTCBounds(date: Date): { dateFrom: string; dateTo: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  return {
    dateFrom: new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10),
    dateTo: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59)).toISOString().slice(0, 10),
  };
}

export const TransactionHistory = () => {
  const { createTransfer } = useTransferData();
  const { accounts } = useAccountsCache();
  const creditCards = useCreditCards();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TypeFilter>('ALL');
  const [filterAccountId, setFilterAccountId] = useState(ALL_OPTION);
  const [filterCardId, setFilterCardId] = useState(ALL_OPTION);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const bounds = selectedMonth ? toUTCBounds(selectedMonth) : {};
  const {
    transactions,
    loading,
    hasMore,
    refetch,
    loadMore,
    deleteTransaction,
    updateTransaction,
  } = useTransactionData({
    search: searchTerm || undefined,
    accountId: filterAccountId === ALL_OPTION ? undefined : filterAccountId,
    cardId: filterCardId === ALL_OPTION ? undefined : filterCardId,
    type: filterType === 'ALL' ? undefined : filterType,
    ...bounds,
  });

  const prevMonth = () =>
    setSelectedMonth(d => {
      const base = d ?? new Date();
      return new Date(base.getFullYear(), base.getMonth() - 1);
    });

  const nextMonth = () =>
    setSelectedMonth(d => {
      const base = d ?? new Date();
      const next = new Date(base.getFullYear(), base.getMonth() + 1);
      return next > new Date() ? null : next;
    });

  const monthLabel = selectedMonth
    ? `${MONTHS_ES[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`
    : 'Todos';

  // Cuenta y tarjeta se excluyen: filtrar por ambas no devolvería nada.
  const handleAccountChange = (value: string) => {
    setFilterAccountId(value);
    setFilterCardId(ALL_OPTION);
  };
  const handleCardChange = (value: string) => {
    setFilterCardId(value);
    setFilterAccountId(ALL_OPTION);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial de Movimientos"
        description="Explorá, filtrá y administrá todas tus transacciones."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(true)}>
              <ArrowRight /> Transferir
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Nuevo movimiento
            </Button>
          </div>
        }
      />

      <motion.div {...fadeUp(0.1)}>
        <TransactionFilters
          search={searchTerm}
          onSearchChange={setSearchTerm}
          accounts={accounts}
          accountId={filterAccountId}
          onAccountChange={handleAccountChange}
          creditCards={creditCards}
          cardId={filterCardId}
          onCardChange={handleCardChange}
          type={filterType}
          onTypeChange={setFilterType}
          monthLabel={monthLabel}
          hasMonth={selectedMonth !== null}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onClearMonth={() => setSelectedMonth(null)}
        />
      </motion.div>

      <motion.div {...fadeUp(0.15)}>
        <Card className="gap-0 overflow-hidden py-0">
          {loading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="hidden h-4 w-20 md:block" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No hay movimientos"
              description={
                selectedMonth
                  ? `Sin movimientos en ${monthLabel}.`
                  : 'Probá ajustar los filtros o el término de búsqueda.'
              }
            />
          ) : (
            <>
              <TransactionTable
                transactions={transactions}
                onEdit={setEditTarget}
                onDelete={setPendingDelete}
              />
              {hasMore && (
                <div className="flex justify-center border-t p-4">
                  <Button variant="secondary" onClick={loadMore}>
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />

      <AddTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={async data => {
          await createTransfer(data);
          refetch();
        }}
      />

      <EditTransactionModal
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateTransaction}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar movimiento?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" — $${fmtDec(Math.abs(Number(pendingDelete.amount)))}. Esta acción es irreversible.`
            : undefined
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteTransaction(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default TransactionHistory;
