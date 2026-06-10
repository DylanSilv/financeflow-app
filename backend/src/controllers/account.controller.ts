import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

const VALID_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'BENEFIT'] as const;
type AccType = typeof VALID_TYPES[number];

export const getAccounts = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const accounts = await prisma.account.findMany({
    where:   { userId, isArchived: false },
    select:  {
      id: true, name: true, type: true, color: true, initialBalance: true,
      transactions: { select: { amount: true, type: true } },
      transfersFrom: { select: { amount: true } },
      transfersTo:   { select: { amount: true } },
    },
    orderBy: { name: 'asc' },
  });

  return res.json(
    accounts.map(a => {
      const txBalance   = a.transactions.reduce((s, t) => s + (t.type === 'INCOME' ? N(t.amount) : -N(t.amount)), 0);
      const transferOut = a.transfersFrom.reduce((s, t) => s + N(t.amount), 0);
      const transferIn  = a.transfersTo.reduce((s, t)   => s + N(t.amount), 0);
      return {
        id:             a.id,
        name:           a.name,
        type:           a.type,
        color:          a.color,
        initialBalance: N(a.initialBalance),
        balance:        N(a.initialBalance) + txBalance + transferIn - transferOut,
      };
    }),
  );
};

export const createAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, type, color, initialBalance } = req.body as {
    name: string; type: AccType; color?: string; initialBalance?: number;
  };

  if (!name?.trim())               return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Tipo de cuenta inválido.' });

  try {
    const account = await prisma.account.create({
      data: { name: name.trim(), type, color: color ?? null, initialBalance: initialBalance ?? 0, userId },
    });
    return res.status(201).json({
      id: account.id, name: account.name, type: account.type,
      color: account.color, initialBalance: N(account.initialBalance), balance: N(account.initialBalance),
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese nombre.' });
    }
    throw e;
  }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };
  const { name, type, color, initialBalance } = req.body as {
    name?: string; type?: AccType; color?: string; initialBalance?: number;
  };

  const existing = await prisma.account.findFirst({ where: { id, userId, isArchived: false } });
  if (!existing) return res.status(404).json({ error: 'Cuenta no encontrada.' });

  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Tipo de cuenta inválido.' });
  }

  const data: Prisma.AccountUpdateInput = {};
  if (name           !== undefined) data.name           = name.trim();
  if (type           !== undefined) data.type           = type;
  if (color          !== undefined) data.color          = color;
  if (initialBalance !== undefined) data.initialBalance = initialBalance;

  try {
    const updated = await prisma.account.update({ where: { id }, data });
    return res.json({
      id: updated.id, name: updated.name, type: updated.type,
      color: updated.color, initialBalance: N(updated.initialBalance),
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese nombre.' });
    }
    throw e;
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const existing = await prisma.account.findFirst({ where: { id, userId, isArchived: false } });
  if (!existing) return res.status(404).json({ error: 'Cuenta no encontrada.' });

  await prisma.account.update({ where: { id }, data: { isArchived: true } });
  return res.status(204).send();
};
