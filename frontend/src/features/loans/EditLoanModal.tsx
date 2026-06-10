import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import { Loan } from '@/hooks/useLoanData';

interface Props {
  loan:    Loan | null;
  onClose: () => void;
  onSave:  (id: string, data: { name: string; notes?: string }) => Promise<void>;
}

export const EditLoanModal = ({ loan, onClose, onSave }: Props) => {
  const [name,    setName]    = useState('');
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!loan) return;
    setName(loan.name);
    setNotes(loan.notes ?? '');
    setError(null);
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }

    setLoading(true);
    try {
      await onSave(loan!.id, { name: name.trim(), notes: notes.trim() || undefined });
      onClose();
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {loan && (
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
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg"><Pencil className="w-4 h-4 text-indigo-400" /></div>
                  <h2 className="text-base font-semibold text-white">Editar Préstamo</h2>
                </div>
                <button onClick={onClose} aria-label="Cerrar" className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-loan-name" className="text-xs font-medium text-zinc-500">Nombre</label>
                  <input id="edit-loan-name" type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-loan-notes" className="text-xs font-medium text-zinc-500">Notas <span className="text-zinc-700">(opcional)</span></label>
                  <textarea id="edit-loan-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Ej. banco, tasa, condiciones..."
                    className="w-full bg-[#161616] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none placeholder:text-zinc-700"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-zinc-800 text-zinc-300 rounded-xl py-2.5 text-sm hover:bg-zinc-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-white text-black font-semibold rounded-xl py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50">
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
