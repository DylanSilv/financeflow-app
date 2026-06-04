import { useState } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { AddTransactionModal } from './AddTransactionModal';
import { Search, ArrowDownRight, ArrowUpRight, Trash2, Download, Plus, Filter } from 'lucide-react';

export const TransactionHistory = () => {
  const { transactions, deleteTransaction } = useTransactionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para nuestros filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Lógica de filtrado reactiva
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.category?.name.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Cabecera Principal */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Historial de Movimientos</h1>
          <p className="text-zinc-400 mt-1">Explora, filtra y administra todas tus transacciones.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-[#111111] border border-zinc-800 hover:bg-zinc-800 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4 text-zinc-400" />
            Exportar CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo Movimiento
          </button>
        </div>
      </header>

      {/* Barra de Filtros (Buscador y Tabs) */}
      <div className="bg-[#111111] border border-zinc-800 rounded-xl p-2 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Buscador Integrado */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar por concepto o categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Tabs de Filtro Rápido */}
        <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800 w-full md:w-auto">
          {['ALL', 'INCOME', 'EXPENSE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`flex-1 md:px-6 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterType === type 
                  ? 'bg-[#1a1a1a] text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type === 'INCOME' ? 'Ingresos' : 'Gastos'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Principal de Movimientos */}
      <div className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden">
        
        {/* Cabecera de la Tabla (Oculta en Mobile) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-[#161616] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-5">Concepto</div>
          <div className="col-span-3">Categoría</div>
          <div className="col-span-2 text-right">Fecha</div>
          <div className="col-span-2 text-right">Monto</div>
        </div>

        {/* Filas de Datos */}
        <div className="divide-y divide-zinc-800/50">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-zinc-800/20 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-zinc-300 font-medium text-lg">No hay movimientos</h3>
              <p className="text-zinc-500 text-sm mt-1">Intenta ajustar los filtros o el término de búsqueda.</p>
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div key={t.id} className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-zinc-800/20 transition-colors group">
                
                {/* Concepto (Mobile + Desktop) */}
                <div className="col-span-5 flex items-center gap-4 w-full">
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-100 truncate">{t.title}</h4>
                    <p className="text-xs text-zinc-500 md:hidden mt-0.5">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Categoría (Desktop) */}
                <div className="col-span-3 w-full hidden md:flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.category?.color }}></span>
                  <span className="text-sm text-zinc-400">{t.category?.name}</span>
                </div>

                {/* Fecha (Desktop) */}
                <div className="col-span-2 w-full hidden md:block text-right">
                  <span className="text-sm text-zinc-500">{new Date(t.date).toLocaleDateString()}</span>
                </div>

                {/* Monto y Acciones (Mobile + Desktop) */}
                <div className="col-span-2 flex items-center justify-between md:justify-end gap-4 w-full">
                  <span className={`font-semibold ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-100'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                  </span>
                  
                  {/* Botón Eliminar: Siempre visible en mobile, visible al hover en desktop */}
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 bg-[#161616] border border-zinc-800 md:bg-transparent md:border-transparent rounded-lg"
                    title="Eliminar movimiento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Reutilizamos el Modal */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default TransactionHistory;