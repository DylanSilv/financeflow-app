import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { fmtDec } from '@/lib/format';
import type { Transaction } from '@/hooks/useTransactionData';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Concepto</TableHead>
          <TableHead className="hidden md:table-cell">Categoría</TableHead>
          <TableHead className="hidden text-right md:table-cell">Fecha</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <AnimatePresence mode="popLayout">
          {transactions.map((t, i) => {
            const isIncome = t.type === 'INCOME';
            const date = new Date(t.date).toLocaleDateString('es-UY');

            return (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                className="hover:bg-muted/40 group border-b transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        isIncome ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                      )}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs md:hidden">{date}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {t.category && (
                    <span className="flex items-center gap-2">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: t.category.color }}
                      />
                      <span className="text-muted-foreground text-sm">{t.category.name}</span>
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-muted-foreground hidden text-right text-sm md:table-cell">
                  {date}
                </TableCell>

                <TableCell className="text-right">
                  <span className={cn('font-semibold tabular-nums', isIncome && 'text-success')}>
                    {isIncome ? '+' : '-'}${fmtDec(Math.abs(Number(t.amount)))}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(t)}
                      aria-label="Editar movimiento"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive size-8"
                      onClick={() => onDelete(t)}
                      aria-label="Eliminar movimiento"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </TableBody>
    </Table>
  );
}
