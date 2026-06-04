import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard as CardIcon } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CARD_COLORS = [
  { name: 'Blue Ocean', value: 'from-blue-900 to-blue-600' },
  { name: 'Dark Metal', value: 'from-zinc-900 to-zinc-700' },
  { name: 'Emerald', value: 'from-emerald-800 to-emerald-500' },
  { name: 'Royal Purple', value: 'from-indigo-900 to-purple-700' },
  { name: 'Sunset', value: 'from-orange-700 to-red-600' },
];

export const AddCardModal = ({ isOpen, onClose }: Props) => {
  const addCard = useCardStore((state) => state.addCard);

  const [name, setName] = useState('');
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [brand, setBrand] = useState<'VISA' | 'MASTERCARD' | 'AMEX'>('VISA');
  const [limit, setLimit] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [color, setColor] = useState(CARD_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lastFour) return;

    addCard({
      name,
      type,
      brand,
      limit: type === 'CREDIT' ? parseFloat(limit) : 0,
      balanceUsed: 0,
      lastFourDigits: lastFour.slice(-4),
      color
    });

    // Resetear y cerrar
    setName('');
    setLimit('');
    setLastFour('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <CardIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Vincular Tarjeta</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre de la Tarjeta</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Visa Infinite"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Últimos 4 Dígitos</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={lastFour}
                      onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
                      placeholder="4242"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="CREDIT">Crédito</option>
                      <option value="DEBIT">Débito</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Franquicia</label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value as any)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="AMEX">American Express</option>
                    </select>
                  </div>
                </div>

                {type === 'CREDIT' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Límite de Crédito</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600">$</span>
                      <input
                        type="number"
                        required
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Estilo Visual</label>
                  <div className="flex gap-3">
                    {CARD_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${
                          color === c.value ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-4 py-4 text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    Confirmar Registro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};