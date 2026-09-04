import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const INCLUDED = [
  'Cuentas, tarjetas y efectivo ilimitados',
  'Movimientos, transferencias y categorías',
  'Préstamos y compras en cuotas',
  'Gastos fijos con pago automático',
  'Metas de ahorro con seguimiento',
  'Dashboard con evolución patrimonial',
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Precio
          </Badge>
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Una sola versión, y es gratis
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            FinTrack es un proyecto de uso personal. No hay planes pagos ni funciones bloqueadas.
          </p>
        </div>

        <Card className="from-primary/5 to-card dark:bg-card mx-auto max-w-md bg-gradient-to-t">
          <CardHeader>
            <CardTitle className="text-2xl">Gratis</CardTitle>
            <CardDescription>Todas las funciones, sin límites.</CardDescription>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight">$0</span>
              <span className="text-muted-foreground text-sm">/ para siempre</span>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3">
              {INCLUDED.map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="text-success mt-0.5 size-4 shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            <Button size="lg" className="w-full" asChild>
              <Link to="/register">
                Crear cuenta <ArrowRight />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
