import { useState } from 'react';
import { Plus, Target, TrendingUp, Calendar as CalendarIcon, PiggyBank } from 'lucide-react';
import { useSavingsData, SavingsGoal } from '@/hooks/useSavingsData';
import { AddSavingsGoalModal } from './AddSavingsGoalModal';

function GoalCard({
  goal,
  onAddFunds,
}: {
  goal:       SavingsGoal;
  onAddFunds: (id: string, amount: number) => Promise<void>;
}) {
  const [adding,       setAdding]       = useState(false);
  const [inputAmount,  setInputAmount]  = useState('');
  const hasTarget  = goal.targetAmount > 0;
  const isCompleted = hasTarget && (goal.progress ?? 0) >= 100;
  const goalColor  = goal.color ?? '#6366f1';

  const handleAdd = async () => {
    const n = parseFloat(inputAmount);
    if (!n || n <= 0) return;
    await onAddFunds(goal.id, n);
    setAdding(false);
    setInputAmount('');
  };

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${goalColor}20` }}
          >
            {hasTarget
              ? <Target  className="w-5 h-5" style={{ color: goalColor }} />
              : <PiggyBank className="w-5 h-5" style={{ color: goalColor }} />
            }
          </div>
          {goal.deadline && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-[#0a0a0a] px-2.5 py-1 rounded-md border border-zinc-800">
              <CalendarIcon className="w-3.5 h-3.5" />
              {new Date(goal.deadline).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}
            </div>
          )}
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

        {/* Barra de progreso solo si tiene objetivo */}
        {hasTarget && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-500">Progreso</span>
              <span className="font-semibold" style={{ color: goalColor }}>
                {Math.min(goal.progress ?? 0, 100)}%
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:           `${Math.min(goal.progress ?? 0, 100)}%`,
                  backgroundColor: isCompleted ? '#10b981' : goalColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Sin objetivo: línea decorativa del color */}
        {!hasTarget && (
          <div className="h-1 w-full rounded-full" style={{ backgroundColor: `${goalColor}40` }}>
            <div className="h-full w-1/3 rounded-full animate-pulse" style={{ backgroundColor: goalColor }} />
          </div>
        )}
      </div>

      {/* Botón aportar */}
      <div className="mt-5">
        {isCompleted ? (
          <div className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            ¡Meta alcanzada!
          </div>
        ) : adding ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
              <input
                type="number" value={inputAmount} min="1" autoFocus
                onChange={e => setInputAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="0"
                className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => { setAdding(false); setInputAmount(''); }}
              className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-[#161616] hover:bg-zinc-800 text-white border border-zinc-800 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            Aportar fondos
          </button>
        )}
      </div>
    </div>
  );
}

export const Savings = () => {
  const { goals, loading, addFunds, refetch } = useSavingsData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  // Para el resumen global solo tomamos los que tienen objetivo
  const goalsWithTarget  = goals.filter(g => g.targetAmount > 0);
  const totalTarget      = goalsWithTarget.reduce((s, g) => s + g.targetAmount, 0);
  const globalProgress   = totalTarget > 0
    ? (goalsWithTarget.reduce((s, g) => s + g.currentAmount, 0) / totalTarget) * 100 : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Ahorros</h1>
          <p className="text-zinc-400 mt-1">Seguí el crecimiento de tus fondos y metas.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ahorro
        </button>
      </header>

      {/* Resumen global */}
      <div className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
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
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(globalProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-12">Cargando ahorros...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onAddFunds={addFunds} />
          ))}
        </div>
      )}

      <AddSavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Savings;
