import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal = ({ isOpen, onClose }: Props) => {
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [category, setCategory] = useState('Ocio');

  // Colores predefinidos para las categorías en nuestro mock
  const categoryColors: Record<string, string> = {
    'Comida': '#ef4444',
    'Trabajo': '#10b981',
    'Ocio': '#a855f7',
    'Transporte': '#eab308',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    addTransaction({
      title,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString(),
      paymentMethod: 'CREDIT_CARD', // Fijo por ahora
      category: {
        name: category,
        color: categoryColors[category] || '#71717a'
      }
    });

    // Resetear formulario y cerrar
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo oscuro con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Contenedor del Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-[#111111] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">Nuevo Movimiento</h2>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Selector de Tipo (Ingreso / Gasto) */}
                <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      type === 'EXPENSE' ? 'bg-[#111111] text-red-400 shadow-sm border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      type === 'INCOME' ? 'bg-[#111111] text-emerald-400 shadow-sm border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Ingreso
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Concepto</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Cena con amigos"
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Monto</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-500">$</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                    >
                      <option value="Comida">Comida</option>
                      <option value="Ocio">Ocio</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Trabajo">Trabajo</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-zinc-800/50">
                  <button
                    type="submit"
                    className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors"
                  >
                    Guardar Movimiento
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
