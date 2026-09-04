const LOCALE = 'es-UY';

/** Monto sin decimales: $12.345 */
export const fmt = (n: number) =>
  n.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Monto con dos decimales: $12.345,67 */
export const fmtDec = (n: number) =>
  n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Monto con signo de peso, respetando el negativo: -$1.234 */
export const money = (n: number) => `${n < 0 ? '-' : ''}$${fmt(Math.abs(n))}`;

/** Abreviado para ejes de gráficos: $12k */
export const fmtCompact = (n: number) =>
  Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;

export const monthLabel = (year: number, month: number, style: 'long' | 'short' = 'long') =>
  new Date(year, month - 1, 1).toLocaleDateString(LOCALE, {
    month: style,
    year: style === 'long' ? 'numeric' : '2-digit',
  });
