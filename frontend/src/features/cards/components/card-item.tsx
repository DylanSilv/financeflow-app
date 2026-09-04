import { useState } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card as UICard } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fmt, fmtDec } from '@/lib/format';
import type { Card } from '@/hooks/useCardData';

import { bankLabel } from '../banks';

import { CardTransactionList } from './card-transaction-list';
import { useCardTransactions } from './use-card-transactions';

function usageColor(pct: number) {
  if (pct > 85) return 'bg-danger';
  if (pct > 60) return 'bg-yellow-500';
  return 'bg-primary';
}

interface CardItemProps {
  card: Card;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function CardItem({ card, index, onEdit, onDelete }: CardItemProps) {
  const [open, setOpen] = useState(false);
  const isCredit = card.type === 'CREDIT';

  const { transactions, loading } = useCardTransactions({
    enabled: open,
    cardId: isCredit ? card.id : undefined,
    accountId: isCredit ? undefined : card.accountId,
  });

  const issuer = bankLabel(card.color, card.name);
  const usedPct = card.limit > 0 ? Math.min((card.balance / card.limit) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
    >
      <UICard className="group hover:border-primary/30 gap-0 overflow-hidden py-0 shadow-lg transition-colors">
        {/* Frente de la tarjeta */}
        <div
          className={cn(
            'relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-gradient-to-br p-6',
            card.color,
          )}
        >
          <div className="pointer-events-none absolute -top-8 -right-8 size-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 size-28 rounded-full bg-black/20 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-widest text-white/60 uppercase">
                {issuer}
              </p>
              <p className="mt-0.5 text-base font-semibold text-white">{card.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-white/70">{card.brand}</span>
                <span className="text-[10px] text-white/50">{isCredit ? 'Crédito' : 'Débito'}</span>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  aria-label="Editar tarjeta"
                  className="size-7 bg-black/30 text-white/80 hover:bg-black/60 hover:text-white"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  aria-label="Eliminar tarjeta"
                  className="size-7 bg-black/30 text-white/80 hover:bg-red-500/60 hover:text-white"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            {isCredit ? (
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">
                    Disponible
                  </p>
                  <p className="text-xl font-bold tracking-tight text-emerald-300 tabular-nums">
                    ${card.limit > 0 ? fmtDec(card.limit - card.balance) : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">
                    Deuda actual
                  </p>
                  <p className="text-xl font-bold tracking-tight text-white tabular-nums">
                    ${fmtDec(card.balance)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">
                  Saldo disponible
                </p>
                <p className="text-2xl font-bold tracking-tight text-white tabular-nums">
                  ${fmtDec(card.balance)}
                </p>
              </>
            )}
            <p className="mt-3 font-mono text-sm tracking-[0.2em] text-white/60">
              •••• •••• •••• {card.lastFourDigits}
            </p>
          </div>
        </div>

        {/* Uso del límite (sólo crédito) */}
        {isCredit && card.limit > 0 && (
          <div className="px-5 pt-4 pb-2">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-muted-foreground">Límite utilizado</span>
              <span className="font-medium tabular-nums">
                ${fmt(card.balance)}
                <span className="text-muted-foreground"> / ${fmt(card.limit)}</span>
              </span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <motion.div
                className={cn('h-full rounded-full', usageColor(usedPct))}
                initial={{ width: 0 }}
                animate={{ width: `${usedPct}%` }}
                transition={{ duration: 0.8, delay: index * 0.08 + 0.3, ease: 'easeOut' }}
              />
            </div>
            {card.dueDay && (
              <p className="text-muted-foreground mt-2 text-[10px]">
                Vence el día {card.dueDay} de cada mes
                {card.statementDay ? ` · Cierra el día ${card.statementDay}` : ''}
              </p>
            )}
          </div>
        )}

        {/* Historial */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between border-t px-5 py-3 text-xs transition-colors"
        >
          <span>{isCredit ? 'Últimas compras' : 'Últimos movimientos'}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="size-3.5" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t"
            >
              <CardTransactionList
                transactions={transactions}
                loading={loading}
                emptyLabel={isCredit ? 'Sin compras registradas' : 'Sin movimientos registrados'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </UICard>
    </motion.div>
  );
}
