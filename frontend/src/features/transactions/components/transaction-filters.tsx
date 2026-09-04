import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { AccountOption } from '@/hooks/useAccountsCache';

import type { CreditCardOption } from './use-credit-cards';

export type TypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';

/** El Select de Radix no admite "" como valor, así que el "todos" va con clave. */
export const ALL_OPTION = 'all';

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  accounts: AccountOption[];
  accountId: string;
  onAccountChange: (value: string) => void;
  creditCards: CreditCardOption[];
  cardId: string;
  onCardChange: (value: string) => void;
  type: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
  monthLabel: string;
  hasMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClearMonth: () => void;
}

export function TransactionFilters({
  search,
  onSearchChange,
  accounts,
  accountId,
  onAccountChange,
  creditCards,
  cardId,
  onCardChange,
  type,
  onTypeChange,
  monthLabel,
  hasMonth,
  onPrevMonth,
  onNextMonth,
  onClearMonth,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="py-0">
        <CardContent className="flex flex-col items-center justify-between gap-3 p-2 md:flex-row">
          <div className="relative w-full md:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar por concepto…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {accounts.length > 0 && (
            <Select value={accountId} onValueChange={onAccountChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>Todas las cuentas</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {creditCards.length > 0 && (
            <Select value={cardId} onValueChange={onCardChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>Todas las tarjetas</SelectItem>
                {creditCards.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <ToggleGroup
            type="single"
            value={type}
            onValueChange={v => v && onTypeChange(v as TypeFilter)}
            variant="outline"
            className="w-full md:w-auto"
          >
            <ToggleGroupItem value="ALL">Todos</ToggleGroupItem>
            <ToggleGroupItem value="INCOME">Ingresos</ToggleGroupItem>
            <ToggleGroupItem value="EXPENSE">Gastos</ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8" onClick={onPrevMonth}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Mes anterior</span>
        </Button>
        <span className="min-w-[140px] text-center text-sm font-medium">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onNextMonth}
          disabled={!hasMonth}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Mes siguiente</span>
        </Button>
        {hasMonth && (
          <Button variant="ghost" size="sm" onClick={onClearMonth}>
            Ver todos
          </Button>
        )}
      </div>
    </div>
  );
}
