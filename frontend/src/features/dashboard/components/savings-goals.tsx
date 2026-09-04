import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { SavingsGoal } from '@/hooks/useDashboardData';
import { fmt } from '@/lib/format';

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const pct = Math.min(goal.progress, 100);
  const done = pct >= 100;
  const color = goal.color ?? 'var(--color-chart-1)';

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate text-sm font-semibold">{goal.name}</span>
          </div>
          <Badge variant={done ? 'default' : 'secondary'}>{pct}%</Badge>
        </div>

        <Progress value={pct} />

        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">${fmt(goal.currentAmount)} ahorrado</span>
          <span className="text-muted-foreground">meta ${fmt(goal.targetAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface SavingsGoalsProps {
  goals: SavingsGoal[] | null;
  loading: boolean;
}

export function SavingsGoals({ goals, loading }: SavingsGoalsProps) {
  if (!loading && (!goals || goals.length === 0)) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Objetivos de ahorro</h2>
        <p className="text-muted-foreground text-sm">Progreso de tus metas</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading
          ? [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          : (goals ?? []).map(goal => <GoalCard key={goal.id} goal={goal} />)}
      </div>
    </section>
  );
}
