import { useState } from 'react'; // Importamos useState
import { Plus, CreditCard } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import { AddCardModal } from './AddCardModal'; // Importamos el modal

export const Cards = () => {
  const { cards } = useCardStore();
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Tarjetas</h1>
          <p className="text-zinc-400 mt-1">Gestiona tus tarjetas de crédito y débito.</p>
        </div>
        
        {/* Actualizamos el botón para abrir el modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Agregar Tarjeta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* ... (mantén el mapeo de las tarjetas que ya tenías) */}
        {cards.map((card) => {
            // Tu código de renderizado de tarjeta anterior...
            return (
                <div key={card.id} className="bg-[#111111] border border-zinc-800 rounded-2xl p-1 shadow-lg">
                    {/* Contenido de la tarjeta */}
                    <div className={`relative p-6 rounded-xl bg-gradient-to-br ${card.color} overflow-hidden min-h-[200px] flex flex-col justify-between`}>
                        {/* ... resto del código visual de la tarjeta ... */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <span className="text-white/80 text-sm font-medium tracking-wider">{card.name}</span>
                            <CreditCard className="w-6 h-6 text-white/80" />
                        </div>
                        <div className="relative z-10 mt-8">
                            <div className="text-white/60 text-xs mb-1">{card.type === 'CREDIT' ? 'Deuda actual' : 'Saldo disponible'}</div>
                            <div className="text-3xl font-semibold text-white tracking-tight">${card.balanceUsed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div className="text-white/80 text-sm tracking-widest mt-4 font-mono">•••• •••• •••• {card.lastFourDigits}</div>
                        </div>
                    </div>
                    {/* Barra de progreso si es crédito */}
                    {card.type === 'CREDIT' && (
                        <div className="p-5 mt-2">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Límite de crédito</span>
                                <span className="text-zinc-100 font-medium">${card.limit.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${(card.balanceUsed / card.limit) * 100}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )
        })}
      </div>

      {/* Renderizamos el modal */}
      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Cards;