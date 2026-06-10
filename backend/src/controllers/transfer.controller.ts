import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getTransfers = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const transfers = await prisma.transfer.findMany({
    where:   { userId },
    orderBy: { date: 'desc' },
    take:    100,
    include: {
      fromAccount: { select: { name: true } },
      toAccount:   { select: { name: true } },
    },
  });

  return res.json(transfers.map(t => ({
    id:            t.id,
    amount:        N(t.amount),
    date:          t.date,
    description:   t.description,
    fromAccountId: t.fromAccountId,
    toAccountId:   t.toAccountId,
    fromName:      t.fromAccount.name,
    toName:        t.toAccount.name,
  })));
};

export const createTransfer = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { fromAccountId, toAccountId, amount, date, description } = req.body;

  if (!fromAccountId || !toAccountId) return res.status(400).json({ error: 'Ambas cuentas son obligatorias.' });
  if (fromAccountId === toAccountId)  return res.status(400).json({ error: 'Las cuentas deben ser diferentes.' });

  const parsedAmount = Number(amount);
  if (!isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a $0.' });

  const parsedDate = date ? new Date(date) : new Date();
  if (isNaN(parsedDate.getTime())) return res.status(400).json({ error: 'Fecha inválida.' });

  const [fromAcc, toAcc] = await Promise.all([
    prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
    prisma.account.findFirst({ where: { id: toAccountId,   userId } }),
  ]);
  if (!fromAcc) return res.status(400).json({ error: 'Cuenta origen no válida.' });
  if (!toAcc)   return res.status(400).json({ error: 'Cuenta destino no válida.' });

  const transfer = await prisma.transfer.create({
    data: {
      amount:        parsedAmount,
      date:          parsedDate,
      description:   description?.trim() || null,
      fromAccountId,
      toAccountId,
      userId,
    },
  });

  return res.status(201).json({
    id:            transfer.id,
    amount:        N(transfer.amount),
    date:          transfer.date,
    description:   transfer.description,
    fromAccountId: transfer.fromAccountId,
    toAccountId:   transfer.toAccountId,
    fromName:      fromAcc.name,
    toName:        toAcc.name,
  });
};

export const deleteTransfer = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id     = req.params['id'] as string;

  const transfer = await prisma.transfer.findFirst({ where: { id, userId } });
  if (!transfer) return res.status(404).json({ error: 'Transferencia no encontrada.' });

  await prisma.transfer.delete({ where: { id } });
  return res.status(204).send();
};
