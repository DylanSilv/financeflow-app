import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Landmark, Pencil, Trash2 } from 'lucide-react';
import { useAccountData, Account } from '@/hooks/useAccountData';
import { AccountModal } from './AccountModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Cuenta Corriente',
  SAVINGS:  'Caja de Ahorro',
  CASH:     'Efectivo',
  BENEFIT:  'Beneficio',
};

const COLOR_MAP: Record<string, string> = {
  indigo:  'bg-indigo-500',
  violet:  'bg-violet-500',
  sky:     'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  zinc:    'bg-zinc-400',
  orange:  'bg-orange-500',
};

function colorCls(color: string | null): string {
  return color ? (COLOR_MAP[color] ?? 'bg-indigo-500') : 'bg-indigo-500';
}

function AccountCard({
  account, index,
  onEdit, onDelete,
}: {
  account: Account; index: number;
  onEdit: () => void; onDelete: () => void;
}) {
  const isNegative = account.balance < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors group"
    >
      {/* Indicador de color */}
      <div className={`w-3 h-12 rounded-full flex-shrink-0 ${colorCls(account.color)}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-base truncate">{account.name}</p>
        <p className="text-zinc-500 text-xs mt-0.5">{TYPE_LABELS[account.type] ?? account.type}</p>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
          {isNegative ? '-' : ''}$
          {Math.abs(account.balance).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
        </p>
        {account.initialBalance !== 0 && (
          <p className="text-zinc-600 text-[11px] mt-0.5">
            Inicial: ${account.initialBalance.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          aria-label="Editar cuenta"
        >
          <Pencil className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Eliminar cuenta"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export const Accounts = () => {
  const { accounts, loading, refetch, deleteAccount } = useAccountData();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editAccount,  setEditAccount]  = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const handleEdit = (account: Account) => { setEditAccount(account); setModalOpen(true); };
  const handleNew  = () => { setEditAccount(null); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditAccount(null); };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.header {...fadeUp()} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Cuentas</h1>
          <p className="text-zinc-400 mt-1">Gestioná tus cuentas bancarias y de efectivo.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleNew}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Nueva Cuenta
        </motion.button>
      </motion.header>

      {/* Resumen total */}
      {!loading && accounts.length > 0 && (
        <motion.div
          {...fadeUp(0.05)}
          className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Patrimonio total</p>
            <p className={`text-3xl font-bold tracking-tight ${totalBalance < 0 ? 'text-red-400' : 'text-white'}`}>
              {totalBalance < 0 ? '-' : ''}$
              {Math.abs(totalBalance).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
              <Skeleton className="w-3 h-12 rounded-full" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center">
            <Landmark className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-medium text-lg">Sin cuentas registradas</p>
            <p className="text-zinc-500 text-sm mt-1">Agregá tu primera cuenta para comenzar.</p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((account, i) => (
            <AccountCard
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
        onSuccess={() => { handleClose(); refetch(); }}
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
