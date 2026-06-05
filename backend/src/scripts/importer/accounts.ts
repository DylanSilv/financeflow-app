export interface AccountDef {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT';
  color: string;
}

export const ACCOUNTS: AccountDef[] = [
  { name: 'BROU',              type: 'CHECKING', color: '#3b82f6' },
  { name: 'Itaú',              type: 'CHECKING', color: '#f59e0b' },
  { name: 'Santander',         type: 'CHECKING', color: '#ef4444' },
  { name: 'Efectivo',          type: 'CASH',     color: '#10b981' },
  { name: 'Beneficio Antel',   type: 'BENEFIT',  color: '#8b5cf6' },
  { name: 'Itaú Alimentación', type: 'BENEFIT',  color: '#06b6d4' },
];

// Sección Excel → nombre de Account
export const SECTION_TO_ACCOUNT: Record<string, string> = {
  'COMPRAS ITAU':                'Itaú',
  'COMPRAS SANTANDER':           'Santander',
  'COMPRAS BROU':                'BROU',
  'COMPRAS ITAU ALIMENTACION':   'Itaú Alimentación',
  'Compras con tarjeta':         'Itaú',
  'Compras con beneficio antel': 'Beneficio Antel',
  'Compras con efectivo':        'Efectivo',
  'Compras con aguinaldo':       'Itaú',
  'Compras':                     'Itaú',
  'Efectivo':                    'Efectivo',
};

// Account → PaymentMethod
export const ACCOUNT_TO_METHOD: Record<string, string> = {
  'BROU':              'DEBIT_CARD',
  'Itaú':              'DEBIT_CARD',
  'Santander':         'DEBIT_CARD',
  'Itaú Alimentación': 'DEBIT_CARD',
  'Beneficio Antel':   'DEBIT_CARD',
  'Efectivo':          'CASH',
};

// Etiqueta de ingreso → Account
export const INCOME_TO_ACCOUNT: Record<string, string> = {
  'Cobro':              'BROU',
  'cobro':              'BROU',
  'LIQUIDACION':        'BROU',
  'Retroactivo Sdo':    'BROU',
  'Aguinaldo':          'BROU',
  'Beneficio':          'Beneficio Antel',
  'Beneficio ':         'Beneficio Antel',
  'beneficio':          'Beneficio Antel',
  'Beneficio Antel':    'Beneficio Antel',
  'Beneficio antel':    'Beneficio Antel',
  'ingreso beneficio':  'Beneficio Antel',
  'Itau':               'Itaú',
  'Itaú':               'Itaú',
  'Santander':          'Santander',
  'Itau Alimentacion':  'Itaú Alimentación',
  'Retroactivo alim':   'Itaú Alimentación',
  'Brou':               'BROU',
};

// Etiquetas que NO son ingresos (fechas, totales, saldos anteriores)
export const INCOME_SKIP = new Set([
  'Total', 'total',
  'Billetera', 'billetera',
  'Disponible', 'disponible',
]);

export function shouldSkipIncome(label: string): boolean {
  const l = label.trim();
  if (!l) return true;
  if (INCOME_SKIP.has(l)) return true;
  if (l.startsWith('Fecha') || l.startsWith('fecha')) return true;
  if (l.startsWith('Mes ') || l.startsWith('mes ')) return true;  // "Mes anterior", "Mes actual"
  return false;
}
