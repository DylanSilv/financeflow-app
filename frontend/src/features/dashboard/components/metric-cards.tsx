import { ArrowDownRight, ArrowUpRight, Target, Wallet } from 'lucide-react';

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { fmt } from '@/lib/format';

type Trend = 'positive' | 'negative' | 'neutral';

function AnimatedAmount({ value }: { value: number }) {
  const animated = useAnimatedNumber(value);
  return <>${fmt(Math.abs(animated))}</>;
}

interface MetricCardProps {
  title: string;
  value: number;
  footer: string;
  hint: string;
  trend: Trend;
  icon: React.ElementType;
  loading: boolean;
}

function MetricCard({ title, value, footer, hint, trend, icon: Icon, loading }: MetricCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {loading ? <Skeleton className="h-8 w-32" /> : <AnimatedAmount value={value} />}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <Icon className="size-3.5" />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {loading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <>
            <div
              className={
                trend === 'positive'
                  ? 'text-success line-clamp-1 font-medium'
                  : trend === 'negative'
                    ? 'text-danger line-clamp-1 font-medium'
                    : 'line-clamp-1 font-medium'
              }
            >
              {footer}
            </div>
            <div className="text-muted-foreground">{hint}</div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

interface MetricCardsProps {
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  totalSaved: number;
  savingsCount: number;
  loading: boolean;
}

export function MetricCards({
  balance,
  monthIncome,
  monthExpenses,
  totalSaved,
  savingsCount,
  loading,
}: MetricCardsProps) {
  const plural = savingsCount !== 1;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Balance total"
        value={balance}
        loading={loading}
        icon={Wallet}
        trend={balance >= 0 ? 'positive' : 'negative'}
        footer={balance >= 0 ? 'Patrimonio neto' : 'Balance negativo'}
        hint="Suma de los saldos de todas tus cuentas"
      />
      <MetricCard
        title="Ingresos del mes"
        value={monthIncome}
        loading={loading}
        icon={ArrowUpRight}
        trend={monthIncome > 0 ? 'positive' : 'neutral'}
        footer={monthIncome > 0 ? `+$${fmt(monthIncome)} ingresado` : 'Sin ingresos este mes'}
        hint="Todo lo que entró durante el mes actual"
      />
      <MetricCard
        title="Gastos del mes"
        value={monthExpenses}
        loading={loading}
        icon={ArrowDownRight}
        trend={monthExpenses > 0 ? 'negative' : 'neutral'}
        footer={monthExpenses > 0 ? `-$${fmt(monthExpenses)} gastado` : 'Sin gastos este mes'}
        hint="Todo lo que salió durante el mes actual"
      />
      <MetricCard
        title="Total ahorrado"
        value={totalSaved}
        loading={loading}
        icon={Target}
        trend={totalSaved > 0 ? 'positive' : 'neutral'}
        footer={`${savingsCount} fondo${plural ? 's' : ''} activo${plural ? 's' : ''}`}
        hint="Acumulado en tus objetivos de ahorro"
      />
    </div>
  );
}
