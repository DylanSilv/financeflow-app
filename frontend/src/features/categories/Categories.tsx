import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useCategoryData, type Category } from '@/hooks/useCategoryData';

import { CategoryModal, DEFAULT_CATEGORY_COLOR } from './CategoryModal';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function CategoryChip({
  category,
  index,
  onEdit,
  onDelete,
}: {
  category: Category;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = category.color ?? DEFAULT_CATEGORY_COLOR;
  const inUse = category.transactionCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="hover:border-primary/30 group py-0 transition-colors">
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}
          >
            <div className="size-4 rounded-full" style={{ backgroundColor: color }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{category.name}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {inUse
                ? `${category.transactionCount} movimiento${category.transactionCount !== 1 ? 's' : ''}`
                : 'Sin movimientos'}
            </p>
          </div>

          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar categoría">
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={inUse}
              aria-label="Eliminar categoría"
              title={inUse ? 'Tiene movimientos asociados' : 'Eliminar'}
              className="hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const Categories = () => {
  const { categories, loading, refetch, deleteCategory } = useCategoryData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const inUse = categories.filter(c => c.transactionCount > 0).length;

  const handleEdit = (cat: Category) => {
    setEditTarget(cat);
    setModalOpen(true);
  };
  const handleNew = () => {
    setEditTarget(null);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorías"
        description="Organizá tus movimientos por tipo de gasto."
        action={
          <Button onClick={handleNew}>
            <Plus /> Nueva categoría
          </Button>
        }
      />

      {!loading && categories.length > 0 && (
        <Card className="from-primary/5 to-card dark:bg-card bg-gradient-to-t">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-xs tracking-widest uppercase">
                Total categorías
              </p>
              <p className="text-3xl font-bold tabular-nums">{categories.length}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{inUse} en uso</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {categories.length - inUse} sin movimientos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-[74px] w-full rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin categorías"
          description="Creá tu primera categoría para organizar tus gastos."
          action={
            <Button onClick={handleNew}>
              <Plus /> Nueva categoría
            </Button>
          }
        />
      ) : (
        <motion.div
          {...fadeUp(0.1)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((cat, i) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              index={i}
              onEdit={() => handleEdit(cat)}
              onDelete={() => setPendingDelete(cat)}
            />
          ))}
        </motion.div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSuccess={() => {
          handleClose();
          refetch();
        }}
        category={editTarget}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar categoría?"
        description={`Se eliminará "${pendingDelete?.name}". Los movimientos que la usaban quedarán sin categoría.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteCategory(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Categories;
