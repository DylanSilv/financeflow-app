import { Card } from '@/components/ui/card';

/**
 * Maqueta del dashboard para el hero. No usa datos reales: es una ilustración
 * de la interfaz, con los mismos tokens de color que la app.
 */
const KPIS = [
  { accent: 'var(--color-chart-balance)', value: '$132.578', label: 'Balance' },
  { accent: 'var(--color-success)', value: '$121.586', label: 'Ingresos' },
  { accent: 'var(--color-danger)', value: '$21.377', label: 'Gastos' },
  { accent: 'var(--color-chart-4)', value: '$12.300', label: 'Ahorros' },
];

const BARS = [20, 35, 28, 42, 38, 55, 45, 62, 48, 70, 58, 80, 65, 120, 95];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="bg-primary/20 absolute inset-0 -z-10 scale-95 rounded-3xl blur-3xl" />

      <Card className="gap-0 overflow-hidden py-0 shadow-2xl">
        <div className="bg-muted/50 flex items-center gap-2 border-b px-4 py-3">
          <div className="flex gap-1.5">
            <div className="bg-muted-foreground/40 size-3 rounded-full" />
            <div className="bg-muted-foreground/40 size-3 rounded-full" />
            <div className="bg-muted-foreground/40 size-3 rounded-full" />
          </div>
          <div className="bg-muted mx-4 h-5 flex-1 rounded-md" />
        </div>

        <div className="space-y-4 p-5">
          <div>
            <div className="bg-muted mb-2 h-3 w-24 rounded-sm" />
            <div className="bg-muted-foreground/30 h-6 w-48 rounded-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map(({ accent, value, label }) => (
              <div key={label} className="bg-muted/40 relative overflow-hidden rounded-xl border p-3">
                <div
                  className="absolute top-0 right-3 left-3 h-[2px] rounded-full opacity-70"
                  style={{ backgroundColor: accent }}
                />
                <div className="text-muted-foreground mt-1 text-[10px] tracking-wide uppercase">
                  {label}
                </div>
                <div className="mt-1 text-sm font-bold tabular-nums">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-muted/40 rounded-xl border p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="bg-chart-balance h-4 w-1 rounded-full" />
              <div className="bg-muted-foreground/30 h-3 w-36 rounded-sm" />
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {BARS.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                  <div className="bg-danger/50 w-full rounded-sm" style={{ height: `${h * 0.25}px` }} />
                  <div className="bg-success/60 w-full rounded-sm" style={{ height: `${h * 0.5}px` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
