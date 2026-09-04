import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Pencil, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fmtDec } from '@/lib/format';
import type { FixedExpense } from '@/hooks/useFixedExpenseData';

import { PayPanel } from './pay-panel';
import type { PaymentCard } from './use-payment-cards';

interface ExpenseRowProps {
  expense: FixedExpense;
  cards: PaymentCard[];
  index: number;
  onPay: (id: string, accountId?: string) => Promise<void>;
  onRequestEdit: (expense: FixedExpense) => void;
  onRequestDelete: (id: string) => void;
}

export function ExpenseRow({
  expense,
  cards,
  index,
  onPay,
  onRequestEdit,
  onRequestDelete,
}: ExpenseRowProps) {
  const [showPay, setShowPay] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const isPaid = expense.status === 'PAID';
  const isOverdue = expense.status === 'OVERDUE';
  const hasInstallments =
    expense.paidInstallments !== null && expense.totalInstallments !== null;
  const pct = hasInstallments
    ? Math.round((expense.paidInstallments! / expense.totalInstallments!) * 100)
    : 0;

  const handleOpenPay = () => {
    // Preferimos una tarjeta con cuenta asociada: es la única que descuenta saldo.
    setSelectedCard(cards.find(c => c.accountId) ?? cards[0] ?? null);
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
      className="hover:bg-muted/40 group transition-colors"
    >
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="flex w-5 shrink-0 justify-center">
          {isPaid ? (
            <CheckCircle2 className="text-success size-4" />
          ) : (
            <div
              className={cn('size-2.5 rounded-full', isOverdue ? 'bg-danger' : 'bg-yellow-500')}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'truncate text-sm font-medium',
                isPaid && 'text-muted-foreground',
              )}
            >
              {expense.name}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="shrink-0">
                Vencida
              </Badge>
            )}
            {expense.loanName && (
              <Badge variant="secondary" className="shrink-0">
                cuotas
              </Badge>
            )}
            {expense.autoPay && (
              <RefreshCw className="text-muted-foreground size-3 shrink-0" aria-label="AutoPay" />
            )}
          </div>

          {hasInstallments && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="bg-muted h-1 w-24 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      pct === 100 ? 'var(--color-success)' : 'var(--color-chart-balance)',
                  }}
                />
              </div>
              <span className="text-muted-foreground text-[10px]">
                {expense.paidInstallments}/{expense.totalInstallments} cuotas
              </span>
            </div>
          )}
        </div>

        <div className="hidden w-24 shrink-0 text-center sm:block">
          <span className="text-muted-foreground text-xs">día {expense.dueDate}</span>
          {expense.lastPaidAt && (
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Últ.{' '}
              {new Date(expense.lastPaidAt).toLocaleDateString('es-UY', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
        </div>

        <div className="w-24 shrink-0 text-right">
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              isPaid && 'text-muted-foreground',
              isOverdue && 'text-danger',
            )}
          >
            ${fmtDec(expense.amount)}
          </span>
        </div>

        <div className="flex w-36 shrink-0 items-center justify-end gap-1">
          {/* Editar/borrar aparecen en hover para no empujar el botón Pagar. */}
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onRequestEdit(expense)}
              aria-label="Editar cuenta fija"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive size-8"
              onClick={() => onRequestDelete(expense.id)}
              aria-label="Eliminar cuenta fija"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {isPaid ? (
            <span className="text-success text-xs font-medium whitespace-nowrap">✓ pagado</span>
          ) : (
            <Button size="sm" onClick={handleOpenPay}>
              Pagar <ChevronRight className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <PayPanel
              amount={expense.amount}
              cards={cards}
              selectedCard={selectedCard}
              onSelectCard={setSelectedCard}
              onConfirm={handleConfirm}
              onCancel={() => setShowPay(false)}
              paying={paying}
              error={payError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
