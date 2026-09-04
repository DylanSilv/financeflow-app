import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Pencil, PiggyBank, Target, Trash2, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AccountOption } from '@/hooks/useAccountsCache';
import type { SavingsGoal } from '@/hooks/useSavingsData';
import { fmt } from '@/lib/format';

const NO_ACCOUNT = 'none';
const DEFAULT_COLOR = 'var(--color-chart-1)';

interface GoalCardProps {
  goal: SavingsGoal;
  index: number;
  accounts: AccountOption[];
  onAddFunds: (id: string, amount: number, accountId?: string) => Promise<void>;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

export function GoalCard({ goal, index, accounts, onAddFunds, onEdit, onDelete }: GoalCardProps) {
  const [adding, setAdding] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [accountId, setAccountId] = useState(NO_ACCOUNT);
  const [error, setError] = useState('');

  const hasTarget = goal.targetAmount > 0;
  const progress = Math.min(goal.progress ?? 0, 100);
  const isCompleted = hasTarget && progress >= 100;
  const goalColor = goal.color ?? DEFAULT_COLOR;

  const reset = () => {
    setAdding(false);
    setInputAmount('');
    setAccountId(NO_ACCOUNT);
    setError('');
  };

  const handleAdd = async () => {
    const amount = parseFloat(inputAmount);
    if (!amount || amount <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    setError('');
    try {
      await onAddFunds(goal.id, amount, accountId === NO_ACCOUNT ? undefined : accountId);
      reset();
    } catch (err) {
      console.error('aporte a meta de ahorro falló:', err);
      setError('No se pudo registrar el aporte.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className="hover:border-primary/30 h-full transition-colors">
        <CardContent className="flex h-full flex-col justify-between">
          <div>
            <div className="mb-4 flex items-start justify-between">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: index * 0.08 + 0.1 }}
                className="rounded-xl p-3"
                style={{ backgroundColor: `color-mix(in oklab, ${goalColor} 20%, transparent)` }}
              >
                {hasTarget ? (
                  <Target className="size-5" style={{ color: goalColor }} />
                ) : (
                  <PiggyBank className="size-5" style={{ color: goalColor }} />
                )}
              </motion.div>

              <div className="flex items-center gap-1">
                {goal.deadline && (
                  <span className="text-muted-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium">
                    <CalendarIcon className="size-3.5" />
                    {new Date(goal.deadline).toLocaleDateString('es-UY', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onEdit(goal)}
                  aria-label="Editar meta de ahorro"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-destructive size-8"
                  onClick={() => onDelete(goal.id)}
                  aria-label="Eliminar meta de ahorro"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <h3 className="mb-0.5 text-base font-semibold">{goal.name}</h3>
            <p className="text-muted-foreground mb-5 text-xs">
              {hasTarget ? 'Meta definida' : 'Guardando sin objetivo fijo'}
            </p>

            <div className="mb-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums">${fmt(goal.currentAmount)}</span>
              {hasTarget && (
                <span className="text-muted-foreground text-sm tabular-nums">
                  / ${fmt(goal.targetAmount)}
                </span>
              )}
            </div>

            {hasTarget ? (
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-semibold" style={{ color: goalColor }}>
                    {progress}%
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
                    style={{ backgroundColor: isCompleted ? 'var(--color-success)' : goalColor }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="h-1 w-full rounded-full"
                style={{ backgroundColor: `color-mix(in oklab, ${goalColor} 25%, transparent)` }}
              >
                <div
                  className="h-full w-1/3 animate-pulse rounded-full"
                  style={{ backgroundColor: goalColor }}
                />
              </div>
            )}
          </div>

          <div className="mt-5">
            {isCompleted ? (
              <div className="border-success/20 bg-success/10 text-success flex w-full items-center justify-center rounded-lg border py-2.5 text-sm font-medium">
                ¡Meta alcanzada!
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {adding ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          autoFocus
                          value={inputAmount}
                          onChange={e => setInputAmount(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAdd()}
                          placeholder="0"
                          className="pl-7"
                        />
                      </div>
                      <Button type="button" onClick={handleAdd}>
                        Aportar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={reset}
                        aria-label="Cancelar aporte"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    {accounts.length > 0 && (
                      <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_ACCOUNT}>Sin descontar de cuenta</SelectItem>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {error && <p className="text-destructive text-xs">{error}</p>}

                    {accountId !== NO_ACCOUNT && (
                      <p className="text-muted-foreground text-[10px]">
                        Se registrará un gasto en la cuenta seleccionada.
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="add-btn"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}>
                      <TrendingUp /> Aportar fondos
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
