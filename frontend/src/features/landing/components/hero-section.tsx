import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DotPattern } from '@/components/dot-pattern';

import { DashboardPreview } from './dashboard-preview';

const CHECKS = [
  'Sin tarjeta de crédito requerida',
  'Configuración en menos de 5 minutos',
  'Acceso desde cualquier dispositivo',
];

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden px-6 pt-32 pb-24">
      <div className="absolute inset-0">
        <DotPattern fadeStyle="ellipse" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <Badge variant="outline" className="px-4 py-1.5">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              Gestión financiera personal
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Tomá el control de{' '}
            <span className="from-chart-balance to-primary bg-gradient-to-r bg-clip-text whitespace-nowrap text-transparent">
              tus finanzas
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg leading-relaxed"
          >
            Registrá tus ingresos y gastos, seguí tus préstamos, gestioná tus cuentas y visualizá
            tu patrimonio en tiempo real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild>
              <Link to="/register">
                Crear cuenta gratis <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Ya tengo cuenta</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            {CHECKS.map(check => (
              <span key={check} className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="text-success size-3.5" />
                {check}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
