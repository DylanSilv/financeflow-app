import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, Clock, CalendarDays, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AutoPayBanner, type AutoPayEntry } from '@/components/autopay-banner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useFixedExpenseData, type FixedExpense } from '@/hooks/useFixedExpenseData';
import { fmt } from '@/lib/format';

import { AddFixedExpenseModal } from './AddFixedExpenseModal';
import { EditFixedExpenseModal } from './EditFixedExpenseModal';
import { ExpenseRow } from './components/expense-row';
import { usePaymentCards, type PaymentCard } from './components/use-payment-cards';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

interface AutoPayState {
  entries: AutoPayEntry[];
  /** Sólo el disparo manual muestra el banner cuando no hubo nada que pagar. */
  manual: boolean;
}

interface ExpenseSectionProps {
  label: string;
  icon: typeof Clock;
  tone: 'pending' | 'paid';
  expenses: FixedExpense[];
  cards: PaymentCard[];
  onPay: (id: string, accountId?: string) => Promise<void>;
  onRequestEdit: (expense: FixedExpense) => void;
  onRequestDelete: (id: string) => void;
}

function ExpenseSection({
  label,
  icon: Icon,
  tone,
  expenses,
  cards,
  onPay,
  onRequestEdit,
  onRequestDelete,
}: ExpenseSectionProps) {
  if (expenses.length === 0) return null;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const accent = tone === 'paid' ? 'text-success' : 'text-yellow-500';

  return (
    <div>
      <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Icon className={`size-3.5 ${accent}`} />
          <span className={`text-xs font-semibold tracking-widest uppercase ${accent}`}>
            {label}
          </span>
          <Badge variant="secondary">{expenses.length}</Badge>
        </div>
        <span className="text-muted-foreground text-xs font-medium tabular-nums">
          ${fmt(total)}
        </span>
      </div>
      <div className="divide-y">
        {expenses.map((expense, i) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            cards={cards}
            index={i}
            onPay={onPay}
            onRequestEdit={onRequestEdit}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </div>
    </div>
  );
}

export const FixedExpenses = () => {
  const {
    expenses,
    loading,
    updateExpense,
    deleteExpense,
    refetch,
    markAsPaid,
    runAutoPay: runAutoPayRpc,
  } = useFixedExpenseData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FixedExpense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [autoPay, setAutoPay] = useState<AutoPayState | null>(null);
  const [autoPayLoading, setAutoPayLoading] = useState(false);
  const hasRunRef = useRef(false);
  const cards = usePaymentCards();

  const runAutoPay = useCallback(
    async (manual = false) => {
      if (autoPayLoading) return;
      setAutoPayLoading(true);
      try {
        const result = await runAutoPayRpc();
        if (result.count > 0 || manual) {
          setAutoPay({ entries: result.paid, manual });
          if (result.count > 0) refetch();
        }
      } catch (err) {
        console.error('run_autopay falló:', err);
        if (manual) setAutoPay({ entries: [], manual: true });
      } finally {
        setAutoPayLoading(false);
      }
    },
    [autoPayLoading, runAutoPayRpc, refetch],
  );

  // AutoPay corre una sola vez al entrar a la pantalla.
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    void runAutoPay();
  }, [runAutoPay]);

  const handlePay = async (id: string, accountId?: string) => {
    await markAsPaid(id, accountId);
    refetch();
  };

  const pending = expenses
    .filter(e => e.status !== 'PAID')
    .sort((a, b) => a.dueDate - b.dueDate);
  const paid = expenses.filter(e => e.status === 'PAID').sort((a, b) => a.dueDate - b.dueDate);

  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = paid.reduce((sum, e) => sum + e.amount, 0);
  const paidPct = totalMonthly > 0 ? (totalPaid / totalMonthly) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cuentas Fijas"
        description="Seguimiento de tus pagos recurrentes del mes."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => runAutoPay(true)}
              disabled={autoPayLoading}
              title="Procesar pagos automáticos ahora"
            >
              <Zap className={autoPayLoading ? 'animate-pulse' : undefined} />
              AutoPay
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Nueva cuenta fija
            </Button>
          </div>
        }
      />

      {autoPay && (
        <AutoPayBanner
          entries={autoPay.entries}
          showWhenEmpty={autoPay.manual}
          onDismiss={() => setAutoPay(null)}
        />
      )}

      <motion.div {...fadeUp(0.1)}>
        <Card className="from-primary/5 to-card dark:bg-card bg-gradient-to-t">
          <CardContent>
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-muted-foreground mb-1 text-xs tracking-widest uppercase">
                  Progreso del mes
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">${fmt(totalPaid)}</span>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    de ${fmt(totalMonthly)} total mensual
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-2xl font-bold tabular-nums">{Math.round(paidPct)}%</span>
                <p className="text-muted-foreground text-xs">pagado</p>
              </div>
            </div>

            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <motion.div
                className="from-chart-balance to-success h-full rounded-full bg-gradient-to-r"
                initial={{ width: 0 }}
                animate={{ width: `${paidPct}%` }}
                transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
              />
            </div>

            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground text-xs">{paid.length} pagadas</span>
              <span className="text-muted-foreground text-xs">{pending.length} pendientes</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <Skeleton className="h-[320px] w-full rounded-xl" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sin cuentas fijas"
          description="Cargá tus pagos recurrentes para seguirlos mes a mes."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Nueva cuenta fija
            </Button>
          }
        />
      ) : (
        <motion.div {...fadeUp(0.15)}>
          <Card className="gap-0 overflow-hidden py-0">
            {/* Encabezado de columnas: se corresponde con los anchos de ExpenseRow. */}
            <div className="text-muted-foreground bg-muted/30 hidden items-center gap-4 border-b px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase sm:flex">
              <div className="w-5" />
              <div className="flex-1">Servicio</div>
              <div className="w-24 text-center">Vence</div>
              <div className="w-24 text-right">Monto</div>
              <div className="w-36 text-right">Estado</div>
            </div>

            <ExpenseSection
              label="Pendientes"
              icon={Clock}
              tone="pending"
              expenses={pending}
              cards={cards}
              onPay={handlePay}
              onRequestEdit={setEditTarget}
              onRequestDelete={setPendingDelete}
            />
            <ExpenseSection
              label="Pagadas"
              icon={CheckCircle2}
              tone="paid"
              expenses={paid}
              cards={cards}
              onPay={handlePay}
              onRequestEdit={setEditTarget}
              onRequestDelete={setPendingDelete}
            />
          </Card>
        </motion.div>
      )}

      <AddFixedExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />

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
        onConfirm={() => {
          if (pendingDelete) deleteExpense(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default FixedExpenses;
