import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Obtenemos los últimos 10 movimientos, incluyendo la categoría asociada
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        category: {
          select: { name: true, color: true, icon: true }
        }
      }
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Error interno del servidor al obtener movimientos.' });
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

    const transaction = await prisma.transaction.create({
      data: {
        title,
        description,
        amount,
        date: new Date(date),
        type,
        paymentMethod,
        categoryId,
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