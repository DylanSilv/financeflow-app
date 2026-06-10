import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCategories = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const categories = await prisma.category.findMany({
    where:   { userId },
    select:  { id: true, name: true, color: true, icon: true, _count: { select: { transactions: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(categories.map(c => ({ ...c, transactionCount: c._count.transactions, _count: undefined })));
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, color } = req.body as { name?: string; color?: string };

  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  try {
    const cat = await prisma.category.create({
      data: { name: name.trim(), color: color ?? '#71717a', userId },
    });
    return res.status(201).json({ ...cat, transactionCount: 0 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
    }
    throw e;
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };
  const { name, color } = req.body as { name?: string; color?: string };

  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Categoría no encontrada.' });

  const data: Prisma.CategoryUpdateInput = {};
  if (name  !== undefined) data.name  = name.trim();
  if (color !== undefined) data.color = color;

  try {
    const updated = await prisma.category.update({ where: { id }, data });
    return res.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
    }
    throw e;
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Categoría no encontrada.' });

  // onDelete: SetNull en Transaction — las tx quedan sin categoría, no se pierden
  await prisma.category.delete({ where: { id } });
  return res.status(204).send();
};
