import { Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fmt } from '@/lib/format';

export interface AutoPayEntry {
  name: string;
  amount: number;
}

interface AutoPayBannerProps {
  entries: AutoPayEntry[];
  onDismiss: () => void;
}

export function AutoPayBanner({ entries, onDismiss }: AutoPayBannerProps) {
  if (entries.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20 bg-primary/5 py-0">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Zap className="text-primary size-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                AutoPay procesó {entries.length} gasto{entries.length !== 1 ? 's' : ''} automáticamente
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {entries.map(e => `${e.name} ($${fmt(e.amount)})`).join(' · ')}
              </p>
            </div>
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
