import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

export const getFixedExpenses = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const expenses = await prisma.fixedExpense.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
    include: {
      loan: {
        select: {
          name:              true,
          status:            true,
          paidInstallments:  true,
          totalInstallments: true,
          installmentAmount: true,
        },
      },
    },
  });

  return res.json(
    expenses.map(e => ({
      id:                e.id,
      name:              e.name,
      amount:            N(e.amount),
      dueDate:           e.dueDate,
      autoPay:           e.autoPay,
      status:            e.status,
      loanId:            e.loanId ?? null,
      loanName:          e.loan?.name ?? null,
      paidInstallments:  e.loan?.paidInstallments  ?? null,
      totalInstallments: e.loan?.totalInstallments ?? null,
      installmentAmount: e.loan ? N(e.loan.installmentAmount) : null,
    })),
  );
};

export const createFixedExpense = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, amount, dueDate, autoPay, hasInstallments, totalInstallments, paidInstallments } = req.body;

  if (!name || !amount || !dueDate) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  let loanId: string | undefined;

  if (hasInstallments && totalInstallments) {
    const total = parseInt(totalInstallments, 10);
    const paid  = parseInt(paidInstallments ?? '0', 10);
    const loan  = await prisma.loan.create({
      data: {
        name,
        loanType:          'PURCHASE',
        status:            paid >= total ? 'PAID' : 'ACTIVE',
        originalAmount:    Number(amount) * total,
        installmentAmount: Number(amount),
        totalInstallments: total,
        paidInstallments:  paid,
        userId,
      },
    });
    loanId = loan.id;
  }

  const expense = await prisma.fixedExpense.create({
    data: {
      name,
      amount,
      dueDate: parseInt(dueDate, 10),
      autoPay: Boolean(autoPay),
      status:  'PENDING',
      userId,
      ...(loanId ? { loanId } : {}),
    },
    include: {
      loan: { select: { paidInstallments: true, totalInstallments: true, installmentAmount: true, name: true, status: true } },
    },
  });

  return res.status(201).json({
    id:                expense.id,
    name:              expense.name,
    amount:            N(expense.amount),
    dueDate:           expense.dueDate,
    autoPay:           expense.autoPay,
    status:            expense.status,
    loanId:            expense.loanId ?? null,
    loanName:          expense.loan?.name ?? null,
    paidInstallments:  expense.loan?.paidInstallments  ?? null,
    totalInstallments: expense.loan?.totalInstallments ?? null,
    installmentAmount: expense.loan ? N(expense.loan.installmentAmount) : null,
  });
};

export const deleteFixedExpense = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = req.params['id'] as string;

  const expense = await prisma.fixedExpense.findFirst({ where: { id, userId } });
  if (!expense) return res.status(404).json({ error: 'Gasto no encontrado.' });

  // Si tiene un préstamo asociado (creado solo para este gasto), lo eliminamos también
  const loanId = expense.loanId;
  await prisma.fixedExpense.delete({ where: { id } });
  if (loanId) {
    const loanHasTx = await prisma.transaction.count({ where: { loanId } });
    if (loanHasTx === 0) await prisma.loan.delete({ where: { id: loanId } });
  }

  return res.status(204).send();
};

export const markExpensePaid = async (req: AuthRequest, res: Response) => {
  const userId  = req.userId!;
  const id      = req.params['id'] as string;
  const { accountId } = req.body as { accountId?: string };

  const expense = await prisma.fixedExpense.findFirst({ where: { id, userId } });
  if (!expense) return res.status(404).json({ error: 'Gasto no encontrado.' });

  const updated = await prisma.fixedExpense.update({
    where: { id },
    data:  { status: 'PAID' },
  });

  // Registrar la transacción en la cuenta seleccionada
  if (accountId) {
    const cat = await prisma.category.upsert({
      where:  { name_userId: { name: 'Cuentas Fijas', userId } },
      update: {},
      create: { name: 'Cuentas Fijas', color: '#6366f1', userId },
    });

    await prisma.transaction.create({ data: {
      title:         expense.name,
      amount:        N(expense.amount),
      date:          new Date(),
      type:          'EXPENSE',
      paymentMethod: 'BANK_TRANSFER',
      categoryId:    cat.id,
      accountId,
      loanId:        expense.loanId ?? undefined,
      userId,
    }});

    // Si tiene cuota vinculada, incrementar paidInstallments
    if (expense.loanId) {
      const loan = await prisma.loan.findUnique({ where: { id: expense.loanId } });
      if (loan && loan.status === 'ACTIVE') {
        const newPaid = loan.paidInstallments + 1;
        await prisma.loan.update({
          where: { id: expense.loanId },
          data: {
            paidInstallments: newPaid,
            status: newPaid >= loan.totalInstallments ? 'PAID' : 'ACTIVE',
          },
        });
      }
    }
  }

  return res.json({ ...updated, amount: N(updated.amount) });
};

export const toggleAutoPayExpense = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = req.params['id'] as string;

  const expense = await prisma.fixedExpense.findFirst({ where: { id, userId } });
  if (!expense) return res.status(404).json({ error: 'Gasto no encontrado.' });

  const updated = await prisma.fixedExpense.update({
    where: { id },
    data:  { autoPay: !expense.autoPay },
  });

  return res.json({ ...updated, amount: N(updated.amount) });
};
