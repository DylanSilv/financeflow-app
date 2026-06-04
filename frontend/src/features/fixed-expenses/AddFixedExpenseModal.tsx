import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays } from 'lucide-react';
import { useFixedExpenseStore } from '@/store/useFixedExpenseStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS = [
  { name: 'Azul', value: 'from-blue-600 to-blue-400' },
  { name: 'Esmeralda', value: 'from-emerald-600 to-emerald-400' },
  { name: 'Rojo', value: 'from-red-600 to-red-400' },
  { name: 'Púrpura', value: 'from-purple-600 to-purple-400' },
  { name: 'Naranja', value: 'from-orange-500 to-yellow-400' },
];

export const AddFixedExpenseModal = ({ isOpen, onClose }: Props) => {
  const addExpense = useFixedExpenseStore((state) => state.addExpense);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('1');
  const [autoPay, setAutoPay] = useState(false);
  const [color, setColor] = useState(CATEGORY_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) return;

    addExpense({
      name,
      amount: parseFloat(amount),
      dueDate: parseInt(dueDate, 10),
      autoPay,
      categoryColor: color
    });

    // Limpiar y cerrar
    setName('');
    setAmount('');
    setDueDate('1');
    setAutoPay(false);
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Nueva Cuenta Fija</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre del Servicio</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Spotify, Alquiler, Gimnasio"
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Monto Mensual</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600">$</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Día de Vencimiento</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="Ej. 15"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Color Distintivo</label>
                  <div className="flex gap-3">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${
                          color === c.value ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Toggle para Auto-pago */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#161616] border border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-white">Pago Automático</p>
                    <p className="text-xs text-zinc-500">Se debitará solo cada mes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPay(!autoPay)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoPay ? 'bg-indigo-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoPay ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3.5 text-sm hover:bg-zinc-200 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Guardar Cuenta Fija
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