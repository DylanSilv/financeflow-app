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

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }

  const target  = targetAmount  ? Number(targetAmount)  : 0;
  const current = currentAmount ? Number(currentAmount) : 0;

  const goal = await prisma.savingsGoal.create({
    data: {
      name,
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
  const userId = req.userId!;
  const id = req.params['id'] as string;
  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Monto inválido.' });
  }

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!goal) return res.status(404).json({ error: 'Meta no encontrada.' });

  const newAmount = Math.min(N(goal.currentAmount) + Number(amount), N(goal.targetAmount));

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data:  { currentAmount: newAmount },
  });

  const target  = N(updated.targetAmount);
  const current = N(updated.currentAmount);
  return res.json({
    ...updated,
    targetAmount:  target,
    currentAmount: current,
    progress:      target > 0 ? Math.round((current / target) * 100) : null,
  });
};
