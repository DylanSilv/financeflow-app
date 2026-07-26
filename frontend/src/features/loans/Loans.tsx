import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, Clock, TrendingDown, Wallet, Trash2, Plus, Pencil } from 'lucide-react';
import { useLoanData, Loan } from '@/hooks/useLoanData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddLoanModal } from './AddLoanModal';
import { EditLoanModal } from './EditLoanModal';
import { useAccountsCache } from '@/hooks/useAccountsCache';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

import type { AccountOption as Account } from '@/hooks/useAccountsCache';

function LoanCard({ loan, accounts, onPay, onEdit, onDelete, index }: {
  loan:     Loan;
  accounts: Account[];
  onPay:    (id: string, accountId?: string) => Promise<void>;
  onEdit:   (loan: Loan) => void;
  onDelete: (id: string, name: string) => void;
  index:    number;
}) {
  const [paying,    setPaying]    = useState(false);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [loading,   setLoading]   = useState(false);
  const [payError,  setPayError]  = useState<string | null>(null);

  const isCompleted = loan.status === 'PAID' || loan.paidInstallments >= loan.totalInstallments;
  const remaining   = loan.totalInstallments - loan.paidInstallments;

  const handlePay = async () => {
    setLoading(true);
    setPayError(null);
    try {
      await onPay(loan.id, accountId || undefined);
      setPaying(false);
    } catch (err) {
      console.error('pay_loan_installment falló:', err);
      setPayError('No se pudo registrar el pago. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const barColor = isCompleted ? '#10b981'
    : loan.progress > 75 ? '#f59e0b'
    : '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-[#111111] border rounded-2xl p-5 flex flex-col gap-4 transition-colors ${
        isCompleted ? 'border-zinc-800/50 opacity-70' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-semibold text-white truncate">{loan.name}</h3>
            {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
          </div>
          <span className="text-xs text-zinc-500">
            {loan.loanType === 'PERSONAL' ? 'Préstamo personal' : 'Compra en cuotas'}
          </span>
        </div>
        <div className="flex items-start gap-1.5 sm:gap-3 shrink-0 pl-2">
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-0.5">Cuota</p>
            <p className="text-lg font-bold text-white">
              ${loan.installmentAmount.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button onClick={() => onEdit(loan)}
            className="mt-0.5 p-1.5 text-zinc-700 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
            aria-label="Editar préstamo"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(loan.id, loan.name)}
            className="mt-0.5 p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            aria-label="Eliminar préstamo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progreso */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-500">{loan.paidInstallments} de {loan.totalInstallments} cuotas pagadas</span>
          <span className="font-semibold" style={{ color: barColor }}>{loan.progress}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${loan.progress}%` }}
            transition={{ duration: 0.9, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
            style={{ backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Detalle */}
      <div className="grid grid-cols-3 gap-3">
        {[
          // Con interés mostramos el saldo de capital, que es lo que costaría
          // cancelar hoy. Sin interés ese concepto no existe y lo único con
          // sentido es lo que falta desembolsar.
          loan.principalBalance != null
            ? { label: 'Saldo de capital', value: `$${loan.principalBalance.toLocaleString('es-UY', { maximumFractionDigits: 0 })}` }
            : { label: 'Falta pagar',      value: `$${loan.remainingPayments.toLocaleString('es-UY', { maximumFractionDigits: 0 })}` },
          { label: 'Cuotas restantes', value: String(remaining) },
          loan.interestRate != null
            ? { label: 'Tasa anual', value: `${loan.interestRate.toFixed(2)}%` }
            : { label: 'Total',      value: `$${loan.originalAmount.toLocaleString('es-UY', { maximumFractionDigits: 0 })}` },
        ].map((item, di) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.07 + 0.1 + di * 0.05 }}
            className="bg-zinc-900/50 rounded-xl p-3 text-center"
          >
            <p className="text-[10px] text-zinc-500 mb-1">{item.label}</p>
            <p className="text-sm font-semibold text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Acción pagar cuota */}
      {!isCompleted && (
        <AnimatePresence mode="wait">
          {paying ? (
            <motion.div
              key="pay-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              <div className="flex gap-2">
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="flex-1 bg-[#0a0a0a] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="">Sin registrar en cuenta</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePay}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Confirmar'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setPaying(false); setPayError(null); }}
                  className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  ✕
                </motion.button>
              </div>
              {payError && (
                <p className="text-xs text-red-400 px-1">{payError}</p>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="pay-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPaying(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Pagar cuota {loan.paidInstallments + 1}/{loan.totalInstallments}
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export const Loans = () => {
  const { loans, loading, createLoan, updateLoan, payInstallment, deleteLoan } = useLoanData();
  const { accounts } = useAccountsCache();
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editTarget,    setEditTarget]    = useState<Loan | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  const active   = loans.filter(l => l.status === 'ACTIVE');
  const paid     = loans.filter(l => l.status !== 'ACTIVE');

  const personal = active.filter(l => l.loanType === 'PERSONAL');
  const purchase = active.filter(l => l.loanType === 'PURCHASE');

  // Sumamos lo que falta desembolsar, no los saldos de capital: es la única
  // magnitud comparable entre compras en cuotas y préstamos con interés.
  const totalRemaining  = active.reduce((s, l) => s + l.remainingPayments, 0);
  const pendingMonthly  = active.filter(l => !l.paidThisMonth);
  const totalMonthly    = pendingMonthly.reduce((s, l) => s + l.installmentAmount, 0);

  const summaryCards = [
    { icon: CreditCard,  color: 'indigo',  label: 'Compromisos activos',  value: String(active.length) },
    { icon: TrendingDown, color: 'red',    label: 'Falta pagar en total',  value: `$${totalRemaining.toLocaleString('es-UY', { maximumFractionDigits: 0 })}` },
    { icon: Clock,        color: 'yellow', label: 'Cuotas este mes',       value: `$${totalMonthly.toLocaleString('es-UY', { minimumFractionDigits: 0 })}` },
  ];

  const iconColor: Record<string, string> = {
    indigo: 'text-indigo-400',
    red:    'text-red-400',
    yellow: 'text-yellow-400',
  };
  const bgColor: Record<string, string> = {
    indigo: 'bg-indigo-500/10',
    red:    'bg-red-500/10',
    yellow: 'bg-yellow-500/10',
  };

  return (
    <div className="flex flex-col gap-8">
      <motion.header {...fadeUp()} className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Préstamos y Cuotas</h1>
          <p className="text-zinc-400 mt-1">Seguí el progreso de tus compromisos financieros.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Préstamo
        </motion.button>
      </motion.header>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#111111] border border-zinc-800 p-5 rounded-2xl flex items-center gap-4"
          >
            <div className={`w-11 h-11 ${bgColor[card.color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`w-5 h-5 ${iconColor[card.color]}`} />
            </div>
            {/* min-w-0 deja que el bloque se encoja; sin eso el importe se
                desborda de la tarjeta en columnas angostas. */}
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 mb-0.5 truncate">{card.label}</p>
              <p className="text-xl lg:text-2xl font-bold text-white truncate">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-2 w-full" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(j => <Skeleton key={j} className="h-14 rounded-xl" />)}
              </div>
              <Skeleton className="h-10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Préstamos personales activos */}
          {personal.length > 0 && (
            <motion.div {...fadeUp(0.25)}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                Préstamos personales
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {personal.map((l, i) => (
                  <LoanCard key={l.id} loan={l} accounts={accounts} onPay={payInstallment} index={i}
                    onEdit={setEditTarget}
                    onDelete={(id, name) => setPendingDelete({ id, name, isActive: true })} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Compras en cuotas activas */}
          {purchase.length > 0 && (
            <motion.div {...fadeUp(personal.length > 0 ? 0.32 : 0.25)}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                Compras en cuotas
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {purchase.map((l, i) => (
                  <LoanCard key={l.id} loan={l} accounts={accounts} onPay={payInstallment} index={i}
                    onEdit={setEditTarget}
                    onDelete={(id, name) => setPendingDelete({ id, name, isActive: true })} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Pagados */}
          {paid.length > 0 && (
            <motion.div {...fadeUp(0.35)}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                Finalizados
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                {paid.map((l, i) => (
                  <LoanCard key={l.id} loan={l} accounts={accounts} onPay={payInstallment} index={i}
                    onEdit={setEditTarget}
                    onDelete={(id, name) => setPendingDelete({ id, name, isActive: false })} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
      <AddLoanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={createLoan} />

      <EditLoanModal
        loan={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateLoan}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar préstamo?"
        description={
          pendingDelete?.isActive
            ? `Se eliminará "${pendingDelete.name}". Los pagos ya registrados se conservan como transacciones individuales.`
            : `Se eliminará "${pendingDelete?.name}" de tu historial.`
        }
        confirmLabel="Eliminar"
        onConfirm={() => { if (pendingDelete) deleteLoan(pendingDelete.id); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Loans;
