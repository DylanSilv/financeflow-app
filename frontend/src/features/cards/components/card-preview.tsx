import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import type { Bank } from '../banks';

interface CardPreviewProps {
  bank: Bank;
  name: string;
  brand: string;
  lastFour: string;
}

export function CardPreview({ bank, name, brand, lastFour }: CardPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex h-24 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br p-4',
        bank.gradient,
      )}
    >
      <div className="absolute top-0 right-0 -mt-6 -mr-6 size-20 rounded-full bg-white/10 blur-xl" />
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold text-white/90">{name || bank.name}</span>
        <span className="text-xs font-medium text-white/60">{brand}</span>
      </div>
      <div className="font-mono text-xs tracking-widest text-white/70">
        •••• •••• •••• {lastFour || '0000'}
      </div>
    </motion.div>
  );
}
