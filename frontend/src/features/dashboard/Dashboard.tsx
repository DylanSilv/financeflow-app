import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

import { AccountBalances } from './components/account-balances';
import { ActiveLoans } from './components/active-loans';
import { AutoPayBanner, type AutoPayEntry } from './components/autopay-banner';
import { CategoryExpenses } from './components/category-expenses';
import { EvolutionChart } from './components/evolution-chart';
import { MetricCards } from './components/metric-cards';
import { Onboarding } from './components/onboarding';
import { SavingsGoals } from './components/savings-goals';

function greetingFor(hour: number) {
  if (hour >= 20 || hour < 6) return 'Buenas noches';
  return hour < 12 ? 'Buenos días' : 'Buenas tardes';
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user);

  const {
    balanceTotal,
    balanceCuentas,
    evolucion,
    prestamos,
    ahorros,
    loading,
    refreshing,
    error,
    refetch,
  } = useDashboardData();

  const autoPayRan = useRef(false);
  const [autoPayResult, setAutoPayResult] = useState<AutoPayEntry[]>([]);

  useEffect(() => {
    if (autoPayRan.current) return;
    autoPayRan.current = true;

    supabase.rpc('run_autopay').then(({ data }) => {
      const result = data as { paid: AutoPayEntry[]; count: number } | null;
      if (result && result.count > 0) {
        setAutoPayResult(result.paid);
        refetch();
      }
    }, () => {});
  }, [refetch]);

  const now = new Date();
  const greeting = `${greetingFor(now.getHours())}, ${(user?.name ?? '').split(' ')[0]}`;
  const currentMonth = now.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });

  const totalSaved = (ahorros ?? []).reduce((sum, goal) => sum + goal.currentAmount, 0);

  // Usuario recién registrado: todavía no cargó ninguna cuenta.
  if (!loading && balanceCuentas !== null && balanceCuentas.length === 0) {
    return <Onboarding />;
  }

  return (
    <div className="flex flex-col gap-6">
      <AutoPayBanner entries={autoPayResult} onDismiss={() => setAutoPayResult([])} />

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-muted-foreground mb-1 text-sm first-letter:uppercase">{currentMonth}</p>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acá está el estado actual de tus finanzas.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading || refreshing}
          className="self-start md:self-auto"
        >
          <RefreshCw className={loading || refreshing ? 'animate-spin' : undefined} />
          {error ? 'Reintentar' : refreshing ? 'Actualizando…' : 'Actualizar'}
        </Button>
      </header>

      <MetricCards
        balance={balanceTotal?.balance ?? 0}
        monthIncome={balanceTotal?.monthIncome ?? 0}
        monthExpenses={balanceTotal?.monthExpenses ?? 0}
        totalSaved={totalSaved}
        savingsCount={ahorros?.length ?? 0}
        loading={loading}
      />

      <EvolutionChart data={evolucion} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryExpenses />
        <ActiveLoans loans={prestamos} loading={loading} />
      </div>

      <AccountBalances accounts={balanceCuentas} loading={loading} />
      <SavingsGoals goals={ahorros} loading={loading} />
    </div>
  );
}
