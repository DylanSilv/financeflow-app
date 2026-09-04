import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useCardData, type Card } from '@/hooks/useCardData';

import { AddCardModal } from './AddCardModal';
import { EditCardModal } from './EditCardModal';
import { CardItem } from './components/card-item';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function CardGroup({
  label,
  cards,
  delay,
  onEdit,
  onDelete,
}: {
  label: string;
  cards: Card[];
  delay: number;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
}) {
  if (cards.length === 0) return null;

  return (
    <motion.section {...fadeUp(delay)}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          {label}
        </h2>
        <Badge variant="secondary">{cards.length}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => (
          <CardItem
            key={card.id}
            card={card}
            index={i}
            onEdit={() => onEdit(card)}
            onDelete={() => onDelete(card.id)}
          />
        ))}
      </div>
    </motion.section>
  );
}

export const Cards = () => {
  const { cards, loading, deleteCard, updateCard, refetch } = useCardData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Card | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const creditCards = cards.filter(c => c.type === 'CREDIT');
  const debitCards = cards.filter(c => c.type === 'DEBIT');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis Tarjetas"
        description="Gestioná tus tarjetas de crédito y débito."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus /> Nueva tarjeta
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin tarjetas registradas"
          description="Agregá tu primera tarjeta para comenzar."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Nueva tarjeta
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          <CardGroup
            label="Débito"
            cards={debitCards}
            delay={0.1}
            onEdit={setEditTarget}
            onDelete={setPendingDelete}
          />
          <CardGroup
            label="Crédito"
            cards={creditCards}
            delay={debitCards.length > 0 ? 0.2 : 0.1}
            onEdit={setEditTarget}
            onDelete={setPendingDelete}
          />
        </div>
      )}

      <AddCardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refetch} />

      <EditCardModal card={editTarget} onClose={() => setEditTarget(null)} onSave={updateCard} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar tarjeta?"
        description="Se eliminará la tarjeta y todos sus datos. Esta acción es irreversible."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteCard(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Cards;
