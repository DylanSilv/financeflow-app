import { Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fmt } from '@/lib/format';

export interface AutoPayEntry {
  name: string;
  amount: number;
}

interface AutoPayBannerProps {
  entries: AutoPayEntry[];
  onDismiss: () => void;
  /**
   * Con AutoPay disparado a mano queremos confirmar que corrió aunque no
   * hubiera nada que pagar; al entrar a la pantalla, en cambio, el banner
   * vacío sería ruido.
   */
  showWhenEmpty?: boolean;
}

export function AutoPayBanner({ entries, onDismiss, showWhenEmpty = false }: AutoPayBannerProps) {
  const isEmpty = entries.length === 0;
  if (isEmpty && !showWhenEmpty) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn('py-0', !isEmpty && 'border-primary/20 bg-primary/5')}>
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Zap
              className={cn('size-4 shrink-0', isEmpty ? 'text-muted-foreground' : 'text-primary')}
            />
            {isEmpty ? (
              <p className="text-muted-foreground text-sm">
                No hay pagos automáticos pendientes por hoy.
              </p>
            ) : (
              <div>
                <p className="text-sm font-semibold">
                  AutoPay procesó {entries.length} pago{entries.length !== 1 ? 's' : ''}{' '}
                  automáticamente
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {entries.map(e => `${e.name} ($${fmt(e.amount)})`).join(' · ')}
                </p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={onDismiss}>
            <X className="size-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
