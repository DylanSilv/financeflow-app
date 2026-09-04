import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <div className="bg-destructive/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <AlertTriangle className="text-destructive size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
          </div>
        </DialogHeader>

        <DialogFooter className="sm:justify-stretch">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
