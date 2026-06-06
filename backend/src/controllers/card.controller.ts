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
          transactions: { select: { amount: true, type: true } },
          transfersFrom: { select: { amount: true } },
          transfersTo:   { select: { amount: true } },
        },
      },
    },
  });

  return res.json(
    cards.map(c => {
      let balance = N(c.balanceUsed);

      if (c.account) {
        const income      = c.account.transactions.filter(t => t.type === 'INCOME' ).reduce((s, t) => s + N(t.amount), 0);
        const expenses    = c.account.transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + N(t.amount), 0);
        const transferIn  = c.account.transfersTo.reduce(  (s, t) => s + N(t.amount), 0);
        const transferOut = c.account.transfersFrom.reduce((s, t) => s + N(t.amount), 0);
        balance = N(c.account.initialBalance) + income - expenses + transferIn - transferOut;
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
        accountId:      c.accountId ?? null,
      };
    }),
  );
};

export const createCard = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, type, brand, lastFourDigits, color, limit, accountId } = req.body;

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
    },
  });

  return res.status(201).json({
    ...card,
    brand:          card.brand ?? 'VISA',
    lastFourDigits: card.lastFourDigits ?? '0000',
    color:          card.color ?? 'from-zinc-900 to-zinc-700',
    limit:          N(card.limit),
    balanceUsed:    N(card.balanceUsed),
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
