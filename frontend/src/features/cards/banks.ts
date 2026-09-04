/**
 * El emisor se guarda en la DB como las clases de gradiente de Tailwind, así
 * que `gradient` es a la vez el estilo y la clave. Esos colores no aparecen
 * literalmente en el código: van declarados con @source inline en index.css.
 */
export const BANKS = [
  { id: 'itau', name: 'Itaú', short: 'Itaú', gradient: 'from-orange-600 to-orange-400' },
  { id: 'santander', name: 'Santander', short: 'Santander', gradient: 'from-red-700 to-rose-600' },
  { id: 'alimentacion', name: 'Alimentación', short: 'Alim.', gradient: 'from-yellow-500 to-amber-400' },
  { id: 'creditel', name: 'Creditel', short: 'Creditel', gradient: 'from-blue-700 to-cyan-500' },
  { id: 'scotiabank', name: 'Scotiabank', short: 'Scotia', gradient: 'from-red-900 to-red-700' },
  { id: 'prex', name: 'Prex', short: 'Prex', gradient: 'from-violet-700 to-violet-500' },
  { id: 'mercadopago', name: 'Mercado Pago', short: 'MP', gradient: 'from-sky-500 to-cyan-400' },
  { id: 'otro', name: 'Otro', short: 'Otro', gradient: 'from-zinc-700 to-zinc-500' },
] as const;

export type Bank = (typeof BANKS)[number];

/** "Otro" es el que se usa cuando el gradiente guardado no matchea ninguno. */
export const OTHER_BANK = BANKS[BANKS.length - 1];

export function bankByGradient(gradient: string): Bank {
  return BANKS.find(b => b.gradient === gradient) ?? OTHER_BANK;
}

/** Nombre del emisor para mostrar, con el nombre de la tarjeta como respaldo. */
export function bankLabel(gradient: string, fallback: string): string {
  const bank = BANKS.find(b => b.gradient === gradient);
  return bank && bank.id !== 'otro' ? bank.name : fallback;
}
