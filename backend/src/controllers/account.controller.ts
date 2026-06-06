import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getAccounts = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const accounts = await prisma.account.findMany({
    where:   { userId, isArchived: false },
    select:  { id: true, name: true, type: true, color: true, initialBalance: true },
    orderBy: { name: 'asc' },
  });

  return res.json(
    accounts.map(a => ({
      id:    a.id,
      name:  a.name,
      type:  a.type,
      color: a.color,
    })),
  );
};
