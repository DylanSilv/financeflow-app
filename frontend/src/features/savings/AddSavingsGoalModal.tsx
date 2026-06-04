import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target } from 'lucide-react';
import { useSavingsStore } from '@/store/useSavingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GOAL_COLORS = [
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Rose', value: 'bg-rose-500' },
];

export const AddSavingsGoalModal = ({ isOpen, onClose }: Props) => {
  const addGoal = useSavingsStore((state) => state.addGoal);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    addGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      deadline: deadline || undefined,
      color
    });

    setName('');
    setTargetAmount('');
    setDeadline('');
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Nueva Meta de Ahorro</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">¿Para qué estás ahorrando?</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Viaje a Japón, Fondo de Emergencia"
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Monto Objetivo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-zinc-600">$</span>
                      <input
                        type="number"
                        required
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Fecha Límite (Opcional)</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Color de la Meta</label>
                  <div className="flex gap-3">
                    {GOAL_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full ${c.value} border-2 transition-all ${
                          color === c.value ? 'border-white scale-110' : 'border-transparent opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-4 py-3.5 text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    Crear Meta de Ahorro
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