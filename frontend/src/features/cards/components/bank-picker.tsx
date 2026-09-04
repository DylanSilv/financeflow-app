import { Check } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { BANKS, type Bank } from '../banks';

interface BankPickerProps {
  value: Bank | null;
  onChange: (bank: Bank) => void;
}

export function BankPicker({ value, onChange }: BankPickerProps) {
  return (
    <div className="space-y-3">
      <Label>Banco / Emisor</Label>
      <div className="grid grid-cols-4 gap-2" role="radiogroup">
        {BANKS.map(bank => {
          const selected = value?.id === bank.id;
          return (
            <button
              key={bank.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(bank)}
              className={cn(
                'ring-offset-background relative flex h-14 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br transition-all',
                bank.gradient,
                selected
                  ? 'ring-foreground scale-105 ring-2 ring-offset-2'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <span className="px-1 text-xs font-bold text-white drop-shadow">{bank.short}</span>
              {selected && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-white">
                  <Check className="size-2.5 text-black" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
