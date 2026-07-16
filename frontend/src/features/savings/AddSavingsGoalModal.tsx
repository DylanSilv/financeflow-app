import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Toggle } from '@/components/ui/Toggle';

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
}

const GOAL_COLORS = [
  { hex: '#10b981', label: 'Esmeralda' },
  { hex: '#6366f1', label: 'Índigo'    },
  { hex: '#a855f7', label: 'Violeta'   },
  { hex: '#f59e0b', label: 'Ámbar'     },
  { hex: '#f43f5e', label: 'Rosa'      },
  { hex: '#EC0000', label: 'Rojo'      },
  { hex: '#06b6d4', label: 'Cyan'      },
];

export const AddSavingsGoalModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const user = useAuthStore(s => s.user);
  const [name,          setName]          = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [hasTarget,     setHasTarget]     = useState(false);
  const [targetAmount,  setTargetAmount]  = useState('');
  const [deadline,      setDeadline]      = useState('');
  const [color,         setColor]         = useState(GOAL_COLORS[0].hex);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('El nombre de la meta es obligatorio.'); return; }
    if (currentAmount && parseFloat(currentAmount) < 0) {
      setError('El monto actual no puede ser negativo.'); return;
    }
    if (hasTarget) {
      if (!targetAmount || parseFloat(targetAmount) <= 0) {
        setError('El monto objetivo debe ser mayor a $0.'); return;
      }
      if (currentAmount && parseFloat(currentAmount) > parseFloat(targetAmount)) {
        setError('El monto ya ahorrado no puede superar el objetivo.'); return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('SavingsGoal').insert({
        name,
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetAmount:  hasTarget && targetAmount ? parseFloat(targetAmount) : 0,
        deadline:      hasTarget && deadline ? deadline : null,
        color,
        userId:        user!.id,
      });
      if (error) throw error;

      setName(''); setCurrentAmount(''); setTargetAmount('');
      setDeadline(''); setHasTarget(false);
      onClose();
      onSuccess?.();
    } catch {
      setError('No se pudo crear la meta de ahorro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                <div className="space-y-2">
                  <label htmlFor="goal-name" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre</label>
                  <input
                    id="goal-name"
                    type="text" required value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Fondo de emergencia, Viaje..."
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="goal-current" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Monto actual ahorrado</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-zinc-600">$</span>
                    <input
                      id="goal-current"
                      type="number" min="0" step="0.01" value={currentAmount}
                      onChange={e => setCurrentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Toggle objetivo */}
                <Toggle
                  checked={hasTarget}
                  onChange={setHasTarget}
                  label="Tengo un objetivo en mente"
                  sublabel="Definir monto y fecha límite"
                />

                <AnimatePresence>
                  {hasTarget && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-2">
                          <label htmlFor="goal-target" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Monto objetivo</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-zinc-600">$</span>
                            <input
                              id="goal-target"
                              type="number" required={hasTarget} min="1" value={targetAmount}
                              onChange={e => setTargetAmount(e.target.value)}
                              placeholder="0"
                              className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="goal-deadline" className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Fecha límite (opcional)</label>
                          <input
                            id="goal-deadline"
                            type="date" value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Color */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Color</label>
                  <div className="flex gap-2.5">
                    {GOAL_COLORS.map(c => (
                      <button
                        key={c.hex} type="button"
                        onClick={() => setColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.hex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-4 py-3.5 text-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Crear Ahorro'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
