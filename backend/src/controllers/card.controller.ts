import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getCards = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const cards = await prisma.card.findMany({
    where:   { userId },
    orderBy: { name: 'asc' },
    include: {
      account: {
        include: {
          transfersFrom: { where: { userId }, select: { amount: true } },
          transfersTo:   { where: { userId }, select: { amount: true } },
        },
      },
    },
  });

  // Saldos de cuentas vinculadas a tarjetas de débito — groupBy en lugar de cargar todas las transacciones
  const debitAccountIds = cards
    .filter(c => c.type === 'DEBIT' && c.accountId)
    .map(c => c.accountId!);

  const txSumsRows = debitAccountIds.length > 0
    ? await prisma.transaction.groupBy({
        by:    ['accountId', 'type'],
        where: { userId, accountId: { in: debitAccountIds } },
        _sum:  { amount: true },
      })
    : [];

  const txSumMap = new Map<string, { income: number; expenses: number }>();
  for (const r of txSumsRows) {
    const id = r.accountId!;
    if (!txSumMap.has(id)) txSumMap.set(id, { income: 0, expenses: 0 });
    const e = txSumMap.get(id)!;
    if (r.type === 'INCOME')  e.income   = N(r._sum.amount);
    if (r.type === 'EXPENSE') e.expenses = N(r._sum.amount);
  }

  return res.json(
    cards.map(c => {
      const balanceUsed = N(c.balanceUsed);
      let balance = balanceUsed;

      if (c.type === 'DEBIT' && c.account) {
        const sums        = txSumMap.get(c.accountId!) ?? { income: 0, expenses: 0 };
        const transferIn  = c.account.transfersTo.reduce(  (s, t) => s + N(t.amount), 0);
        const transferOut = c.account.transfersFrom.reduce((s, t) => s + N(t.amount), 0);
        balance = N(c.account.initialBalance) + sums.income - sums.expenses + transferIn - transferOut;
      }

      return {
        id:             c.id,
        name:           c.name,
        type:           c.type,
        brand:          c.brand ?? 'VISA',
        lastFourDigits: c.lastFourDigits ?? '0000',
        color:          c.color ?? 'from-zinc-900 to-zinc-700',
        limit:          N(c.limit),
        balance,
        balanceUsed,
        accountId:      c.accountId ?? null,
        statementDay:   c.statementDay ?? null,
        dueDay:         c.dueDay ?? null,
      };
    }),
  );
};

export const createCard = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, type, brand, lastFourDigits, color, limit, accountId, statementDay, dueDay } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const card = await prisma.card.create({
    data: {
      name,
      type,
      brand:          brand ?? null,
      lastFourDigits: lastFourDigits ?? null,
      color:          color ?? null,
      limit:          limit ? Number(limit) : null,
      balanceUsed:    0,
      userId,
      accountId:      accountId ?? null,
      statementDay:   statementDay ? parseInt(statementDay, 10) : null,
      dueDay:         dueDay       ? parseInt(dueDay, 10)       : null,
    },
  });

  return res.status(201).json({
    ...card,
    brand:          card.brand ?? 'VISA',
    lastFourDigits: card.lastFourDigits ?? '0000',
    color:          card.color ?? 'from-zinc-900 to-zinc-700',
    limit:          N(card.limit),
    balanceUsed:    N(card.balanceUsed),
    statementDay:   card.statementDay ?? null,
    dueDay:         card.dueDay       ?? null,
  });
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = req.params['id'] as string;

  const card = await prisma.card.findFirst({ where: { id, userId } });
  if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada.' });

  await prisma.card.delete({ where: { id } });

  return res.status(204).send();
};
