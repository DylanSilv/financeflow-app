import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Pencil, Trash2, Wallet, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AccountOption } from '@/hooks/useAccountsCache';
import type { Loan } from '@/hooks/useLoanData';
import { fmt, fmtDec } from '@/lib/format';
import { cn } from '@/lib/utils';

const NO_ACCOUNT = 'none';

/** Verde al terminar, ámbar en la recta final, azul el resto del tiempo. */
function progressColor(isCompleted: boolean, progress: number) {
  if (isCompleted) return 'var(--color-success)';
  if (progress > 75) return 'var(--color-chart-4)';
  return 'var(--color-chart-balance)';
}

interface LoanCardProps {
  loan: Loan;
  accounts: AccountOption[];
  index: number;
  onPay: (id: string, accountId?: string) => Promise<void>;
  onEdit: (loan: Loan) => void;
  onDelete: (id: string, name: string) => void;
}

export function LoanCard({ loan, accounts, index, onPay, onEdit, onDelete }: LoanCardProps) {
  const [paying, setPaying] = useState(false);
  const [accountId, setAccountId] = useState(NO_ACCOUNT);
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const isCompleted = loan.status === 'PAID' || loan.paidInstallments >= loan.totalInstallments;
  const remaining = loan.totalInstallments - loan.paidInstallments;
  const barColor = progressColor(isCompleted, loan.progress);

  const handlePay = async () => {
    setLoading(true);
    setPayError(null);
    try {
      await onPay(loan.id, accountId === NO_ACCOUNT ? undefined : accountId);
      setPaying(false);
    } catch (err) {
      console.error('pay_loan_installment falló:', err);
      setPayError('No se pudo registrar el pago. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Con interés mostramos el saldo de capital, que es lo que costaría cancelar
  // hoy. Sin interés ese concepto no existe y lo único con sentido es lo que
  // falta desembolsar.
  const details = [
    loan.principalBalance != null
      ? { label: 'Saldo de capital', value: `$${fmt(loan.principalBalance)}` }
      : { label: 'Falta pagar', value: `$${fmt(loan.remainingPayments)}` },
    { label: 'Cuotas restantes', value: String(remaining) },
    loan.interestRate != null
      ? { label: 'Tasa anual', value: `${loan.interestRate.toFixed(2)}%` }
      : { label: 'Total', value: `$${fmt(loan.originalAmount)}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card
        className={cn(
          'h-full transition-colors',
          isCompleted ? 'opacity-70' : 'hover:border-primary/30',
        )}
      >
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <h3 className="truncate text-base font-semibold">{loan.name}</h3>
                {isCompleted && <CheckCircle2 className="text-success size-4 shrink-0" />}
              </div>
              <span className="text-muted-foreground text-xs">
                {loan.loanType === 'PERSONAL' ? 'Préstamo personal' : 'Compra en cuotas'}
              </span>
            </div>
            <div className="flex shrink-0 items-start gap-1.5 pl-2 sm:gap-3">
              <div className="text-right">
                <p className="text-muted-foreground mb-0.5 text-xs">Cuota</p>
                <p className="text-lg font-bold tabular-nums">${fmtDec(loan.installmentAmount)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onEdit(loan)}
                aria-label="Editar préstamo"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-destructive size-8"
                onClick={() => onDelete(loan.id, loan.name)}
                aria-label="Eliminar préstamo"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">
                {loan.paidInstallments} de {loan.totalInstallments} cuotas pagadas
              </span>
              <span className="font-semibold" style={{ color: barColor }}>
                {loan.progress}%
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loan.progress}%` }}
                transition={{ duration: 0.9, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
                style={{ backgroundColor: barColor }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {details.map((item, di) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 + 0.1 + di * 0.05 }}
                className="bg-muted/50 rounded-xl p-3 text-center"
              >
                <p className="text-muted-foreground mb-1 text-[10px]">{item.label}</p>
                <p className="text-sm font-semibold tabular-nums">{item.value}</p>
              </motion.div>
            ))}
          </div>

          {!isCompleted && (
            <div className="mt-auto">
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
                      <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_ACCOUNT}>Sin registrar en cuenta</SelectItem>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={handlePay} disabled={loading}>
                        {loading ? '…' : 'Confirmar'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => {
                          setPaying(false);
                          setPayError(null);
                        }}
                        aria-label="Cancelar pago"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    {payError && <p className="text-destructive px-1 text-xs">{payError}</p>}
                  </motion.div>
                ) : (
                  <motion.div
                    key="pay-btn"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button variant="secondary" className="w-full" onClick={() => setPaying(true)}>
                      <Wallet /> Pagar cuota {loan.paidInstallments + 1}/{loan.totalInstallments}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
