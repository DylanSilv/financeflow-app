import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { Cell, Pie, PieChart } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { CategoryExpense } from '@/hooks/useDashboardData';
import { supabase } from '@/lib/supabase';
import { fmt, monthLabel } from '@/lib/format';

/** Paleta de reserva para categorías sin color propio en la DB. */
const FALLBACK_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

/** Gris que usa la DB cuando la categoría no tiene color asignado. */
const UNASSIGNED_COLOR = '#71717a';

const colorFor = (cat: CategoryExpense, i: number) =>
  cat.color && cat.color !== UNASSIGNED_COLOR
    ? cat.color
    : FALLBACK_COLORS[i % FALLBACK_COLORS.length];

type Mode = 'month' | 'all';

export function CategoryExpenses() {
  const now = new Date();
  const [mode, setMode] = useState<Mode>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<{ categories: CategoryExpense[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const prevMonth = () => {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = mode === 'month' ? { p_year: year, p_month: month } : {};

    void (async () => {
      try {
        const { data: rows } = await supabase.rpc('get_gastos_por_categoria', params);
        if (!cancelled) setData(rows as { categories: CategoryExpense[]; total: number } | null);
      } catch (err) {
        console.error('get_gastos_por_categoria falló:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, year, month]);

  const cats = data?.categories ?? [];

  // Más de seis porciones vuelven la torta ilegible: el resto va a "Otros".
  const pieData =
    cats.length <= 6
      ? cats
      : [
          ...cats.slice(0, 6),
          {
            name: 'Otros',
            color: UNASSIGNED_COLOR,
            total: cats.slice(6).reduce((s, c) => s + c.total, 0),
            percentage: 0,
          },
        ];

  const chartConfig = Object.fromEntries(
    pieData.map((cat, i) => [cat.name, { label: cat.name, color: colorFor(cat, i) }]),
  ) satisfies ChartConfig;

  const onlyUnassigned = cats.length === 1 && cats[0].name === 'Sin categoría';

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Gastos por categoría</CardTitle>
        <CardDescription className="first-letter:uppercase">
          {mode === 'month' ? monthLabel(year, month) : 'Total histórico'}
          {!loading && data && ` · $${fmt(data.total)} en gastos`}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={v => v && setMode(v as Mode)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="month">Mes</ToggleGroupItem>
            <ToggleGroupItem value="all">Histórico</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {mode === 'month' && (
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" className="size-7" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
              <span className="sr-only">Mes anterior</span>
            </Button>
            <span className="min-w-[88px] text-center text-xs font-medium first-letter:uppercase">
              {monthLabel(year, month, 'short')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={nextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Mes siguiente</span>
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : cats.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin datos de gastos.</p>
        ) : onlyUnassigned ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Tag className="text-muted-foreground size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Sin categorías asignadas</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Total: ${fmt(data?.total ?? 0)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[180px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      formatter={(value, name) => (
                        <div className="flex flex-1 justify-between gap-3 leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-medium tabular-nums">
                            ${fmt(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={pieData as unknown as Record<string, unknown>[]}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {pieData.map((cat, i) => (
                    <Cell key={cat.name} fill={colorFor(cat, i)} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="space-y-2">
              {cats.slice(0, 6).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2.5">
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorFor(cat, i) }}
                  />
                  <span className="flex-1 truncate text-xs">{cat.name}</span>
                  <span className="text-muted-foreground text-xs">{cat.percentage}%</span>
                  <span className="w-20 text-right text-xs font-semibold tabular-nums">
                    ${fmt(cat.total)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
