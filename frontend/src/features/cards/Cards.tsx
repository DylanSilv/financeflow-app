import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Trash2, ChevronDown, ArrowDownRight } from 'lucide-react';
import { useCardData, Card } from '@/hooks/useCardData';
import { AddCardModal } from './AddCardModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const BANK_ACCENT: Record<string, string> = {
  'from-orange-600 to-orange-400': 'Itaú',
  'from-red-700 to-rose-600':      'Santander',
  'from-yellow-500 to-amber-400':  'Alimentación',
  'from-blue-700 to-cyan-500':     'Creditel',
  'from-red-900 to-red-700':       'Scotiabank',
  'from-violet-700 to-violet-500': 'Prex',
  'from-sky-500 to-cyan-400':      'Mercado Pago',
};

interface Tx { id: string; title: string; amount: number; date: string; type: 'INCOME'|'EXPENSE'; category?: { name: string; color: string } | null; }

function getBankLabel(color: string, name: string): string {
  return BANK_ACCENT[color] ?? name;
}

function CreditCardDetail({ card, index }: { card: Card; index: number }) {
  const [open, setOpen] = useState(false);
  const [txs, setTxs]   = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<Tx[]>('/transactions', { params: { take: '8', cardId: card.id } })
      .then(r => setTxs(r.data.filter(t => t.type === 'EXPENSE')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, card.id]);

  const bankLabel = getBankLabel(card.color, card.name);
  const usedPct   = card.limit > 0 ? Math.min((card.balance / card.limit) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700 transition-colors"
    >
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
          {card.limit > 0 && (
            <p className="text-white/60 text-xs mt-1">
              Disponible: <span className="text-white/80 font-medium">${(card.limit - card.balance).toLocaleString('es-UY', { minimumFractionDigits: 2 })}</span>
            </p>
          )}
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
            <motion.div
              className={`h-full rounded-full ${usedPct > 85 ? 'bg-red-500' : usedPct > 60 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 0.8, delay: index * 0.08 + 0.3, ease: 'easeOut' }}
            />
          </div>
          {card.dueDay && (
            <p className="text-zinc-600 text-[10px] mt-2">
              Vence el día {card.dueDay} de cada mes
              {card.statementDay ? ` · Cierra el día ${card.statementDay}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Botón expandir historial */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border-t border-zinc-800/60"
      >
        <span>Últimas compras</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </motion.button>

      {/* Mini historial */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="history"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-zinc-800/60"
          >
            {loading ? (
              <p className="text-xs text-zinc-600 text-center py-4">Cargando...</p>
            ) : txs.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">Sin compras registradas</p>
            ) : (
              <div className="divide-y divide-zinc-800/40">
                {txs.map((t, ti) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: ti * 0.04 }}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
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
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DebitCardItem({ card, onDelete, index }: { card: Card; onDelete: () => void; index: number }) {
  const [open,    setOpen]    = useState(false);
  const [txs,     setTxs]     = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !card.accountId) return;
    setLoading(true);
    api.get<Tx[]>('/transactions', { params: { take: '8', accountId: card.accountId } })
      .then(r => setTxs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, card.accountId]);

  const bankLabel = getBankLabel(card.color, card.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700 transition-colors group"
    >
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
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onDelete} aria-label="Eliminar tarjeta"
          className="absolute top-3 right-3 z-20 p-1.5 bg-black/30 hover:bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-white/80" />
        </motion.button>
      </div>

      {/* Expandible historial (igual que crédito) */}
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border-t border-zinc-800/60"
      >
        <span>Últimos movimientos</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div key="debit-history"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-zinc-800/60"
          >
            {loading ? (
              <p className="text-xs text-zinc-600 text-center py-4">Cargando...</p>
            ) : txs.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">Sin movimientos registrados</p>
            ) : (
              <div className="divide-y divide-zinc-800/40">
                {txs.map((t, ti) => (
                  <motion.div key={t.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: ti * 0.04 }}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        t.type === 'INCOME' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}>
                        {t.type === 'INCOME'
                          ? <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                          : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{t.title}</p>
                        <p className="text-[10px] text-zinc-600">{new Date(t.date).toLocaleDateString('es-UY')}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ml-3 flex-shrink-0 ${
                      t.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'
                    }`}>
                      {t.type === 'INCOME' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const Cards = () => {
  const { cards, loading, deleteCard, refetch } = useCardData();
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const creditCards = cards.filter(c => c.type === 'CREDIT');
  const debitCards  = cards.filter(c => c.type === 'DEBIT');

  return (
    <div className="flex flex-col gap-8">
      <motion.header
        {...fadeUp()}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Tarjetas</h1>
          <p className="text-zinc-400 mt-1">Gestiona tus tarjetas de crédito y débito.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Nueva Tarjeta
        </motion.button>
      </motion.header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">
              <Skeleton className="h-[190px] rounded-none" />
              <div className="p-5 flex flex-col gap-3">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-medium text-lg">Sin tarjetas registradas</p>
            <p className="text-zinc-500 text-sm mt-1">Agregá tu primera tarjeta para comenzar.</p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Tarjetas de Débito */}
          {debitCards.length > 0 && (
            <motion.div {...fadeUp(0.1)}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Débito</h2>
                <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{debitCards.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {debitCards.map((card, i) => (
                  <DebitCardItem key={card.id} card={card} index={i} onDelete={() => setPendingDelete(card.id)} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Tarjetas de Crédito */}
          {creditCards.length > 0 && (
            <motion.div {...fadeUp(debitCards.length > 0 ? 0.2 : 0.1)}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Crédito</h2>
                <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">{creditCards.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {creditCards.map((card, i) => (
                  <CreditCardDetail key={card.id} card={card} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      <AddCardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refetch} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar tarjeta?"
        description="Se eliminará la tarjeta y todos sus datos. Esta acción es irreversible."
        confirmLabel="Eliminar"
        onConfirm={() => { if (pendingDelete) deleteCard(pendingDelete); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Cards;
