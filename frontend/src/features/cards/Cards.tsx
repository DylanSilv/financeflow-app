import { useState, useEffect } from 'react';
import { Plus, CreditCard, Trash2, ChevronDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useCardData, Card } from '@/hooks/useCardData';
import { AddCardModal } from './AddCardModal';
import { api } from '@/lib/axios';

const BANK_ACCENT: Record<string, string> = {
  'from-orange-600 to-orange-400': 'Itaú',
  'from-red-700 to-rose-600':      'Santander',
  'from-green-700 to-emerald-500': 'Alimentación',
  'from-blue-700 to-cyan-500':     'Creditel',
  'from-red-900 to-red-700':       'Scotiabank',
  'from-violet-700 to-violet-500': 'Prex',
  'from-sky-500 to-cyan-400':      'Mercado Pago',
};

interface Tx { id: string; title: string; amount: number; date: string; type: 'INCOME'|'EXPENSE'; category?: { name: string; color: string } | null; }

function getBankLabel(color: string, name: string): string {
  return BANK_ACCENT[color] ?? name;
}

function CreditCardDetail({ card }: { card: Card }) {
  const [open, setOpen] = useState(false);
  const [txs, setTxs]   = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !card.accountId) return;
    setLoading(true);
    api.get<Tx[]>('/transactions', { params: { take: '10' } })
      .then(r => setTxs(r.data.filter(t => t.type === 'EXPENSE').slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, card.accountId]);

  const bankLabel = getBankLabel(card.color, card.name);
  const usedPct   = card.limit > 0 ? Math.min((card.balance / card.limit) * 100, 100) : 0;

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg group hover:border-zinc-700 transition-all">
      {/* Frente de la tarjeta */}
      <div className={`relative p-6 bg-gradient-to-br ${card.color} overflow-hidden min-h-[190px] flex flex-col justify-between`}>
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-black/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">{bankLabel}</p>
            <p className="text-white font-semibold text-base mt-0.5">{card.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-white/70 text-xs font-medium">{card.brand}</span>
            <span className="text-white/50 text-[10px]">Crédito</span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Deuda actual</p>
          <p className="text-2xl font-bold text-white tracking-tight">
            ${card.balance.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/60 text-sm tracking-[0.2em] font-mono mt-3">
            •••• •••• •••• {card.lastFourDigits}
          </p>
        </div>
      </div>

      {/* Barra de crédito */}
      {card.limit > 0 && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-zinc-500">Límite utilizado</span>
            <span className="text-zinc-300 font-medium">
              ${card.balance.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
              <span className="text-zinc-600"> / ${card.limit.toLocaleString('es-UY')}</span>
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
              style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      )}

      {/* Botón expandir historial */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border-t border-zinc-800/60"
      >
        <span>Últimas compras</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Mini historial */}
      {open && (
        <div className="border-t border-zinc-800/60">
          {loading ? (
            <p className="text-xs text-zinc-600 text-center py-4">Cargando...</p>
          ) : txs.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4">Sin compras registradas</p>
          ) : (
            <div className="divide-y divide-zinc-800/40">
              {txs.map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-600">{new Date(t.date).toLocaleDateString('es-UY')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 ml-3 flex-shrink-0">
                    -${Number(t.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DebitCardItem({ card, onDelete }: { card: Card; onDelete: () => void }) {
  const bankLabel = getBankLabel(card.color, card.name);

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg group hover:border-zinc-700 transition-all">
      <div className={`relative p-6 bg-gradient-to-br ${card.color} overflow-hidden min-h-[190px] flex flex-col justify-between`}>
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-black/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">{bankLabel}</p>
            <p className="text-white font-semibold text-base mt-0.5">{card.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-white/70 text-xs font-medium">{card.brand}</span>
            <span className="text-white/50 text-[10px]">Débito</span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Saldo disponible</p>
          <p className="text-2xl font-bold text-white tracking-tight">
            ${card.balance.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/60 text-sm tracking-[0.2em] font-mono mt-3">
            •••• •••• •••• {card.lastFourDigits}
          </p>
        </div>
        <button onClick={onDelete}
          className="absolute top-3 right-3 p-1.5 bg-black/30 hover:bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          title="Eliminar tarjeta">
          <Trash2 className="w-3.5 h-3.5 text-white/80" />
        </button>
      </div>
    </div>
  );
}

export const Cards = () => {
  const { cards, loading, deleteCard, refetch } = useCardData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const creditCards = cards.filter(c => c.type === 'CREDIT');
  const debitCards  = cards.filter(c => c.type === 'DEBIT');

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Tarjetas</h1>
          <p className="text-zinc-400 mt-1">Gestiona tus tarjetas de crédito y débito.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" /> Agregar Tarjeta
        </button>
      </header>

      {loading ? (
        <div className="text-center text-zinc-500 py-12">Cargando tarjetas...</div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-medium text-lg">Sin tarjetas registradas</p>
            <p className="text-zinc-500 text-sm mt-1">Agregá tu primera tarjeta para comenzar.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Tarjetas de Débito */}
          {debitCards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Débito</h2>
                <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{debitCards.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {debitCards.map(card => (
                  <DebitCardItem key={card.id} card={card} onDelete={() => deleteCard(card.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Tarjetas de Crédito */}
          {creditCards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Crédito</h2>
                <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{creditCards.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {creditCards.map(card => (
                  <CreditCardDetail key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AddCardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refetch} />
    </div>
  );
};

export default Cards;
