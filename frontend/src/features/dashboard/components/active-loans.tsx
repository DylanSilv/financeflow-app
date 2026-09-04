import { CreditCard } from 'lucide-react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActiveLoan } from '@/hooks/useDashboardData';
import { fmt } from '@/lib/format';

function LoanRow({ loan }: { loan: ActiveLoan }) {
  const remaining = loan.totalInstallments - loan.paidInstallments;

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold">{loan.name}</span>
          <Badge variant="secondary" className="mt-0.5">
            {loan.loanType === 'PERSONAL' ? 'Préstamo' : 'Cuotas'}
          </Badge>
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums">
          {loan.paidInstallments}/{loan.totalInstallments}
        </span>
      </div>

      <Progress value={loan.progress} className="h-1.5" />

      <div className="text-muted-foreground flex justify-between text-[11px]">
        <span>
          Falta pagar{' '}
          <span className="text-foreground font-medium">${fmt(loan.remainingPayments)}</span>
        </span>
        <span>
          {remaining > 0 ? `${remaining} × $${fmt(loan.installmentAmount)}` : 'Última cuota'}
        </span>
      </div>
    </div>
  );
}

function LoanGroup({ label, loans }: { label: string; loans: ActiveLoan[] }) {
  if (loans.length === 0) return null;

  return (
    <div>
      <p className="text-muted-foreground mb-3 text-[10px] font-bold tracking-widest uppercase">
        {label}
      </p>
      <div className="space-y-5">
        {loans.map(loan => (
          <LoanRow key={loan.id} loan={loan} />
        ))}
      </div>
    </div>
  );
}

interface ActiveLoansProps {
  loans: ActiveLoan[] | null;
  loading: boolean;
}

export function ActiveLoans({ loans, loading }: ActiveLoansProps) {
  const personal = (loans ?? []).filter(l => l.loanType === 'PERSONAL');
  const purchases = (loans ?? []).filter(l => l.loanType === 'PURCHASE');
  const hasBoth = personal.length > 0 && purchases.length > 0;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Compromisos activos</CardTitle>
        <CardDescription>Préstamos y cuotas en curso</CardDescription>
        {!loading && loans && loans.length > 0 && (
          <CardAction>
            <Badge variant="outline">{loans.length}</Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : !loans || loans.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <CreditCard className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">Sin compromisos activos</p>
          </div>
        ) : (
          <div className="max-h-[360px] space-y-6 overflow-y-auto pr-1">
            <LoanGroup label="Préstamos" loans={personal} />
            {hasBoth && <Separator />}
            <LoanGroup label="Compras en cuotas" loans={purchases} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
