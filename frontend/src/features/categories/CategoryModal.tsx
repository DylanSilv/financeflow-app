import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Check } from 'lucide-react';
import { api } from '@/lib/axios';
import { Category } from '@/hooks/useCategoryData';

const COLORS = [
  { hex: '#ef4444', label: 'Rojo'     },
  { hex: '#f97316', label: 'Naranja'  },
  { hex: '#eab308', label: 'Amarillo' },
  { hex: '#10b981', label: 'Verde'    },
  { hex: '#06b6d4', label: 'Celeste'  },
  { hex: '#6366f1', label: 'Índigo'   },
  { hex: '#a855f7', label: 'Violeta'  },
  { hex: '#ec4899', label: 'Rosa'     },
  { hex: '#71717a', label: 'Gris'     },
  { hex: '#f59e0b', label: 'Ámbar'    },
  { hex: '#14b8a6', label: 'Teal'     },
  { hex: '#84cc16', label: 'Lima'     },
];

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  category?:  Category | null;
}

export const CategoryModal = ({ isOpen, onClose, onSuccess, category }: Props) => {
  const isEdit = !!category;
  const [name,    setName]    = useState('');
  const [color,   setColor]   = useState(COLORS[0].hex);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      setName(category.name);
      setColor(category.color ?? COLORS[0].hex);
    } else if (isOpen) {
      setName(''); setColor(COLORS[0].hex);
    }
    setError(null);
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/categories/${category!.id}`, { name: name.trim(), color });
      } else {
        await api.post('/categories', { name: name.trim(), color });
      }
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'No se pudo guardar la categoría.');
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
              className="bg-[#0f0f0f] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Tag className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {isEdit ? 'Editar categoría' : 'Nueva categoría'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-white truncate">
                    {name || 'Nombre de la categoría'}
                  </span>
                </div>

                {/* Nombre */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Nombre</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej. Supermercado"
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c.hex} type="button"
                        onClick={() => setColor(c.hex)}
                        title={c.label}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                        style={{ backgroundColor: c.hex,
                          outline: color === c.hex ? `2px solid white` : 'none',
                          outlineOffset: '2px',
                          transform: color === c.hex ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        {color === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-40"
                >
                  {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
