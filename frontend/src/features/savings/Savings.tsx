import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, TrendingUp, Calendar as CalendarIcon, PiggyBank, Trash2, Pencil } from 'lucide-react';
import { useSavingsData, SavingsGoal } from '@/hooks/useSavingsData';
import { AddSavingsGoalModal } from './AddSavingsGoalModal';
import { EditSavingsGoalModal } from './EditSavingsGoalModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAccountsCache } from '@/hooks/useAccountsCache';

interface Account { id: string; name: string; type: string; }

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function GoalCard({
  goal,
  index,
  accounts,
  onAddFunds,
  onEdit,
  onDelete,
}: {
  goal:       SavingsGoal;
  index:      number;
  accounts:   Account[];
  onAddFunds: (id: string, amount: number, accountId?: string) => Promise<void>;
  onEdit:     (goal: SavingsGoal) => void;
  onDelete:   (id: string) => void;
}) {
  const [adding,      setAdding]      = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [accountId,   setAccountId]   = useState('');
  const [error,       setError]       = useState('');

  const hasTarget   = goal.targetAmount > 0;
  const isCompleted = hasTarget && (goal.progress ?? 0) >= 100;
  const goalColor   = goal.color ?? '#6366f1';

  // Sin preselección: el usuario elige explícitamente la cuenta

  const handleAdd = async () => {
    const n = parseFloat(inputAmount);
    if (!n || n <= 0) { setError('El monto debe ser mayor a 0.'); return; }
    setError('');
    try {
      await onAddFunds(goal.id, n, accountId || undefined);
      setAdding(false);
      setInputAmount('');
      setAccountId('');
    } catch {
      setError('No se pudo registrar el aporte.');
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setInputAmount('');
    setAccountId('');
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors"
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: index * 0.08 + 0.1 }}
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${goalColor}20` }}
          >
            {hasTarget
              ? <Target    className="w-5 h-5" style={{ color: goalColor }} />
              : <PiggyBank className="w-5 h-5" style={{ color: goalColor }} />
            }
          </motion.div>
          <div className="flex items-center gap-2">
          {goal.deadline && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-[#0a0a0a] px-2.5 py-1 rounded-md border border-zinc-800">
              <CalendarIcon className="w-3.5 h-3.5" />
              {new Date(goal.deadline).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}
            </div>
          )}
          <button onClick={() => onEdit(goal)} aria-label="Editar meta de ahorro"
            className="p-1.5 text-zinc-700 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)} aria-label="Eliminar meta de ahorro"
            className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          </div>
        </div>

        <h3 className="text-base font-semibold text-white mb-0.5">{goal.name}</h3>
        <p className="text-xs text-zinc-500 mb-5">
          {hasTarget ? 'Meta definida' : 'Guardando sin objetivo fijo'}
        </p>

        {/* Monto */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-3xl font-bold text-white">
            ${goal.currentAmount.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
          </span>
          {hasTarget && (
            <span className="text-sm text-zinc-500">
              / ${goal.targetAmount.toLocaleString('es-UY')}
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        {hasTarget && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-500">Progreso</span>
              <span className="font-semibold" style={{ color: goalColor }}>
                {Math.min(goal.progress ?? 0, 100)}%
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(goal.progress ?? 0, 100)}%` }}
                transition={{ duration: 0.9, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
                style={{ backgroundColor: isCompleted ? '#10b981' : goalColor }}
              />
            </div>
          </div>
        )}

        {!hasTarget && (
          <div className="h-1 w-full rounded-full" style={{ backgroundColor: `${goalColor}40` }}>
            <div className="h-full w-1/3 rounded-full animate-pulse" style={{ backgroundColor: goalColor }} />
          </div>
        )}
      </div>

      {/* Panel aportar fondos */}
      <div className="mt-5">
        {isCompleted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          >
            ¡Meta alcanzada!
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {adding ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2"
              >
                {/* Monto */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                    <input
                      type="number" value={inputAmount} min="0.01" step="0.01" autoFocus
                      onChange={e => setInputAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      placeholder="0"
                      className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Aportar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>

                {/* Cuenta origen */}
                {accounts.length > 0 && (
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Sin descontar de cuenta</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                {accountId && (
                  <p className="text-[10px] text-zinc-600">
                    Se registrará un gasto en la cuenta seleccionada.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setAdding(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-[#161616] hover:bg-zinc-800 text-white border border-zinc-800 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Aportar fondos
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export const Savings = () => {
  const { goals, loading, updateGoal, addFunds, deleteGoal } = useSavingsData();
  const { accounts } = useAccountsCache();
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editTarget,    setEditTarget]    = useState<SavingsGoal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const totalSaved      = goals.reduce((s, g) => s + g.currentAmount, 0);
  const goalsWithTarget = goals.filter(g => g.targetAmount > 0);
  const totalTarget     = goalsWithTarget.reduce((s, g) => s + g.targetAmount, 0);
  const globalProgress  = totalTarget > 0
    ? (goalsWithTarget.reduce((s, g) => s + g.currentAmount, 0) / totalTarget) * 100 : null;

  return (
    <div className="flex flex-col gap-8">
      <motion.header {...fadeUp()} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Ahorros</h1>
          <p className="text-zinc-400 mt-1">Seguí el crecimiento de tus fondos y metas.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ahorro
        </motion.button>
      </motion.header>

      {/* Resumen global */}
      <motion.div
        {...fadeUp(0.1)}
        className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Total ahorrado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">
                ${totalSaved.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
              </span>
              {totalTarget > 0 && (
                <span className="text-zinc-500 font-medium">
                  / ${totalTarget.toLocaleString('es-UY')} en metas
                </span>
              )}
            </div>
          </div>

          {globalProgress !== null && (
            <div className="w-full md:w-1/3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Progreso de metas</span>
                <span className="text-white font-medium">{globalProgress.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(globalProgress, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={i}
              accounts={accounts}
              onAddFunds={addFunds}
              onEdit={setEditTarget}
              onDelete={(id) => setPendingDelete({ id, name: goal.name })}
            />
          ))}
        </div>
      )}

      <AddSavingsGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {}} />

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
        onConfirm={() => { if (pendingDelete) deleteGoal(pendingDelete.id); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Savings;
