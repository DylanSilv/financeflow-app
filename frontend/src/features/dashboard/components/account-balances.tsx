import { Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AccountBalance } from '@/hooks/useDashboardData';
import { fmt } from '@/lib/format';

const TYPE_LABELS: Record<AccountBalance['type'], string> = {
  CHECKING: 'Corriente',
  SAVINGS: 'Ahorro',
  CASH: 'Efectivo',
  BENEFIT: 'Beneficio',
};

function AccountRow({ acc }: { acc: AccountBalance }) {
  const isNegative = acc.balance < 0;
  const isBenefit = acc.type === 'BENEFIT';
  const received = acc.receivedThisMonth;
  const color = acc.color ?? 'var(--color-chart-1)';

  return (
    <Card className="hover:border-primary/30 py-0 transition-colors">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklab, ${color} 20%, transparent)` }}
        >
          <Building2 className="size-4" style={{ color }} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{acc.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px]">{TYPE_LABELS[acc.type]}</span>
            {isBenefit && (
              <Badge variant={received ? 'default' : 'secondary'} className="text-[10px]">
                {received ? 'recibido' : 'pendiente'}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right">
          <p
            className={cn(
              'text-sm font-bold tabular-nums',
              isBenefit && received && 'text-success',
              !isBenefit && isNegative && 'text-danger',
            )}
          >
            {isBenefit && acc.monthlyAmount
              ? `$${fmt(acc.monthlyAmount)}`
              : `${isNegative ? '-' : ''}$${fmt(Math.abs(acc.balance))}`}
          </p>
          {!isBenefit && (
            <p
              className={cn(
                'mt-0.5 text-[10px]',
                isNegative ? 'text-danger' : 'text-muted-foreground',
              )}
            >
              {isNegative ? 'negativo' : 'disponible'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AccountBalancesProps {
  accounts: AccountBalance[] | null;
  loading: boolean;
}

export function AccountBalances({ accounts, loading }: AccountBalancesProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Balance por cuenta</h2>
        <p className="text-muted-foreground text-sm">Saldo actual en cada cuenta</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[69px] w-full rounded-xl" />)
          : (accounts ?? []).map(acc => <AccountRow key={acc.id} acc={acc} />)}
      </div>
    </section>
  );
}
