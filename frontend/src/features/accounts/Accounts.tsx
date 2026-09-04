import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Landmark, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { useAccountData, type Account } from '@/hooks/useAccountData';
import { fmtDec } from '@/lib/format';
import { cn } from '@/lib/utils';

import { AccountModal, ACCOUNT_COLORS, ACCOUNT_TYPE_LABELS } from './AccountModal';

function swatchColor(color: string | null) {
  return ACCOUNT_COLORS.find(c => c.value === color)?.color ?? ACCOUNT_COLORS[0].color;
}

function AccountRow({
  account,
  index,
  onEdit,
  onDelete,
}: {
  account: Account;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isNegative = account.balance < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="hover:border-primary/30 group py-0 transition-colors">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className="h-12 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: swatchColor(account.color) }}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{account.name}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className={cn('text-lg font-bold tabular-nums', isNegative && 'text-danger')}>
              {isNegative ? '-' : ''}${fmtDec(Math.abs(account.balance))}
            </p>
            {account.initialBalance !== 0 && (
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Inicial: ${fmtDec(account.initialBalance)}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar cuenta">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Eliminar cuenta"
              className="hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const Accounts = () => {
  const { accounts, loading, refetch, deleteAccount } = useAccountData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setModalOpen(true);
  };
  const handleNew = () => {
    setEditAccount(null);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setEditAccount(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mis Cuentas"
        description="Gestioná tus cuentas bancarias y de efectivo."
        action={
          <Button onClick={handleNew}>
            <Plus /> Nueva cuenta
          </Button>
        }
      />

      {!loading && accounts.length > 0 && (
        <Card className="from-primary/5 to-card dark:bg-card bg-gradient-to-t">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-xs tracking-widest uppercase">
                Patrimonio total
              </p>
              <p
                className={cn(
                  'text-3xl font-bold tracking-tight tabular-nums',
                  totalBalance < 0 && 'text-danger',
                )}
              >
                {totalBalance < 0 ? '-' : ''}${fmtDec(Math.abs(totalBalance))}
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[86px] w-full rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Sin cuentas registradas"
          description="Agregá tu primera cuenta para comenzar."
          action={
            <Button onClick={handleNew}>
              <Plus /> Nueva cuenta
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account, i) => (
            <AccountRow
              key={account.id}
              account={account}
              index={i}
              onEdit={() => handleEdit(account)}
              onDelete={() => setPendingDelete(account)}
            />
          ))}
        </div>
      )}

      <AccountModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSuccess={() => {
          handleClose();
          refetch();
        }}
        account={editAccount}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="¿Eliminar cuenta?"
        description={`Se archivará "${pendingDelete?.name}". Los movimientos vinculados no se eliminan.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pendingDelete) deleteAccount(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Accounts;
