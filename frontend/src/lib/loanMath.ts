/**
 * Matemática de préstamos: amortización francesa.
 *
 * Convención del modelo, importante porque `originalAmount` significa cosas
 * distintas según el caso:
 *
 *   interestRate == null  →  compra en cuotas sin interés.
 *                            `originalAmount` es el TOTAL a pagar y vale
 *                            `installmentAmount * totalInstallments`.
 *
 *   interestRate != null  →  préstamo con interés.
 *                            `originalAmount` es el CAPITAL prestado, y el
 *                            interés está adentro de cada cuota.
 *
 * La tasa se guarda como NOMINAL ANUAL en porcentaje, que es lo que espera la
 * función `pay_loan_installment` de la base (hace interestRate/100/12).
 */

/** Cuotas que faltan pagar. */
export function remainingInstallments(total: number, paid: number): number {
  return Math.max(total - paid, 0);
}

/**
 * Lo que falta desembolsar: cuota × cuotas restantes.
 * Aplica siempre, haya interés o no, y es exacto.
 */
export function remainingPayments(installment: number, total: number, paid: number): number {
  return installment * remainingInstallments(total, paid);
}

/**
 * Saldo de capital tras `paid` cuotas: lo que costaría cancelar hoy.
 *
 *   B_k = P·(1+r)^k − PMT·((1+r)^k − 1)/r
 *
 * Devuelve null si el préstamo no tiene tasa, porque sin interés el concepto
 * "saldo de capital" no se distingue de lo que falta pagar.
 */
export function outstandingPrincipal(
  principal: number,
  installment: number,
  paid: number,
  annualNominalRatePct: number | null,
): number | null {
  if (annualNominalRatePct == null || annualNominalRatePct <= 0) return null;
  const r = annualNominalRatePct / 100 / 12;
  const factor = Math.pow(1 + r, paid);
  return Math.max(principal * factor - installment * (factor - 1) / r, 0);
}

/**
 * Tasa mensual implícita en un cronograma (capital, cuota, plazo), por bisección.
 *
 * Resuelve r en  P = PMT · (1 − (1+r)^−n) / r.
 *
 * Devuelve null cuando el cronograma no tiene interés — es decir, cuando lo que
 * se paga en total no supera al capital. Ese es el caso de las compras en
 * cuotas y no hay tasa que calcular.
 */
export function impliedMonthlyRate(
  principal: number,
  installment: number,
  n: number,
): number | null {
  if (!(principal > 0) || !(installment > 0) || !(n >= 1)) return null;

  const totalPaid = installment * n;
  // Sin interés (o cronograma imposible: se paga menos que el capital).
  if (totalPaid <= principal * (1 + 1e-9)) return null;

  // presentValue(r) decrece con r, así que f(r) = P − PV(r) crece de forma
  // monótona y la bisección es segura.
  const presentValue = (r: number) => installment * (1 - Math.pow(1 + r, -n)) / r;

  let lo = 1e-9;   // ~0 % mensual
  let hi = 1;      // 100 % mensual, techo generoso para plaza uruguaya
  if (presentValue(hi) > principal) return null;  // ni al 100 % mensual cierra

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (presentValue(mid) > principal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Tasa nominal anual en % a partir de la mensual en tanto por uno. */
export function toAnnualNominalPct(monthlyRate: number): number {
  return monthlyRate * 12 * 100;
}

/** Tasa efectiva anual en % a partir de la mensual en tanto por uno. */
export function toAnnualEffectivePct(monthlyRate: number): number {
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}

/**
 * Resumen de un cronograma, para mostrarlo mientras se carga un préstamo.
 * `null` en `annualNominalPct` significa que no hay interés.
 */
export function scheduleSummary(principal: number, installment: number, n: number) {
  const monthly = impliedMonthlyRate(principal, installment, n);
  const totalPaid = installment * n;
  return {
    totalPaid,
    totalInterest:     Math.max(totalPaid - principal, 0),
    monthlyRate:       monthly,
    annualNominalPct:  monthly == null ? null : toAnnualNominalPct(monthly),
    annualEffectivePct: monthly == null ? null : toAnnualEffectivePct(monthly),
  };
}
