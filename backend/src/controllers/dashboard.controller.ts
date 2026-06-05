import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// Safe Decimal → number (handles null, Decimal objects, strings)
const N = (v: unknown): number => (v == null ? 0 : Number(v));

// ── 1. Balance Total ─────────────────────────────────────────

export const getBalanceTotal = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const now = new Date();
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd   = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59);

  const [initBalSum, allIncome, allExpenses, monthIncome, monthExpenses] = await Promise.all([
    prisma.account.aggregate({
      where: { userId, isArchived: false },
      _sum: { initialBalance: true },
    }),
    prisma.transaction.aggregate({ where: { userId, type: 'INCOME'  }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME',  date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome   = N(allIncome._sum.amount);
  const totalExpenses = N(allExpenses._sum.amount);
  const initBalance   = N(initBalSum._sum.initialBalance);

  return res.json({
    balance:             initBalance + totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    monthIncome:   N(monthIncome._sum.amount),
    monthExpenses: N(monthExpenses._sum.amount),
    monthBalance:  N(monthIncome._sum.amount) - N(monthExpenses._sum.amount),
  });
};

// ── 2. Balance por cuenta ────────────────────────────────────

export const getBalancePorCuenta = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    include: {
      transactions: { select: { amount: true, type: true } },
      transfersFrom: { select: { amount: true } },
      transfersTo:   { select: { amount: true } },
    },
    orderBy: { name: 'asc' },
  });

  const result = accounts.map(acc => {
    const income       = acc.transactions.filter(t => t.type === 'INCOME' ).reduce((s, t) => s + N(t.amount), 0);
    const expenses     = acc.transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + N(t.amount), 0);
    const transfersIn  = acc.transfersTo.reduce(  (s, t) => s + N(t.amount), 0);
    const transfersOut = acc.transfersFrom.reduce((s, t) => s + N(t.amount), 0);
    const balance      = N(acc.initialBalance) + income - expenses + transfersIn - transfersOut;

    return {
      id: acc.id, name: acc.name, type: acc.type, color: acc.color,
      balance, income, expenses,
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

  const [txs, initBalSum] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId },
      select:  { amount: true, date: true, type: true },
      orderBy: { date: 'asc' },
    }),
    prisma.account.aggregate({
      where: { userId, isArchived: false },
      _sum:  { initialBalance: true },
    }),
  ]);

  type MonthEntry = { year: number; month: number; label: string; income: number; expenses: number };
  const map = new Map<string, MonthEntry>();

  for (const tx of txs) {
    const d     = new Date(tx.date);
    const year  = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key   = `${year}-${String(month).padStart(2, '0')}`;
    const label = d.toLocaleString('es-UY', { month: 'short', year: '2-digit', timeZone: 'UTC' });

    if (!map.has(key)) map.set(key, { year, month, label, income: 0, expenses: 0 });
    const entry = map.get(key)!;
    tx.type === 'INCOME' ? (entry.income += N(tx.amount)) : (entry.expenses += N(tx.amount));
  }

  let runningBalance = N(initBalSum._sum.initialBalance);

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
