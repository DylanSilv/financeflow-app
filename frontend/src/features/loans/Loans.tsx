import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Clock, TrendingDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useAccountsCache, type AccountOption } from '@/hooks/useAccountsCache';
import { useLoanData, type Loan } from '@/hooks/useLoanData';
import { fmt } from '@/lib/format';

import { AddLoanModal } from './AddLoanModal';
import { EditLoanModal } from './EditLoanModal';
import { LoanCard } from './components/loan-card';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

interface LoanGroupProps {
  label: string;
  loans: Loan[];
  accounts: AccountOption[];
  delay: number;
  columns?: string;
  onPay: (id: string, accountId?: string) => Promise<void>;
  onEdit: (loan: Loan) => void;
  onDelete: (id: string, name: string) => void;
}

function LoanGroup({
  label,
  loans,
  accounts,
  delay,
  columns = 'lg:grid-cols-2',
  onPay,
  onEdit,
  onDelete,
}: LoanGroupProps) {
  if (loans.length === 0) return null;

  return (
    <motion.section {...fadeUp(delay)}>
      <p className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
        {label}
      </p>
      <div className={`grid grid-cols-1 gap-5 ${columns}`}>
        {loans.map((loan, i) => (
          <LoanCard
            key={loan.id}
            loan={loan}
            accounts={accounts}
            index={i}
            onPay={onPay}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </motion.section>
  );
}

export const Loans = () => {
  const { loans, loading, createLoan, updateLoan, payInstallment, deleteLoan } = useLoanData();
  const { accounts } = useAccountsCache();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Loan | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);

  const active = loans.filter(l => l.status === 'ACTIVE');
  const paid = loans.filter(l => l.status !== 'ACTIVE');
  const personal = active.filter(l => l.loanType === 'PERSONAL');
  const purchase = active.filter(l => l.loanType === 'PURCHASE');

  // Sumamos lo que falta desembolsar, no los saldos de capital: es la única
  // magnitud comparable entre compras en cuotas y préstamos con interés.
  const totalRemaining = active.reduce((sum, l) => sum + l.remainingPayments, 0);
  const totalMonthly = active
    .filter(l => !l.paidThisMonth)
    .reduce((sum, l) => sum + l.installmentAmount, 0);

  const summaryCards = [
    { icon: CreditCard, label: 'Compromisos activos', value: String(active.length) },
    { icon: TrendingDown, label: 'Falta pagar en total', value: `$${fmt(totalRemaining)}` },
    { icon: Clock, label: 'Cuotas este mes', value: `$${fmt(totalMonthly)}` },
  ];

  const handleDelete = (id: string, name: string, isActive: boolean) =>
    setPendingDelete({ id, name, isActive });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Préstamos y Cuotas"
        description="Seguí el progreso de tus compromisos financieros."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus /> Nuevo préstamo
          </Button>
        }
      />

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <card.icon className="text-primary size-5" />
                </div>
                {/* min-w-0 deja que el bloque se encoja; sin eso el importe se
                    desborda de la tarjeta en columnas angostas. */}
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-0.5 truncate text-xs">{card.label}</p>
                  <p className="truncate text-xl font-bold tabular-nums lg:text-2xl">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="Sin compromisos registrados"
          description="Agregá un préstamo o una compra en cuotas para seguir su progreso."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Nuevo préstamo
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          <LoanGroup
            label="Préstamos personales"
            loans={personal}
            accounts={accounts}
            delay={0.25}
            onPay={payInstallment}
            onEdit={setEditTarget}
            onDelete={(id, name) => handleDelete(id, name, true)}
          />
          <LoanGroup
            label="Compras en cuotas"
            loans={purchase}
            accounts={accounts}
            delay={personal.length > 0 ? 0.32 : 0.25}
            onPay={payInstallment}
            onEdit={setEditTarget}
            onDelete={(id, name) => handleDelete(id, name, true)}
          />
          <LoanGroup
            label="Finalizados"
            loans={paid}
            accounts={accounts}
            delay={0.35}
            columns="lg:grid-cols-2 2xl:grid-cols-3"
            onPay={payInstallment}
            onEdit={setEditTarget}
            onDelete={(id, name) => handleDelete(id, name, false)}
          />
        </div>
      )}

      <AddLoanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createLoan}
      />

      <EditLoanModal loan={editTarget} onClose={() => setEditTarget(null)} onSave={updateLoan} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar préstamo?"
        description={
          pendingDelete?.isActive
            ? `Se eliminará "${pendingDelete.name}". Los pagos ya registrados se conservan como transacciones individuales.`
            : `Se eliminará "${pendingDelete?.name}" de tu historial.`
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteLoan(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Loans;
