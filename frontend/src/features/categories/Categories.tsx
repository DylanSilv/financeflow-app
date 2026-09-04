import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { useCategoryData, Category } from '@/hooks/useCategoryData';
import { CategoryModal } from './CategoryModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function CategoryChip({ category, index, onEdit, onDelete }: {
  category: Category; index: number;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors group"
    >
      {/* Dot de color */}
      <div
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
        style={{ backgroundColor: (category.color ?? '#71717a') + '22' }}
      >
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color ?? '#71717a' }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{category.name}</p>
        <p className="text-xs text-zinc-600 mt-0.5">
          {category.transactionCount === 0
            ? 'Sin movimientos'
            : `${category.transactionCount} movimiento${category.transactionCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2 rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          aria-label="Editar categoría"
        >
          <Pencil className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          disabled={category.transactionCount > 0}
          className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Eliminar categoría"
          title={category.transactionCount > 0 ? 'Tiene movimientos asociados' : 'Eliminar'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export const Categories = () => {
  const { categories, loading, refetch, deleteCategory } = useCategoryData();
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editTarget,    setEditTarget]    = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const handleEdit  = (cat: Category) => { setEditTarget(cat); setModalOpen(true); };
  const handleNew   = () => { setEditTarget(null); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditTarget(null); };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.header {...fadeUp()} className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Categorías</h1>
          <p className="text-zinc-400 mt-1">Organizá tus movimientos por tipo de gasto.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleNew}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Nueva Categoría
        </motion.button>
      </motion.header>

      {/* Resumen */}
      {!loading && categories.length > 0 && (
        <motion.div {...fadeUp(0.05)} className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total categorías</p>
            <p className="text-3xl font-bold text-white">{categories.length}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs">
              {categories.filter(c => c.transactionCount > 0).length} en uso
            </p>
            <p className="text-zinc-600 text-xs mt-0.5">
              {categories.filter(c => c.transactionCount === 0).length} sin movimientos
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center">
            <Tag className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-medium text-lg">Sin categorías</p>
            <p className="text-zinc-500 text-sm mt-1">Creá tu primera categoría para organizar tus gastos.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <CategoryChip
              key={cat.id} category={cat} index={i}
              onEdit={() => handleEdit(cat)}
              onDelete={() => setPendingDelete(cat)}
            />
          ))}
        </motion.div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSuccess={() => { handleClose(); refetch(); }}
        category={editTarget}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar categoría?"
        description={`Se eliminará "${pendingDelete?.name}". Los movimientos que la usaban quedarán sin categoría.`}
        confirmLabel="Eliminar"
        onConfirm={() => { if (pendingDelete) deleteCategory(pendingDelete.id); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Categories;
