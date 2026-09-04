import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorSwatches } from '@/components/color-swatches';
import type { SavingsGoal } from '@/hooks/useSavingsData';

import { GOAL_COLORS } from './goal-colors';

interface Props {
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: (
    id: string,
    data: { name?: string; targetAmount?: number; deadline?: string | null; color?: string },
  ) => Promise<void>;
}

export const EditSavingsGoalModal = ({ goal, onClose, onSave }: Props) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!goal) return;
    setName(goal.name);
    setTargetAmount(goal.targetAmount > 0 ? String(goal.targetAmount) : '');
    setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : '');
    setColor(goal.color ?? GOAL_COLORS[0].value);
    setError(null);
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    setError(null);

    if (!name.trim()) return setError('El nombre es obligatorio.');
    const target = targetAmount ? parseFloat(targetAmount) : 0;
    if (targetAmount && (isNaN(target) || target < 0)) {
      return setError('El monto objetivo no puede ser negativo.');
    }

    setLoading(true);
    try {
      await onSave(goal.id, {
        name: name.trim(),
        targetAmount: target,
        deadline: deadline || null,
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
    <Dialog open={goal !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Pencil className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Editar ahorro</DialogTitle>
              <DialogDescription>Actualizá el objetivo y sus datos.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-goal-name">Nombre</Label>
            <Input id="edit-goal-name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-target">
                Monto objetivo{' '}
                <span className="text-muted-foreground font-normal">(0 = sin meta)</span>
              </Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="edit-goal-target"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-deadline">
                Fecha límite <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="edit-goal-deadline"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Color</Label>
            <ColorSwatches swatches={GOAL_COLORS} value={color} onChange={setColor} />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
