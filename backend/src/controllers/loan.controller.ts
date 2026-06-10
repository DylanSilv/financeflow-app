import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getLoans = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { status } = req.query as { status?: string };

  const where: Record<string, unknown> = { userId };
  if (status === 'ACTIVE') where['status'] = 'ACTIVE';
  if (status === 'PAID')   where['status'] = 'PAID';

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [loans, thisMonthTxs] = await Promise.all([
    prisma.loan.findMany({ where, orderBy: [{ status: 'asc' }, { loanType: 'asc' }, { name: 'asc' }] }),
    prisma.transaction.findMany({
      where: { userId, loanId: { not: null }, date: { gte: monthStart, lte: monthEnd } },
      select: { loanId: true },
    }),
  ]);

  const paidThisMonthIds = new Set(thisMonthTxs.map(t => t.loanId!));

  return res.json(loans.map(l => ({
    id:                l.id,
    name:              l.name,
    loanType:          l.loanType,
    status:            l.status,
    originalAmount:    N(l.originalAmount),
    installmentAmount: N(l.installmentAmount),
    totalInstallments: l.totalInstallments,
    paidInstallments:  l.paidInstallments,
    remainingAmount:   Math.max(N(l.originalAmount) - N(l.installmentAmount) * l.paidInstallments, 0),
    progress:          l.totalInstallments > 0
      ? Math.round((l.paidInstallments / l.totalInstallments) * 100) : 0,
    paidThisMonth: paidThisMonthIds.has(l.id),
    startDate: l.startDate,
    endDate:   l.endDate,
    notes:     l.notes,
  })));
};

export const payInstallment = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = req.params['id'] as string;
  const { accountId } = req.body;

  const loan = await prisma.loan.findFirst({ where: { id, userId } });
  if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return res.status(400).json({ error: 'Cuenta no válida.' });
  }

  if (loan.status === 'PAID') return res.status(400).json({ error: 'El préstamo ya está cancelado.' });
  if (loan.paidInstallments >= loan.totalInstallments) {
    return res.status(400).json({ error: 'Todas las cuotas ya fueron pagadas.' });
  }

  const newPaid = loan.paidInstallments + 1;
  const isComplete = newPaid >= loan.totalInstallments;

  // Actualizar el préstamo
  const updated = await prisma.loan.update({
    where: { id },
    data: {
      paidInstallments: newPaid,
      status:           isComplete ? 'PAID' : 'ACTIVE',
    },
  });

  // Crear transacción si se especifica una cuenta
  if (accountId) {
    const catName = loan.loanType === 'PERSONAL' ? 'Préstamos' : 'Cuentas Fijas';
    const cat = await prisma.category.upsert({
      where:  { name_userId: { name: catName, userId } },
      update: {},
      create: { name: catName, color: '#6366f1', userId },
    });

    await prisma.transaction.create({ data: {
      title:         `${loan.name} — cuota ${newPaid}/${loan.totalInstallments}`,
      amount:        N(loan.installmentAmount),
      date:          new Date(),
      type:          'EXPENSE',
      paymentMethod: 'BANK_TRANSFER',
      categoryId:    cat.id,
      accountId,
      loanId:        loan.id,
      userId,
    }});

    // Marcar gasto fijo vinculado como PAID si existe
    await prisma.fixedExpense.updateMany({
      where: { loanId: id, userId },
      data:  { status: 'PAID' },
    });
  }

  return res.json({
    ...updated,
    originalAmount:    N(updated.originalAmount),
    installmentAmount: N(updated.installmentAmount),
    remainingAmount:   Math.max(N(updated.originalAmount) - N(updated.installmentAmount) * newPaid, 0),
    progress:          updated.totalInstallments > 0
      ? Math.round((newPaid / updated.totalInstallments) * 100) : 0,
  });
};

export const updateLoan = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id     = req.params['id'] as string;

  const loan = await prisma.loan.findFirst({ where: { id, userId } });
  if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });

  const { name, notes } = req.body;
  const data: Record<string, unknown> = {};
  if (name?.trim())       data.name  = name.trim();
  if (notes !== undefined) data.notes = notes?.trim() || null;

  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin cambios que aplicar.' });

  const updated = await prisma.loan.update({ where: { id }, data });
  return res.json({
    ...updated,
    originalAmount:    N(updated.originalAmount),
    installmentAmount: N(updated.installmentAmount),
    remainingAmount:   Math.max(N(updated.originalAmount) - N(updated.installmentAmount) * updated.paidInstallments, 0),
    progress:          updated.totalInstallments > 0 ? Math.round((updated.paidInstallments / updated.totalInstallments) * 100) : 0,
    paidThisMonth:     false,
  });
};

export const createLoan = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, originalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, notes } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  const parsedOriginal    = Number(originalAmount);
  const parsedInstallment = Number(installmentAmount);
  const parsedTotal       = parseInt(totalInstallments, 10);
  const parsedPaid        = parseInt(paidInstallments ?? '0', 10);

  if (!isFinite(parsedOriginal)    || parsedOriginal    <= 0) return res.status(400).json({ error: 'El monto original debe ser mayor a $0.' });
  if (!isFinite(parsedInstallment) || parsedInstallment <= 0) return res.status(400).json({ error: 'El monto de cuota debe ser mayor a $0.' });
  if (isNaN(parsedTotal) || parsedTotal < 1)                  return res.status(400).json({ error: 'El total de cuotas debe ser al menos 1.' });
  if (parsedPaid < 0 || parsedPaid > parsedTotal)             return res.status(400).json({ error: 'Las cuotas pagadas no pueden superar el total.' });

  const parsedStart = startDate ? new Date(startDate) : null;
  if (startDate && parsedStart && isNaN(parsedStart.getTime())) {
    return res.status(400).json({ error: 'Fecha de inicio inválida.' });
  }

  const loan = await prisma.loan.create({
    data: {
      name:              name.trim(),
      loanType:          'PERSONAL',
      status:            parsedPaid >= parsedTotal ? 'PAID' : 'ACTIVE',
      originalAmount:    parsedOriginal,
      installmentAmount: parsedInstallment,
      totalInstallments: parsedTotal,
      paidInstallments:  parsedPaid,
      startDate:         parsedStart,
      notes:             notes?.trim() || null,
      userId,
    },
  });

  return res.status(201).json({
    id:                loan.id,
    name:              loan.name,
    loanType:          loan.loanType,
    status:            loan.status,
    originalAmount:    N(loan.originalAmount),
    installmentAmount: N(loan.installmentAmount),
    totalInstallments: loan.totalInstallments,
    paidInstallments:  loan.paidInstallments,
    remainingAmount:   Math.max(N(loan.originalAmount) - N(loan.installmentAmount) * loan.paidInstallments, 0),
    progress:          loan.totalInstallments > 0 ? Math.round((loan.paidInstallments / loan.totalInstallments) * 100) : 0,
    paidThisMonth:     false,
    startDate:         loan.startDate,
    endDate:           loan.endDate,
    notes:             loan.notes,
  });
};

export const deleteLoan = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id     = req.params['id'] as string;

  const loan = await prisma.loan.findFirst({ where: { id, userId } });
  if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });

  await prisma.loan.delete({ where: { id } });
  return res.status(204).send();
};
