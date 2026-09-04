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
import type { Loan } from '@/hooks/useLoanData';

interface Props {
  loan: Loan | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; notes?: string }) => Promise<void>;
}

export const EditLoanModal = ({ loan, onClose, onSave }: Props) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loan) return;
    setName(loan.name);
    setNotes(loan.notes ?? '');
    setError(null);
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    setError(null);
    if (!name.trim()) return setError('El nombre es obligatorio.');

    setLoading(true);
    try {
      await onSave(loan.id, { name: name.trim(), notes: notes.trim() || undefined });
      onClose();
    } catch (err) {
      console.error('edición de préstamo falló:', err);
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={loan !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Pencil className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Editar compromiso</DialogTitle>
              <DialogDescription>
                Los montos y el plazo no se editan: se definen al crearlo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-loan-name">Nombre</Label>
            <Input id="edit-loan-name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-loan-notes">
              Notas <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="edit-loan-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. banco, garantía…"
            />
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
