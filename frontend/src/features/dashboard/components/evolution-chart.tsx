import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyEvolution } from '@/hooks/useDashboardData';
import { fmt, fmtCompact } from '@/lib/format';

const chartConfig = {
  ingresos: { label: 'Ingresos', color: 'var(--color-success)' },
  gastos: { label: 'Gastos', color: 'var(--color-danger)' },
  balance: { label: 'Balance', color: 'var(--color-chart-balance)' },
} satisfies ChartConfig;

interface EvolutionChartProps {
  data: MonthlyEvolution[] | null;
  loading: boolean;
}

export function EvolutionChart({ data, loading }: EvolutionChartProps) {
  const chartData = (data ?? []).slice(-15).map(d => ({
    name: d.label,
    ingresos: Math.round(d.income),
    gastos: Math.round(d.expenses),
    balance: Math.round(d.balance),
  }));

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Evolución patrimonial</CardTitle>
        <CardDescription>
          Ingresos, gastos y balance acumulado mes a mes
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
            Sin datos de evolución
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={fmtCompact}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => (
                      <div className="flex flex-1 justify-between gap-3 leading-none">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          ${fmt(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="ingresos"
                fill="var(--color-ingresos)"
                opacity={0.75}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="gastos"
                fill="var(--color-gastos)"
                opacity={0.75}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2.5}
                fill="url(#fillBalance)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
