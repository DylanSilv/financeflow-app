import { useTransactionStore } from '@/store/useTransactionStore';
import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';

export const TransactionList = () => {
  const { transactions, deleteTransaction } = useTransactionStore();

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden mt-8">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Últimos Movimientos</h3>
        <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Ver todos</button>
      </div>
      
      <div className="divide-y divide-zinc-800/50">
        {transactions.map((t) => (
          <div key={t.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-zinc-800/20 transition-colors group">
            
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-100">{t.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString()}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span className="text-xs text-zinc-400" style={{ color: t.category?.color }}>{t.category?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`font-medium ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-100'}`}>
                {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
              </span>
              <button 
                onClick={() => deleteTransaction(t.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};