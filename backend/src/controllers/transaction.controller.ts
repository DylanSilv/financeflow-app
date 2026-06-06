import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const type   = req.query['type']   as string | undefined;
    const search = req.query['search'] as string | undefined;
    const take   = (req.query['take']  as string) ?? '50';
    const skip   = (req.query['skip']  as string) ?? '0';

    const where: Record<string, unknown> = { userId };
    if (type === 'INCOME' || type === 'EXPENSE') where.type = type;
    if (search) where.title = { contains: search };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take:    Math.min(parseInt(take, 10), 500),
      skip:    parseInt(skip, 10),
      include: { category: { select: { name: true, color: true, icon: true } } },
    });

    return res.status(200).json(
      transactions.map(t => ({ ...t, amount: Number(t.amount) })),
    );
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Error interno del servidor al obtener movimientos.' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = req.params['id'] as string;
    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) return res.status(404).json({ error: 'Movimiento no encontrado.' });

    await prisma.transaction.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({ error: 'Error al eliminar el movimiento.' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, amount, date, type, paymentMethod, categoryId, cardId } = req.body;

    // Validación básica
    if (!title || !amount || !date || !type || !paymentMethod) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    // Find or create category by name if no ID given
    let resolvedCategoryId = categoryId;
    const { categoryName, categoryColor } = req.body;
    if (!resolvedCategoryId && categoryName) {
      const cat = await prisma.category.upsert({
        where:  { name_userId: { name: categoryName, userId } },
        update: {},
        create: { name: categoryName, color: categoryColor ?? '#71717a', userId },
      });
      resolvedCategoryId = cat.id;
    }

    const transaction = await prisma.transaction.create({
      data: {
        title,
        description,
        amount,
        date: new Date(date),
        type,
        paymentMethod,
        categoryId: resolvedCategoryId,
        cardId,
        userId
      }
    });

    // Si es un gasto de tarjeta de crédito, actualizamos el saldo usado de la tarjeta
    if (paymentMethod === 'CREDIT_CARD' && cardId && type === 'EXPENSE') {
      await prisma.card.update({
        where: { id: cardId },
        data: {
          balanceUsed: { increment: amount }
        }
      });
    }

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Error al registrar el movimiento.' });
  }
};