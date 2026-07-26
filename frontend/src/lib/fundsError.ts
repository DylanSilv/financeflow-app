/**
 * La base rechaza con 'SALDO_INSUFICIENTE' cualquier movimiento que deje una
 * cuenta o tarjeta en negativo. Lo hacen los triggers trg_transaction_funds y
 * trg_transfer_funds, así que llega igual desde un RPC o desde un insert o
 * update directo a la tabla.
 *
 * El DETAIL viene como json con `disponible` y `solicitado`.
 */

const CODE = 'SALDO_INSUFICIENTE';

export function isInsufficientFunds(err: unknown): boolean {
  const e = err as { message?: string; details?: string } | null;
  return !!e && (e.message?.includes(CODE) === true || e.details?.includes(CODE) === true);
}

/** Monto disponible que reportó la base, o null si no vino en el detalle. */
export function availableFromError(err: unknown): number | null {
  const detail = (err as { details?: string } | null)?.details;
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail) as { disponible?: number };
    return typeof parsed.disponible === 'number' ? parsed.disponible : null;
  } catch {
    return null;
  }
}

/** Mensaje listo para mostrar, o null si el error es otra cosa. */
export function insufficientFundsMessage(err: unknown, fallback: string): string {
  if (!isInsufficientFunds(err)) return fallback;
  const disponible = availableFromError(err);
  return disponible == null
    ? 'Saldo insuficiente para este movimiento.'
    : `Saldo insuficiente. Disponible: $${disponible.toLocaleString('es-UY', {
        minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
}
