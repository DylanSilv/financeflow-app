import { motion } from 'framer-motion';
import { CreditCard, Layers, RefreshCw, Shield, Target, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    icon: TrendingUp,
    color: 'var(--color-chart-balance)',
    title: 'Dashboard en tiempo real',
    desc: 'Visualizá tu balance total, ingresos, gastos y patrimonio actualizado al instante.',
  },
  {
    icon: Layers,
    color: 'var(--color-success)',
    title: 'Multi-cuenta y tarjetas',
    desc: 'Bancos, efectivo, tarjetas de débito y crédito, todo centralizado en un solo lugar.',
  },
  {
    icon: RefreshCw,
    color: 'var(--color-chart-4)',
    title: 'AutoPay de gastos fijos',
    desc: 'Configurá tus pagos recurrentes y dejá que la app los registre sola cada mes.',
  },
  {
    icon: CreditCard,
    color: 'var(--color-danger)',
    title: 'Seguimiento de préstamos',
    desc: 'Controlá cuotas, montos restantes y progreso de cada compromiso financiero.',
  },
  {
    icon: Target,
    color: 'var(--color-chart-5)',
    title: 'Metas de ahorro',
    desc: 'Definí objetivos con fechas y seguí tu progreso mes a mes.',
  },
  {
    icon: Shield,
    color: 'var(--color-chart-2)',
    title: 'Tus datos, sólo tuyos',
    desc: 'Cada usuario tiene su propio espacio financiero, completamente aislado y seguro.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-t px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Funciones
          </Badge>
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesitás en un lugar
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            Diseñado para ser simple y completo. Sin hojas de cálculo, sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Card className="hover:border-primary/30 h-full transition-colors">
                <CardContent>
                  <div
                    className="mb-4 flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}
                  >
                    <Icon className="size-5" style={{ color }} />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
