import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, PiggyBank } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useAccountsCache } from '@/hooks/useAccountsCache';
import { useSavingsData, type SavingsGoal } from '@/hooks/useSavingsData';
import { fmt } from '@/lib/format';

import { AddSavingsGoalModal } from './AddSavingsGoalModal';
import { EditSavingsGoalModal } from './EditSavingsGoalModal';
import { GoalCard } from './components/goal-card';

export const Savings = () => {
  const { goals, loading, refetch, updateGoal, addFunds, deleteGoal } = useSavingsData();
  const { accounts } = useAccountsCache();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SavingsGoal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalsWithTarget = goals.filter(g => g.targetAmount > 0);
  const totalTarget = goalsWithTarget.reduce((sum, g) => sum + g.targetAmount, 0);
  const globalProgress =
    totalTarget > 0
      ? (goalsWithTarget.reduce((sum, g) => sum + g.currentAmount, 0) / totalTarget) * 100
      : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis Ahorros"
        description="Seguí el crecimiento de tus fondos y metas."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus /> Nuevo ahorro
          </Button>
        }
      />

      <Card className="from-primary/5 to-card dark:bg-card bg-gradient-to-t">
        <CardContent className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-muted-foreground mb-1 text-sm font-medium">Total ahorrado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">${fmt(totalSaved)}</span>
              {totalTarget > 0 && (
                <span className="text-muted-foreground font-medium tabular-nums">
                  / ${fmt(totalTarget)} en metas
                </span>
              )}
            </div>
          </div>

          {globalProgress !== null && (
            <div className="w-full md:w-1/3">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso de metas</span>
                <span className="font-medium tabular-nums">{globalProgress.toFixed(1)}%</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <motion.div
                  className="from-chart-balance to-primary h-full rounded-full bg-gradient-to-r"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(globalProgress, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[320px] w-full rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Sin metas de ahorro"
          description="Creá tu primer fondo para empezar a seguir tu progreso."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Nuevo ahorro
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={i}
              accounts={accounts}
              onAddFunds={addFunds}
              onEdit={setEditTarget}
              onDelete={id => setPendingDelete({ id, name: goal.name })}
            />
          ))}
        </div>
      )}

      <AddSavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />

      <EditSavingsGoalModal
        goal={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateGoal}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar meta de ahorro?"
        description={`Se eliminará "${pendingDelete?.name}" y todos sus datos. Esta acción es irreversible.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteGoal(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Savings;
