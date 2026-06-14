import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as fs from 'fs';
import * as path from 'path';

// Safe Decimal → number (handles null, Decimal objects, strings)
const N = (v: unknown): number => (v == null ? 0 : Number(v));

// ── 1. Balance Total ─────────────────────────────────────────

export const getBalanceTotal = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const now = new Date();
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd   = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59);

  // Cargamos cuentas con transfers para calcular saldo real por cuenta
  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    include: {
      transfersFrom: { where: { userId }, select: { amount: true } },
      transfersTo:   { where: { userId }, select: { amount: true } },
    },
  });

  const accountIds        = accounts.map(a => a.id);
  const benefitAccountIds = accounts.filter(a => a.type === 'BENEFIT').map(a => a.id);
  const nonBenefitIds     = accountIds.filter(id => !benefitAccountIds.includes(id));

  // Saldos históricos por cuenta (solo transacciones con accountId)
  const txSumsAll = accountIds.length > 0 ? await prisma.transaction.groupBy({
    by:    ['accountId', 'type'],
    where: { userId, accountId: { in: accountIds } },
    _sum:  { amount: true },
  }) : [];

  // Ingresos del mes: excluir cuentas BENEFIT (IVA, beneficios)
  // Gastos del mes: solo los que salen de una cuenta (excluir gastos de tarjeta de crédito)
  const [monthIncomeTxs, monthExpenseTxs] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId, type: 'INCOME', date: { gte: monthStart, lte: monthEnd },
        ...(nonBenefitIds.length > 0 ? { accountId: { in: nonBenefitIds } } : { accountId: { not: null } }),
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd }, accountId: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  // Construir mapa accountId → { income, expenses }
  const txMap = new Map<string, { income: number; expenses: number }>();
  for (const r of txSumsAll) {
    const id = r.accountId!;
    if (!txMap.has(id)) txMap.set(id, { income: 0, expenses: 0 });
    const e = txMap.get(id)!;
    if (r.type === 'INCOME')  e.income   = N(r._sum.amount);
    if (r.type === 'EXPENSE') e.expenses = N(r._sum.amount);
  }

  // Sumar saldo real de cada cuenta
  let totalBalance = 0;
  for (const acc of accounts) {
    const sums       = txMap.get(acc.id) ?? { income: 0, expenses: 0 };
    const transferIn  = acc.transfersTo.reduce(  (s, t) => s + N(t.amount), 0);
    const transferOut = acc.transfersFrom.reduce((s, t) => s + N(t.amount), 0);
    totalBalance += N(acc.initialBalance) + sums.income - sums.expenses + transferIn - transferOut;
  }

  const mIncome   = N(monthIncomeTxs._sum.amount);
  const mExpenses = N(monthExpenseTxs._sum.amount);

  return res.json({
    balance:       totalBalance,
    totalIncome:   0,
    totalExpenses: 0,
    monthIncome:   mIncome,
    monthExpenses: mExpenses,
    monthBalance:  mIncome - mExpenses,
  });
};

// ── 2. Balance por cuenta ────────────────────────────────────

