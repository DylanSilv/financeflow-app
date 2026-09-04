import React, { useState } from 'react';
import { Target } from 'lucide-react';

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
import { SwitchField } from '@/components/ui/switch-field';
import { ColorSwatches } from '@/components/color-swatches';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

import { GOAL_COLORS } from './goal-colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddSavingsGoalModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const user = useAuthStore(s => s.user);
  const [name, setName] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [hasTarget, setHasTarget] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('El nombre de la meta es obligatorio.');
    if (currentAmount && parseFloat(currentAmount) < 0) {
      return setError('El monto actual no puede ser negativo.');
    }
    if (hasTarget) {
      if (!targetAmount || parseFloat(targetAmount) <= 0) {
        return setError('El monto objetivo debe ser mayor a $0.');
      }
      if (currentAmount && parseFloat(currentAmount) > parseFloat(targetAmount)) {
        return setError('El monto ya ahorrado no puede superar el objetivo.');
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('SavingsGoal').insert({
        name,
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetAmount: hasTarget && targetAmount ? parseFloat(targetAmount) : 0,
        deadline: hasTarget && deadline ? deadline : null,
        color,
        userId: user!.id,
      });
      if (error) throw error;

      setName('');
      setCurrentAmount('');
      setTargetAmount('');
      setDeadline('');
      setHasTarget(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('alta de meta de ahorro falló:', err);
      setError('No se pudo crear la meta de ahorro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Target className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Nuevo ahorro</DialogTitle>
              <DialogDescription>Creá un fondo con o sin objetivo fijo.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Viaje a Brasil"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-current">
              Ya ahorrado <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                min="0"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <SwitchField
            checked={hasTarget}
            onChange={setHasTarget}
            label="Tengo un objetivo en mente"
            sublabel="Definir monto y fecha límite"
          />

          {hasTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-target">Monto objetivo</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    $
                  </span>
                  <Input
                    id="goal-target"
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
                <Label htmlFor="goal-deadline">
                  Fecha límite{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>Color</Label>
            <ColorSwatches swatches={GOAL_COLORS} value={color} onChange={setColor} />
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando…' : 'Crear ahorro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
