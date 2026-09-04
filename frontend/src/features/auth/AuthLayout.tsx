import * as React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Shield, TrendingUp } from 'lucide-react';

import { DotPattern } from '@/components/dot-pattern';
import { ModeToggle } from '@/components/mode-toggle';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Dashboard en tiempo real',
    desc: 'Visualizá tu patrimonio, ingresos y gastos de un vistazo.',
  },
  {
    icon: Layers,
    title: 'Gestión multi-cuenta',
    desc: 'Bancos, efectivo, tarjetas y préstamos en un solo lugar.',
  },
  {
    icon: Shield,
    title: 'Tus datos, sólo tuyos',
    desc: 'Cada usuario tiene su espacio financiero completamente aislado.',
  },
];

/** Panel de marca a la izquierda y formulario a la derecha. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen">
      <aside className="bg-muted/30 relative hidden flex-col justify-between overflow-hidden border-r p-12 lg:flex lg:w-[52%]">
        <DotPattern fadeStyle="circle" />

        <div className="pointer-events-none absolute inset-0">
          <div className="bg-primary/10 absolute -top-[10%] -left-[10%] size-[600px] rounded-full blur-[120px]" />
          <div className="bg-success/10 absolute -right-[5%] -bottom-[5%] size-[400px] rounded-full blur-[100px]" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-white p-[3px]">
            <img src="/logo.png" alt="FinTrack" className="size-full rounded-lg object-contain" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FinTrack</span>
        </Link>

        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl leading-tight font-bold tracking-tight">
              Tomá el control
              <br />
              <span className="from-chart-balance to-primary bg-gradient-to-r bg-clip-text text-transparent">
                de tus finanzas
              </span>
            </h1>
            <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
              Registrá tus movimientos, seguí tus préstamos y visualizá tu patrimonio en tiempo
              real.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="bg-primary/10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                  <Icon className="text-primary size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground relative z-10 text-xs">
          © {new Date().getFullYear()} FinTrack · Gestión financiera personal
        </p>
      </aside>

      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="absolute top-6 right-6">
          <ModeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}

/** Logo que sólo se ve cuando el panel de marca está oculto. */
export function AuthMobileLogo() {
  return (
    <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
      <div className="size-8 rounded-lg bg-white p-[3px]">
        <img src="/logo.png" alt="FinTrack" className="size-full rounded-md object-contain" />
      </div>
      <span className="font-semibold">FinTrack</span>
    </Link>
  );
}
