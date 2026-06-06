import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getLoans = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { status } = req.query as { status?: string };

  const where: Record<string, unknown> = { userId };
  if (status === 'ACTIVE')  where['status'] = 'ACTIVE';
  if (status === 'PAID')    where['status'] = 'PAID';

  const loans = await prisma.loan.findMany({
    where,
    orderBy: [{ status: 'asc' }, { loanType: 'asc' }, { name: 'asc' }],
  });

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
