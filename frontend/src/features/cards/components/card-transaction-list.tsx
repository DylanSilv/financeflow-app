import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { fmtDec } from '@/lib/format';

import type { CardTransaction } from './use-card-transactions';

interface Props {
  transactions: CardTransaction[];
  loading: boolean;
  emptyLabel: string;
}

export function CardTransactionList({ transactions, loading, emptyLabel }: Props) {
  if (loading) {
    return <p className="text-muted-foreground py-4 text-center text-xs">Cargando…</p>;
  }

  if (transactions.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-xs">{emptyLabel}</p>;
  }

  return (
    <div className="divide-border divide-y">
      {transactions.map((t, i) => {
        const isIncome = t.type === 'INCOME';

        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className="flex items-center justify-between px-5 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  isIncome ? 'bg-success/10' : 'bg-danger/10',
                )}
              >
                {isIncome ? (
                  <ArrowUpRight className="text-success size-3" />
                ) : (
                  <ArrowDownRight className="text-danger size-3" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{t.title}</p>
                <p className="text-muted-foreground text-[10px]">
                  {new Date(t.date).toLocaleDateString('es-UY')}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'ml-3 shrink-0 text-xs font-semibold tabular-nums',
                isIncome && 'text-success',
              )}
            >
              {isIncome ? '+' : '-'}${fmtDec(t.amount)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