export const getBalancePorCuenta = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const now        = new Date();
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd   = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59);

  // 3 queries en paralelo en vez de N queries por cuenta
  const [accounts, txSumsAll, txSumsMonth] = await Promise.all([
    prisma.account.findMany({
      where:   { userId, isArchived: false },
      include: {
        transfersFrom: { where: { userId }, select: { amount: true } },
        transfersTo:   { where: { userId }, select: { amount: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.groupBy({
      by:    ['accountId', 'type'],
      where: { userId, accountId: { not: null } },
      _sum:  { amount: true },
    }),
    prisma.transaction.groupBy({
      by:    ['accountId', 'type'],
      where: { userId, accountId: { not: null }, date: { gte: monthStart, lte: monthEnd } },
      _sum:  { amount: true },
    }),
  ]);

  // Mapas accountId → { INCOME, EXPENSE }
  type TypeMap = Map<string, number>;
  const buildMap = (rows: typeof txSumsAll) => {
    const m = new Map<string, TypeMap>();
    for (const r of rows) {
      const id = r.accountId!;
      if (!m.has(id)) m.set(id, new Map());
      m.get(id)!.set(r.type, N(r._sum.amount));
    }
    return m;
  };

  const allMap   = buildMap(txSumsAll);
  const monthMap = buildMap(txSumsMonth);

  const result = accounts.map(acc => {
    const all   = allMap.get(acc.id);
    const month = monthMap.get(acc.id);

    const income       = all?.get('INCOME')  ?? 0;
    const expenses     = all?.get('EXPENSE') ?? 0;
    const transfersIn  = acc.transfersTo.reduce(  (s, t) => s + N(t.amount), 0);
    const transfersOut = acc.transfersFrom.reduce((s, t) => s + N(t.amount), 0);
    const balance      = N(acc.initialBalance) + income - expenses + transfersIn - transfersOut;

    let receivedThisMonth: boolean | null = null;
    let monthlyAmount: number | null = null;
    if (acc.type === 'BENEFIT') {
      const thisMonthIncome = month?.get('INCOME') ?? 0;
      receivedThisMonth = thisMonthIncome > 0;
      monthlyAmount     = thisMonthIncome > 0 ? thisMonthIncome : null;
    }

    return {
      id: acc.id, name: acc.name, type: acc.type, color: acc.color,
      balance, income, expenses,
      receivedThisMonth,
      monthlyAmount,
    };
  });

  return res.json(result);
};

// ── 3. Gastos por categoría ──────────────────────────────────

export const getGastosPorCategoria = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { year, month } = req.query;

  const dateFilter: { date?: { gte: Date; lte: Date } } = {};
  if (year && month) {
    dateFilter.date = {
      gte: new Date(Number(year), Number(month) - 1, 1),
      lte: new Date(Number(year), Number(month),      0, 23, 59, 59),
    };
  } else if (year) {
    dateFilter.date = {
      gte: new Date(Number(year), 0,  1),
      lte: new Date(Number(year), 11, 31, 23, 59, 59),
    };
  }

  const txs = await prisma.transaction.findMany({
    where:   { userId, type: 'EXPENSE', ...dateFilter },
    include: { category: { select: { name: true, color: true } } },
  });

  // Group by category name (null → "Sin categoría")
  const map = new Map<string, { name: string; color: string; total: number }>();
  let grandTotal = 0;

  for (const tx of txs) {
    const name  = tx.category?.name  ?? 'Sin categoría';
    const color = tx.category?.color ?? '#71717a';
    const amt   = N(tx.amount);
    grandTotal += amt;
    const cur = map.get(name);
    cur ? (cur.total += amt) : map.set(name, { name, color, total: amt });
  }

  const categories = [...map.values()]
    .sort((a, b) => b.total - a.total)
    .map(c => ({ ...c, percentage: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0 }));

  // Also group by account (always populated) for a richer breakdown
  const accMap = new Map<string, { name: string; color: string | null; total: number }>();
  for (const tx of txs) {
    if (!tx.accountId) continue;
    const key   = tx.accountId;
    const label = (tx as any).account?.name ?? tx.accountId;
    const amt   = N(tx.amount);
    const cur = accMap.get(key);
    cur ? (cur.total += amt) : accMap.set(key, { name: label, color: null, total: amt });
  }

  return res.json({ categories, total: grandTotal });
};

// ── 4. Ingresos por mes ──────────────────────────────────────

export const getIngresosPorMes = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const txs = await prisma.transaction.findMany({
    where:   { userId, type: 'INCOME' },
    select:  { amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  const map = new Map<string, { year: number; month: number; label: string; total: number }>();

  for (const tx of txs) {
    const d     = new Date(tx.date);
    const year  = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key   = `${year}-${String(month).padStart(2, '0')}`;
    const label = d.toLocaleString('es-UY', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    const cur   = map.get(key);
    cur ? (cur.total += N(tx.amount)) : map.set(key, { year, month, label, total: N(tx.amount) });
  }

  return res.json([...map.values()]);
};

// ── 5. Evolución patrimonial mensual ─────────────────────────

export const getEvolucionPatrimonial = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  // ── Historial desde JSON (no afecta balances de cuenta) ──────
  const historyPath = path.join(__dirname, '../../data/monthly-history.json');
  type HistEntry = { year: number; month: number; income: number; expenses: number; label: string };
  let history: HistEntry[] = [];
  try {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch { /* sin archivo histórico */ }

  // ── Transacciones reales de la DB (solo las vinculadas a cuentas) ──
  const txs = await prisma.transaction.findMany({
    where:   { userId, accountId: { not: null } },
    select:  { amount: true, date: true, type: true },
    orderBy: { date: 'asc' },
  });

  type MonthEntry = { year: number; month: number; label: string; income: number; expenses: number };
  const map = new Map<string, MonthEntry>();

  // Cargar historial primero
  for (const h of history) {
    const key   = `${h.year}-${String(h.month).padStart(2, '0')}`;
    const label = h.label;
    map.set(key, { year: h.year, month: h.month, label, income: h.income, expenses: h.expenses });
  }

  // Solo agregar meses de DB que NO estén cubiertos por el historial JSON
  const historicalKeys = new Set(history.map(h => `${h.year}-${String(h.month).padStart(2, '0')}`));

  for (const tx of txs) {
    const d     = new Date(tx.date);
    const year  = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key   = `${year}-${String(month).padStart(2, '00')}`;

    // Saltar meses cubiertos por el historial JSON (están completos)
    if (historicalKeys.has(key)) continue;

    const monthName = d.toLocaleString('es-UY', { month: 'short', timeZone: 'UTC' }).replace('.', '');
    const label = `${monthName} ${year}`;
    if (!map.has(key)) map.set(key, { year, month, label, income: 0, expenses: 0 });

    const entry = map.get(key)!;
    tx.type === 'INCOME' ? (entry.income += N(tx.amount)) : (entry.expenses += N(tx.amount));
  }

  // Balance acumulado desde 0 (el historial ya es relativo)
  let runningBalance = 0;
  const result = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => {
      runningBalance += entry.income - entry.expenses;
      return { ...entry, balance: Math.round(runningBalance * 100) / 100 };
    });

  return res.json(result);
};

// ── 6. Préstamos activos ─────────────────────────────────────

export const getPrestamosActivos = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const loans = await prisma.loan.findMany({
    where:   { userId, status: 'ACTIVE' },
    orderBy: [{ loanType: 'asc' }, { name: 'asc' }],
  });

  const result = loans.map(l => ({
    id:                l.id,
    name:              l.name,
    loanType:          l.loanType,
    originalAmount:    N(l.originalAmount),
    installmentAmount: N(l.installmentAmount),
    totalInstallments: l.totalInstallments,
    paidInstallments:  l.paidInstallments,
    remainingAmount:   Math.max(N(l.originalAmount) - N(l.installmentAmount) * l.paidInstallments, 0),
    progress:          l.totalInstallments > 0
      ? Math.round((l.paidInstallments / l.totalInstallments) * 100) : 0,
    endDate:           l.endDate,
    notes:             l.notes,
  }));

  return res.json(result);
};

// ── 7. Objetivos de ahorro ───────────────────────────────────

export const getObjetivosAhorro = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const goals = await prisma.savingsGoal.findMany({
    where:   { userId },
    orderBy: { name: 'asc' },
  });

  const result = goals.map(g => ({
    id:            g.id,
    name:          g.name,
    targetAmount:  N(g.targetAmount),
    currentAmount: N(g.currentAmount),
    deadline:      g.deadline,
    color:         g.color,
    progress:      N(g.targetAmount) > 0
      ? Math.round((N(g.currentAmount) / N(g.targetAmount)) * 100) : 0,
  }));

  return res.json(result);
};
