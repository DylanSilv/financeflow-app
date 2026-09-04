import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="border-t px-6 py-24">
      <div className="relative mx-auto max-w-2xl text-center">
        <div className="bg-primary/10 absolute inset-0 -z-10 rounded-3xl blur-3xl" />
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Empezá hoy, es gratis</h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Creá tu cuenta en segundos y empezá a tener claridad sobre tus finanzas personales.
        </p>
        <Button size="lg" asChild>
          <Link to="/register">
            Crear cuenta gratis <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
