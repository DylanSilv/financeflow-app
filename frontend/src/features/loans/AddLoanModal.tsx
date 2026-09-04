import React, { useState } from 'react';
import { TrendingDown } from 'lucide-react';

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
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { CreateLoanInput } from '@/hooks/useLoanData';
import { scheduleSummary } from '@/lib/loanMath';
import { fmtDec } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoanInput) => Promise<void>;
}

// 'CUOTAS'  → compra financiada sin interés: se pide el total y se deriva la cuota.
// 'INTERES' → préstamo real: se pide capital y cuota, y se deriva la tasa.
type Mode = 'CUOTAS' | 'INTERES';

const money = (n: number) => `$${fmtDec(n)}`;

export const AddLoanModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [mode, setMode] = useState<Mode>('CUOTAS');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(''); // total o capital, según el modo
  const [installmentAmount, setInstallmentAmount] = useState(''); // sólo en 'INTERES'
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = parseInt(totalInstallments || '0', 10);
  const paid = parseInt(paidInstallments || '0', 10);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const monto = parseFloat(amount) || 0;

  // En cuotas la cuota se deriva; con interés la carga el usuario.
  const cuota =
    mode === 'CUOTAS' ? (total > 0 ? monto / total : 0) : parseFloat(installmentAmount) || 0;

  const resumen =
    mode === 'INTERES' && monto > 0 && cuota > 0 && total > 0
      ? scheduleSummary(monto, cuota, total)
      : null;

  const handleClose = () => {
    setMode('CUOTAS');
    setName('');
    setAmount('');
    setInstallmentAmount('');
    setTotalInstallments('');
    setPaidInstallments('0');
    setStartDate('');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (monto <= 0) {
      return setError(
        mode === 'CUOTAS' ? 'El monto total debe ser mayor a $0.' : 'El capital debe ser mayor a $0.',
      );
    }
    if (total < 1) return setError('El total de cuotas debe ser al menos 1.');
    if (paid > total) return setError('Las cuotas pagadas no pueden superar el total.');
    if (mode === 'INTERES') {
      if (cuota <= 0) return setError('La cuota mensual debe ser mayor a $0.');
      if (cuota * total <= monto) {
        return setError(
          'Con esos números no hay interés: el total de cuotas no supera al capital. Usá "Compra en cuotas".',
        );
      }
      if (resumen?.annualNominalPct == null) {
        return setError('No se pudo calcular la tasa con esos valores. Revisá capital, cuota y plazo.');
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        originalAmount: monto,
        installmentAmount: Number(cuota.toFixed(2)),
        totalInstallments: total,
        paidInstallments: paid,
        interestRate:
          mode === 'INTERES' ? Number(resumen!.annualNominalPct!.toFixed(4)) : null,
        startDate: startDate || undefined,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      console.error('alta de préstamo falló:', err);
      setError('No se pudo registrar el préstamo. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <TrendingDown className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle>Nuevo compromiso</DialogTitle>
              <DialogDescription>
                Registrá una compra en cuotas o un préstamo con interés.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={v => {
                if (!v) return;
                setMode(v as Mode);
                setError(null);
              }}
              variant="outline"
              className="w-full *:flex-1"
            >
              <ToggleGroupItem value="CUOTAS">Compra en cuotas</ToggleGroupItem>
              <ToggleGroupItem value="INTERES">Préstamo con interés</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted-foreground text-[10px]">
              {mode === 'CUOTAS'
                ? 'Sin interés: indicás el total y la cuota se calcula sola.'
                : 'Indicá capital, cuota y plazo; la tasa la calculamos nosotros.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-name">Nombre</Label>
            <Input
              id="loan-name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Creditel, Banco, Familiar…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">
                {mode === 'CUOTAS' ? 'Monto total' : 'Capital prestado'}
              </Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="loan-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-total-inst">Total de cuotas</Label>
              <Input
                id="loan-total-inst"
                type="number"
                min="1"
                required
                value={totalInstallments}
                onChange={e => setTotalInstallments(e.target.value)}
                placeholder="Ej. 12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mode === 'INTERES' && (
              <div className="space-y-2">
                <Label htmlFor="loan-installment">Cuota mensual</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    $
                  </span>
                  <Input
                    id="loan-installment"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={installmentAmount}
                    onChange={e => setInstallmentAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="loan-paid-inst">Ya pagadas</Label>
              <Input
                id="loan-paid-inst"
                type="number"
                min="0"
                max={totalInstallments || undefined}
                value={paidInstallments}
                onChange={e => setPaidInstallments(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {total > 0 && (monto > 0 || cuota > 0) && (
            <div className="bg-muted/50 space-y-2.5 rounded-xl border p-3">
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>
                  {paid} de {total} cuotas pagadas
                </span>
                <span className="text-foreground font-semibold">{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />

              {mode === 'CUOTAS' && cuota > 0 && (
                <div className="flex justify-between pt-1 text-[11px]">
                  <span className="text-muted-foreground">Cuota mensual</span>
                  <span className="font-semibold tabular-nums">{money(cuota)}</span>
                </div>
              )}

              {mode === 'INTERES' && resumen?.annualNominalPct != null && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Tasa nominal anual</span>
                    <span className="font-semibold tabular-nums">
                      {resumen.annualNominalPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Tasa efectiva anual</span>
                    <span className="tabular-nums">{resumen.annualEffectivePct!.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Intereses totales</span>
                    <span className="tabular-nums">{money(resumen.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Vas a pagar en total</span>
                    <span className="tabular-nums">{money(resumen.totalPaid)}</span>
                  </div>
                </div>
              )}

              {mode === 'INTERES' && monto > 0 && cuota > 0 && cuota * total <= monto && (
                <p className="pt-1 text-[10px] text-amber-500">
                  Con estos números no hay interés. Si la compra es sin recargo, usá «Compra en
                  cuotas».
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-start">
                Fecha de inicio{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="loan-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-notes">
                Notas <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="loan-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej. banco, garantía…"
              />
            </div>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registrando…' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
