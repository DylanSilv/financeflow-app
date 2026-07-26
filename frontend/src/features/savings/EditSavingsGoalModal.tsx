import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import { SavingsGoal } from '@/hooks/useSavingsData';

const GOAL_COLORS = [
  { hex: '#10b981', label: 'Esmeralda' },
  { hex: '#6366f1', label: 'Índigo'    },
  { hex: '#a855f7', label: 'Violeta'   },
  { hex: '#f59e0b', label: 'Ámbar'     },
  { hex: '#f43f5e', label: 'Rosa'      },
  { hex: '#EC0000', label: 'Rojo'      },
  { hex: '#06b6d4', label: 'Cyan'      },
];

interface Props {
  goal:    SavingsGoal | null;
  onClose: () => void;
  onSave:  (id: string, data: { name?: string; targetAmount?: number; deadline?: string | null; color?: string }) => Promise<void>;
}

export const EditSavingsGoalModal = ({ goal, onClose, onSave }: Props) => {
  const [name,         setName]         = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline,     setDeadline]     = useState('');
  const [color,        setColor]        = useState(GOAL_COLORS[0].hex);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    if (!goal) return;
    setName(goal.name);
    setTargetAmount(goal.targetAmount > 0 ? String(goal.targetAmount) : '');
    setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : '');
    setColor(goal.color ?? GOAL_COLORS[0].hex);
    setError(null);
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    const target = targetAmount ? parseFloat(targetAmount) : 0;
    if (targetAmount && (isNaN(target) || target < 0)) { setError('El monto objetivo no puede ser negativo.'); return; }

    setLoading(true);
    try {
      await onSave(goal!.id, {
        name:         name.trim(),
        targetAmount: target,
        deadline:     deadline || null,
        color,
      });
      onClose();
    } catch (err) {
      console.error('edición de meta de ahorro falló:', err);
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {goal && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg"><Pencil className="w-4 h-4 text-emerald-400" /></div>
                  <h2 className="text-base font-semibold text-white">Editar Meta de Ahorro</h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-goal-name" className="text-xs font-medium text-zinc-500">Nombre</label>
                  <input id="edit-goal-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-goal-target" className="text-xs font-medium text-zinc-500">Objetivo <span className="text-zinc-700">(opcional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-600 text-sm">$</span>
                      <input id="edit-goal-target" type="number" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                        className="w-full bg-[#161616] border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-goal-deadline" className="text-xs font-medium text-zinc-500">Fecha límite <span className="text-zinc-700">(opcional)</span></label>
                    <input id="edit-goal-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Color</label>
                  <div className="flex gap-2.5">
                    {GOAL_COLORS.map(c => (
                      <button key={c.hex} type="button" onClick={() => setColor(c.hex)} title={c.label}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.hex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-zinc-800 text-zinc-300 rounded-xl py-2.5 text-sm hover:bg-zinc-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Guardar'}
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
