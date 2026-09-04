import { CreditCard, X } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fmtDec } from '@/lib/format';

import type { PaymentCard } from './use-payment-cards';

interface PayPanelProps {
  amount: number;
  cards: PaymentCard[];
  selectedCard: PaymentCard | null;
  onSelectCard: (card: PaymentCard | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  paying: boolean;
  error: string | null;
}

export function PayPanel({
  amount,
  cards,
  selectedCard,
  onSelectCard,
  onConfirm,
  onCancel,
  paying,
  error,
}: PayPanelProps) {
  const balanceAfter = selectedCard ? selectedCard.balance - amount : null;
  const overdrawn = balanceAfter !== null && balanceAfter < 0;

  return (
    <div className="bg-card mx-4 mb-3 flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="text-primary size-4" />
          <span className="text-sm font-medium">
            Pagar <span className="font-semibold tabular-nums">${fmtDec(amount)}</span> desde…
          </span>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onCancel}>
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => {
          const selected = selectedCard?.id === card.id;
          const insufficient = card.balance < amount;

          return (
            <motion.button
              key={card.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCard(card)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                selected ? 'border-primary bg-primary/10' : 'hover:border-primary/40',
              )}
            >
              <div className={cn('h-6 w-8 shrink-0 rounded-md bg-gradient-to-br', card.color)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{card.name}</p>
                <p
                  className={cn(
                    'text-xs font-semibold tabular-nums',
                    insufficient ? 'text-danger' : 'text-success',
                  )}
                >
                  ${fmtDec(card.balance)}
                </p>
              </div>
              {selected && <div className="bg-primary size-2 shrink-0 rounded-full" />}
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectCard(null)}
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
            selectedCard === null ? 'border-primary bg-primary/10' : 'hover:border-primary/40',
          )}
        >
          <div className="bg-muted flex h-6 w-8 shrink-0 items-center justify-center rounded-md">
            <span className="text-muted-foreground text-[9px]">—</span>
          </div>
          <div>
            <p className="text-xs font-medium">Sin tarjeta</p>
            <p className="text-muted-foreground text-[10px]">Sólo marca pagado</p>
          </div>
        </motion.button>
      </div>

      {selectedCard?.accountId && balanceAfter !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-between rounded-lg border px-3 py-2 text-xs',
            overdrawn ? 'border-danger/30 bg-danger/10' : 'bg-muted/40',
          )}
        >
          <span className="text-muted-foreground">Saldo después del pago</span>
          <span className={cn('font-semibold tabular-nums', overdrawn && 'text-danger')}>
            ${fmtDec(balanceAfter)}
            {overdrawn && ' ⚠'}
          </span>
        </motion.div>
      )}

      {error && <p className="text-destructive px-1 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" className="flex-1" onClick={onConfirm} disabled={paying}>
          {paying
            ? 'Registrando…'
            : `Confirmar pago${selectedCard ? ` — ${selectedCard.name}` : ''}`}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
