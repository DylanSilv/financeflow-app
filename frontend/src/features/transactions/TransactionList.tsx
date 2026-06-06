import { useTransactionData } from '@/hooks/useTransactionData';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const TransactionList = () => {
  const { transactions, loading } = useTransactionData();

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden mt-8">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Últimos Movimientos</h3>
      </div>

      <div className="divide-y divide-zinc-800/50">
        {loading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Cargando...</div>
        ) : transactions.slice(0, 10).map(t => (
          <div key={t.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-100">{t.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString('es-UY')}</span>
                  {t.category && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-xs" style={{ color: t.category.color }}>{t.category.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span className={`font-medium ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-100'}`}>
              {t.type === 'INCOME' ? '+' : '-'}${Number(t.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
