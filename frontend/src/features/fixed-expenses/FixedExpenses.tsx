import { useState } from 'react';
import { Plus, Calendar, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useFixedExpenseStore, ExpenseStatus } from '@/store/useFixedExpenseStore';
import { AddFixedExpenseModal } from './AddFixedExpenseModal';

export const FixedExpenses = () => {
  const { expenses, markAsPaid, toggleAutoPay } = useFixedExpenseStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalMonthly = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalPaid = expenses.filter(e => e.status === 'PAID').reduce((acc, exp) => acc + exp.amount, 0);

  const getStatusConfig = (status: ExpenseStatus) => {
    switch (status) {
      case 'PAID':
        return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, text: 'Pagado' };
      case 'OVERDUE':
        return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle, text: 'Atrasado' };
      default:
        return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock, text: 'Pendiente' };
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Cuentas Fijas</h1>
          <p className="text-zinc-400 mt-1">Gestiona tus suscripciones y pagos recurrentes.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </header>

      {/* Resumen Superior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Total Fijo Mensual</p>
            <p className="text-3xl font-bold text-white">${totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <div className="bg-[#111111] border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Pagado este mes</p>
            <p className="text-3xl font-bold text-emerald-400">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        {/* RENDERIZADO DEL MODAL AQUI */}
        <AddFixedExpenseModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>

      {/* Grid de Suscripciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {expenses.map((expense) => {
          const status = getStatusConfig(expense.status);
          const StatusIcon = status.icon;

          return (
            <div key={expense.id} className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${expense.categoryColor} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">{expense.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{expense.name}</h3>
                      <p className="text-sm text-zinc-500 font-medium">Día {expense.dueDate} del mes</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border ${status.bg} ${status.border} flex items-center gap-1.5`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                    <span className={`text-xs font-semibold ${status.color}`}>{status.text}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-6">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Monto</p>
                    <p className="text-2xl font-bold text-white">${expense.amount.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <button 
                      onClick={() => toggleAutoPay(expense.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${expense.autoPay ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${expense.autoPay ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                      Auto-pago
                    </button>
                    
                    {expense.status !== 'PAID' && (
                      <button 
                        onClick={() => markAsPaid(expense.id)}
                        className="text-xs font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        Marcar Pagado
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso visual sutil al fondo de la tarjeta */}
              <div className="h-1 w-full bg-zinc-800/50">
                <div 
                  className={`h-full transition-all duration-1000 ${expense.status === 'PAID' ? 'bg-emerald-500 w-full' : expense.status === 'OVERDUE' ? 'bg-red-500 w-full' : 'bg-yellow-500 w-1/2'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FixedExpenses;