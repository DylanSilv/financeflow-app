import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import logger from '../lib/logger';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const type      = req.query['type']      as string | undefined;
    const search    = req.query['search']    as string | undefined;
    const accountId = req.query['accountId'] as string | undefined;
    const dateFrom  = req.query['dateFrom']  as string | undefined;
    const dateTo    = req.query['dateTo']    as string | undefined;
    const take      = (req.query['take']     as string) ?? '50';
    const skip      = (req.query['skip']     as string) ?? '0';

    const where: Record<string, unknown> = { userId };
    if (type === 'INCOME' || type === 'EXPENSE') where.type = type;
    if (search)    where.title     = { contains: search };
    if (accountId) where.accountId = accountId;
    if (dateFrom || dateTo) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (dateFrom) { const d = new Date(dateFrom); if (!isNaN(d.getTime())) dateFilter.gte = d; }
      if (dateTo)   { const d = new Date(dateTo);   if (!isNaN(d.getTime())) dateFilter.lte = d; }
      where.date = dateFilter;
    }

    const takeNum = Math.min(Math.max(1, parseInt(take, 10) || 50), 500);
    const skipNum = Math.max(0, parseInt(skip, 10) || 0);

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take:    takeNum,
      skip:    skipNum,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });

    return res.status(200).json(
      transactions.map(t => ({ ...t, amount: Number(t.amount) })),
    );
  } catch (error) {
    logger.error({ err: error }, 'Error fetching transactions');
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
    logger.error({ err: error }, 'Error deleting transaction');
    return res.status(500).json({ error: 'Error al eliminar el movimiento.' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, amount, date, type, paymentMethod, categoryId, cardId, accountId,
            categoryName, categoryColor } = req.body;

    const VALID_TYPES    = ['INCOME', 'EXPENSE'];
    const VALID_METHODS  = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER'];

    if (!title?.trim() || !date || !type || !paymentMethod) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Tipo de transacción inválido.' });
    }
    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Método de pago inválido.' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida.' });
    }

    const parsedAmount = Number(amount);
    if (!isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0.' });
    }

    // Verify cardId and accountId belong to this user (IDOR prevention)
    if (cardId) {
      const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
      if (!card) return res.status(400).json({ error: 'Tarjeta no válida.' });
    }
    if (accountId) {
      const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
      if (!account) return res.status(400).json({ error: 'Cuenta no válida.' });
    }

    // Find or create category by name if no ID given
    let resolvedCategoryId = categoryId;
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
        amount:      parsedAmount,
        date:        parsedDate,
        type,
        paymentMethod,
        categoryId:  resolvedCategoryId,
        cardId:      cardId ?? null,
        accountId:   accountId ?? null,
        userId,
      }
    });

    // Si es un gasto de tarjeta de crédito, actualizamos el saldo usado de la tarjeta
    if (paymentMethod === 'CREDIT_CARD' && cardId && type === 'EXPENSE') {
      await prisma.card.update({
        where: { id: cardId },
        data:  { balanceUsed: { increment: parsedAmount } },
      });
    }

    return res.status(201).json(transaction);
  } catch (error) {
    logger.error({ err: error }, 'Error creating transaction');
    return res.status(500).json({ error: 'Error al registrar el movimiento.' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id     = req.params['id'] as string;

    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) return res.status(404).json({ error: 'Movimiento no encontrado.' });

    const { title, description, amount, date, type, paymentMethod,
            categoryId, accountId, cardId, categoryName, categoryColor } = req.body;

    const VALID_TYPES   = ['INCOME', 'EXPENSE'];
    const VALID_METHODS = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER'];

    if (type          && !VALID_TYPES.includes(type))          return res.status(400).json({ error: 'Tipo inválido.' });
    if (paymentMethod && !VALID_METHODS.includes(paymentMethod)) return res.status(400).json({ error: 'Método de pago inválido.' });

    let parsedAmount: number | undefined;
    if (amount !== undefined) {
      parsedAmount = Number(amount);
      if (!isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    }

    let parsedDate: Date | undefined;
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return res.status(400).json({ error: 'Fecha inválida.' });
    }

    if (cardId)    { const c = await prisma.card.findFirst({    where: { id: cardId,    userId } }); if (!c) return res.status(400).json({ error: 'Tarjeta no válida.' }); }
    if (accountId) { const a = await prisma.account.findFirst({ where: { id: accountId, userId } }); if (!a) return res.status(400).json({ error: 'Cuenta no válida.' }); }

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categoryName) {
      const cat = await prisma.category.upsert({
        where:  { name_userId: { name: categoryName, userId } },
        update: {},
        create: { name: categoryName, color: categoryColor ?? '#71717a', userId },
      });
      resolvedCategoryId = cat.id;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(title?.trim()              && { title: title.trim() }),
        ...(description !== undefined  && { description }),
        ...(parsedAmount !== undefined  && { amount: parsedAmount }),
        ...(parsedDate   !== undefined  && { date: parsedDate }),
        ...(type                        && { type }),
        ...(paymentMethod               && { paymentMethod }),
        ...(resolvedCategoryId !== undefined && { categoryId: resolvedCategoryId }),
        ...(accountId !== undefined     && { accountId }),
        ...(cardId    !== undefined     && { cardId }),
      },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });

    return res.json({ ...updated, amount: Number(updated.amount) });
  } catch (error) {
    logger.error({ err: error }, 'Error updating transaction');
    return res.status(500).json({ error: 'Error al actualizar el movimiento.' });
  }
};