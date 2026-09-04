import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  {
    step: 1,
    label: 'Agregá tus tarjetas',
    desc: 'Vinculá tus tarjetas de débito y crédito para ver tus saldos.',
    href: '/cards',
  },
  {
    step: 2,
    label: 'Registrá un movimiento',
    desc: 'Anotá ingresos y gastos para llevar el control de tu dinero.',
    href: '/transactions',
  },
  {
    step: 3,
    label: 'Configurá gastos fijos',
    desc: 'Cargá tus pagos recurrentes (alquiler, servicios, suscripciones).',
    href: '/fixed-expenses',
  },
];

export function Onboarding() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pt-8">
      <div className="text-center">
        <div className="mx-auto mb-4 size-16 rounded-2xl bg-white p-2">
          <img src="/logo.png" alt="FinTrack" className="size-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold">¡Bienvenido a FinTrack!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Tu panel financiero personal. Para empezar, completá estos pasos.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map(({ step, label, desc, href }) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step * 0.1, duration: 0.3 }}
          >
            <Card className="hover:border-primary/40 group py-0 transition-colors">
              <Link to={href}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                  </div>
                  <ArrowRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                </CardContent>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
