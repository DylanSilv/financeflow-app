import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getSavingsGoals = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const goals = await prisma.savingsGoal.findMany({
    where:   { userId },
    orderBy: { name: 'asc' },
  });

  return res.json(
    goals.map(g => {
      const target  = N(g.targetAmount);
      const current = N(g.currentAmount);
      return {
        id:            g.id,
        name:          g.name,
        targetAmount:  target,
        currentAmount: current,
        deadline:      g.deadline,
        color:         g.color,
        progress:      target > 0 ? Math.round((current / target) * 100) : null,
      };
    }),
  );
};

export const createSavingsGoal = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, targetAmount, currentAmount, deadline, color } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }

  const target  = targetAmount  ? Number(targetAmount)  : 0;
  const current = currentAmount ? Number(currentAmount) : 0;

  if (target < 0 || current < 0) {
    return res.status(400).json({ error: 'Los montos no pueden ser negativos.' });
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      name: name.trim(),
      targetAmount:  target,
      currentAmount: current,
      deadline:      deadline ? new Date(deadline) : null,
      color:         color ?? null,
      userId,
    },
  });

  return res.status(201).json({
    ...goal,
    targetAmount:  N(goal.targetAmount),
    currentAmount: N(goal.currentAmount),
    progress:      target > 0 ? Math.round((current / target) * 100) : null,
  });
};

export const addFundsToGoal = async (req: AuthRequest, res: Response) => {
  const userId    = req.userId!;
  const id        = req.params['id'] as string;
  const { amount, accountId } = req.body;

  const parsedAmount = Number(amount);
  if (!isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
  }

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada.' });

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return res.status(400).json({ error: 'Cuenta no válida.' });
  }

  const targetVal  = N(goal.targetAmount);
  const currentVal = N(goal.currentAmount);

  // Para metas con objetivo: no superar el target. Sin objetivo: sin límite.
  const actualAmount = targetVal > 0
    ? Math.min(parsedAmount, targetVal - currentVal)
    : parsedAmount;

  if (actualAmount <= 0) {
    return res.status(400).json({ error: 'La meta ya está completa.' });
  }

  const newCurrentAmount = currentVal + actualAmount;

  // Transacción y actualización en paralelo
  const ops: Promise<unknown>[] = [
    prisma.savingsGoal.update({
      where: { id },
      data:  { currentAmount: newCurrentAmount },
    }),
  ];

  // Si se especificó cuenta: crear transacción de egreso
  if (accountId) {
    const catUpsert = prisma.category.upsert({
      where:  { name_userId: { name: 'Ahorros', userId } },
      update: {},
      create: { name: 'Ahorros', color: '#6366f1', userId },
    }).then(cat =>
      prisma.transaction.create({
        data: {
          title:         `Ahorro — ${goal.name}`,
          amount:        actualAmount,
          date:          new Date(),
          type:          'EXPENSE',
          paymentMethod: 'BANK_TRANSFER',
          categoryId:    cat.id,
          accountId,
          userId,
        },
      })
    );
    ops.push(catUpsert);
  }

  await Promise.all(ops);

  const updated = await prisma.savingsGoal.findUniqueOrThrow({ where: { id } });
  const target  = N(updated.targetAmount);
  const current = N(updated.currentAmount);

  return res.json({
    ...updated,
    targetAmount:  target,
    currentAmount: current,
    progress:      target > 0 ? Math.round((current / target) * 100) : null,
  });
};

export const updateSavingsGoal = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id     = req.params['id'] as string;

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada.' });

  const { name, targetAmount, deadline, color } = req.body;
  const data: Record<string, unknown> = {};

  if (name?.trim()) data.name = name.trim();
  if (targetAmount !== undefined) {
    const n = Number(targetAmount);
    if (!isFinite(n) || n < 0) return res.status(400).json({ error: 'El monto objetivo no puede ser negativo.' });
    data.targetAmount = n;
  }
  if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
  if (color)                  data.color    = color;

  const updated  = await prisma.savingsGoal.update({ where: { id }, data });
  const target   = N(updated.targetAmount);
  const current  = N(updated.currentAmount);

  return res.json({
    ...updated,
    targetAmount:  target,
    currentAmount: current,
    progress: target > 0 ? Math.round((current / target) * 100) : null,
  });
};

export const deleteSavingsGoal = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id     = req.params['id'] as string;

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada.' });

  await prisma.savingsGoal.delete({ where: { id } });
  return res.status(204).send();
};
