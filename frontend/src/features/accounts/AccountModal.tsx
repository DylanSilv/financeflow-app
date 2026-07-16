import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Landmark, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Account } from '@/hooks/useAccountData';

const COLORS = [
  { id: 'indigo',  label: 'Índigo',    cls: 'bg-indigo-500' },
  { id: 'violet',  label: 'Violeta',   cls: 'bg-violet-500' },
  { id: 'sky',     label: 'Celeste',   cls: 'bg-sky-500' },
  { id: 'emerald', label: 'Verde',     cls: 'bg-emerald-500' },
  { id: 'amber',   label: 'Ámbar',     cls: 'bg-amber-500' },
  { id: 'rose',    label: 'Rosa',      cls: 'bg-rose-500' },
  { id: 'zinc',    label: 'Gris',      cls: 'bg-zinc-400' },
  { id: 'orange',  label: 'Naranja',   cls: 'bg-orange-500' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Cuenta Corriente',
  SAVINGS:  'Caja de Ahorro',
  CASH:     'Efectivo',
  BENEFIT:  'Beneficio',
};

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  account?:   Account | null;
}

const INPUT_CLS = 'w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all';

export const AccountModal = ({ isOpen, onClose, onSuccess, account }: Props) => {
  const isEdit = !!account;
  const user   = useAuthStore(s => s.user);

  const [name,    setName]    = useState('');
  const [type,    setType]    = useState<'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT'>('CHECKING');
  const [color,   setColor]   = useState<string>(COLORS[0].id);
  const [initial, setInitial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account) {
      setName(account.name);
      setType(account.type);
      setColor(account.color ?? COLORS[0].id);
      setInitial(String(account.initialBalance));
    } else if (isOpen) {
      setName(''); setType('CHECKING'); setColor(COLORS[0].id); setInitial('');
    }
    setError(null);
  }, [isOpen, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }

    const payload = {
      name:           name.trim(),
      type,
      color,
      initialBalance: parseFloat(initial) || 0,
    };

    setLoading(true);
    try {
      if (isEdit) {
        const { error } = await supabase.from('Account').update(payload).eq('id', account!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Account').insert({ ...payload, userId: user!.id });
        if (error) throw error;
      }
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? 'No se pudo guardar la cuenta.');
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Landmark className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {isEdit ? 'Editar Cuenta' : 'Nueva Cuenta'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej. BROU Corriente"
                    className={INPUT_CLS}
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Tipo</label>
                  <select
                    value={type} onChange={e => setType(e.target.value as typeof type)}
                    className={`${INPUT_CLS} appearance-none`}
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Saldo inicial */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                    Saldo inicial <span className="text-zinc-600 normal-case">(opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-zinc-600">$</span>
                    <input
                      type="number" step="0.01" min="0" value={initial}
                      onChange={e => setInitial(e.target.value)}
                      placeholder="0.00"
                      className={`${INPUT_CLS} pl-8`}
                    />
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c.id} type="button"
                        onClick={() => setColor(c.id)}
                        className={`w-8 h-8 rounded-full ${c.cls} flex items-center justify-center transition-all
                          ${color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f] scale-110' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {color === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-4 py-4 text-sm transition-all disabled:opacity-40"
                >
                  {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
