import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const FAQ_ITEMS = [
  {
    value: 'datos',
    question: '¿Quién puede ver mis datos?',
    answer:
      'Sólo vos. Cada usuario tiene su propio espacio y las políticas de la base de datos impiden que una cuenta lea los movimientos de otra.',
  },
  {
    value: 'bancos',
    question: '¿Se conecta con mi banco?',
    answer:
      'No. Los movimientos se cargan a mano o se generan solos a partir de los gastos fijos y las cuotas que configures. Eso evita tener que darle acceso a tus cuentas bancarias a un tercero.',
  },
  {
    value: 'autopay',
    question: '¿Cómo funciona el AutoPay?',
    answer:
      'Marcás un gasto fijo como automático y elegís de qué cuenta se debita. Cuando abrís la app, los que vencieron desde la última vez se registran solos y te avisa cuáles procesó.',
  },
  {
    value: 'cuotas',
    question: '¿Puedo seguir compras en cuotas?',
    answer:
      'Sí. Al cargar un gasto con tarjeta de crédito podés indicar la cantidad de cuotas y se crea el compromiso con su cronograma. También podés cargar préstamos con interés: la tasa se calcula a partir del capital, la cuota y el plazo.',
  },
  {
    value: 'saldo',
    question: '¿Qué pasa si gasto más de lo que tengo?',
    answer:
      'La app te avisa antes de guardar y la base de datos vuelve a validar el saldo al registrar el movimiento, así que no podés dejar una cuenta en negativo por accidente.',
  },
  {
    value: 'moneda',
    question: '¿En qué moneda trabaja?',
    answer:
      'Hoy los montos se muestran en pesos uruguayos. La selección de moneda está en la lista de pendientes.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <Badge variant="outline" className="mb-4">
            Preguntas
          </Badge>
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            Lo que suele preguntarse antes de empezar a usarla.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map(item => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
