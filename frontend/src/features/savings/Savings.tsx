import { useState } from 'react';
import { Plus, Target, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { useSavingsStore } from '@/store/useSavingsStore';
import { AddSavingsGoalModal } from './AddSavingsGoalModal';

export const Savings = () => {
  const { goals, addFunds } = useSavingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const totalTarget = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Metas de Ahorro</h1>
          <p className="text-zinc-400 mt-1">Controla tu progreso y alcanza tus objetivos financieros.</p>
        </div>
        
        <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </header>

      {/* Tarjeta de Resumen Global */}
      <div className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
        {/* Efecto visual de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Ahorro Total Acumulado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className="text-zinc-500 font-medium">/ ${totalTarget.toLocaleString('en-US')}</span>
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Progreso Global</span>
              <span className="text-white font-medium">{totalProgress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </div>
            {/* RENDERIZADO DEL MODAL */}
        <AddSavingsGoalModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
        />
      </div>

      {/* Grid de Metas Individuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const isCompleted = progress >= 100;

          return (
            <div key={goal.id} className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between group hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-zinc-800/50 ${isCompleted ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    <Target className="w-6 h-6" />
                  </div>
                  {goal.deadline && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-[#0a0a0a] px-2.5 py-1 rounded-md border border-zinc-800">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{goal.name}</h3>
                
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Progreso</span>
                    <span className="text-white font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  
                  {/* Barra de progreso de la meta */}
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : goal.color}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-white">${goal.currentAmount.toLocaleString()}</span>
                    <span className="text-xs font-medium text-zinc-500">Meta: ${goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Botón de acción rápida */}
              <button 
                onClick={() => addFunds(goal.id, 100)} // Suma $100 de prueba
                disabled={isCompleted}
                className={`mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default' 
                    : 'bg-[#161616] hover:bg-zinc-800 text-white border border-zinc-800'
                }`}
              >
                {isCompleted ? (
                  '¡Meta Alcanzada!'
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Aportar $100 (Prueba)
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Savings;