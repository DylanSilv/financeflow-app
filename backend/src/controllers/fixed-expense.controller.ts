import { Response } from 'express';
import { prisma } from '../lib/Prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const N = (v: unknown): number => (v == null ? 0 : Number(v));

// Dos fechas en el mismo año+mes calendar
function sameYearMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Calcula el status efectivo para mostrar al frontend.
// Si fue pagado en un mes anterior → PENDING (reset lazy).
// Excepción: si el préstamo vinculado ya está completamente pagado → siempre PAID.
function effectiveStatus(
  status: 'PENDING' | 'PAID' | 'OVERDUE',
  lastPaidAt: Date | null,
  loanStatus?: string | null,
): 'PENDING' | 'PAID' | 'OVERDUE' {
  if (status !== 'PAID') return status;

  // Préstamo terminado: permanece pagado para siempre
  if (loanStatus === 'PAID') return 'PAID';

  // Sin registro de pago: preservar estado DB (datos anteriores a esta feature)
  if (!lastPaidAt) return 'PAID';

  // Pagado en un mes anterior → reset a PENDING
  const now = new Date();
  return sameYearMonth(lastPaidAt, now) ? 'PAID' : 'PENDING';
}

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
    expenses.map(e => {
      const status = effectiveStatus(e.status, e.lastPaidAt, e.loan?.status ?? null);
      return {
        id:                e.id,
        name:              e.name,
        amount:            N(e.amount),
        dueDate:           e.dueDate,
        autoPay:           e.autoPay,
        accountId:         e.accountId ?? null,
        status,
        lastPaidAt:        e.lastPaidAt ?? null,
        loanId:            e.loanId ?? null,
        loanName:          e.loan?.name ?? null,
        paidInstallments:  e.loan?.paidInstallments  ?? null,
        totalInstallments: e.loan?.totalInstallments ?? null,
        installmentAmount: e.loan ? N(e.loan.installmentAmount) : null,
      };
    }),
  );
};

export const createFixedExpense = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { name, amount, dueDate, autoPay, accountId, hasInstallments, totalInstallments, paidInstallments } = req.body;

  if (!name?.trim() || !dueDate) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const parsedAmount  = Number(amount);
  const parsedDueDate = parseInt(dueDate, 10);

  if (!isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número mayor a 0.' });
  }
  if (isNaN(parsedDueDate) || parsedDueDate < 1 || parsedDueDate > 31) {
    return res.status(400).json({ error: 'El día de vencimiento debe estar entre 1 y 31.' });
  }

  let loanId: string | undefined;

  if (hasInstallments && totalInstallments) {
    const total = parseInt(totalInstallments, 10);
    const paid  = parseInt(paidInstallments ?? '0', 10);
    const loan  = await prisma.loan.create({
      data: {
        name:              name.trim(),
        loanType:          'PURCHASE',
        status:            paid >= total ? 'PAID' : 'ACTIVE',
        originalAmount:    parsedAmount * total,
        installmentAmount: parsedAmount,
        totalInstallments: total,
        paidInstallments:  paid,
        userId,
      },
    });
    loanId = loan.id;
  }

  const expense = await prisma.fixedExpense.create({
    data: {
      name:      name.trim(),
      amount:    parsedAmount,
      dueDate:   parsedDueDate,
      autoPay:   Boolean(autoPay),
      status:    'PENDING',
      userId,
      accountId: accountId ?? null,
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

  const loanId = expense.loanId;
  await prisma.fixedExpense.delete({ where: { id } });
  if (loanId) {
    const loanHasTx = await prisma.transaction.count({ where: { loanId } });
    if (loanHasTx === 0) await prisma.loan.delete({ where: { id: loanId } });
  }

  return res.status(204).send();
};

export const updateFixedExpense = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id     = req.params['id'] as string;

  const expense = await prisma.fixedExpense.findFirst({ where: { id, userId } });
  if (!expense) return res.status(404).json({ error: 'Gasto no encontrado.' });

  const { name, amount, dueDate, autoPay, accountId } = req.body;
  const data: Record<string, unknown> = {};

  if (name?.trim())          data.name      = name.trim();
  if (autoPay !== undefined) data.autoPay   = Boolean(autoPay);
  if (accountId !== undefined) data.accountId = accountId ?? null;
  if (amount !== undefined) {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
    data.amount = n;
  }
  if (dueDate !== undefined) {
    const d = parseInt(dueDate, 10);
    if (isNaN(d) || d < 1 || d > 31) return res.status(400).json({ error: 'El día de vencimiento debe estar entre 1 y 31.' });
    data.dueDate = d;
  }

  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin cambios que aplicar.' });

  const updated = await prisma.fixedExpense.update({ where: { id }, data });
  return res.json({ ...updated, amount: N(updated.amount) });
};

export const markExpensePaid = async (req: AuthRequest, res: Response) => {
  const userId  = req.userId!;
  const id      = req.params['id'] as string;
  const { accountId } = req.body as { accountId?: string };

  const expense = await prisma.fixedExpense.findFirst({ where: { id, userId } });
  if (!expense) return res.status(404).json({ error: 'Gasto no encontrado.' });

  if (accountId) {
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return res.status(400).json({ error: 'Cuenta no válida.' });
  }

  const now = new Date();

  const updated = await prisma.fixedExpense.update({
    where: { id },
    data:  { status: 'PAID', lastPaidAt: now },
  });

  if (accountId) {
    const cat = await prisma.category.upsert({
      where:  { name_userId: { name: 'Cuentas Fijas', userId } },
      update: {},
      create: { name: 'Cuentas Fijas', color: '#6366f1', userId },
    });

    await prisma.transaction.create({ data: {
      title:         expense.name,
      amount:        N(expense.amount),
      date:          now,
      type:          'EXPENSE',
      paymentMethod: 'BANK_TRANSFER',
      categoryId:    cat.id,
      accountId,
      loanId:        expense.loanId ?? undefined,
      userId,
    }});

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

export const runAutoPay = async (req: AuthRequest, res: Response) => {
  const userId   = req.userId!;
  const today    = new Date();
  const dayToday = today.getDate();

  // Candidatos: autoPay activo + cuenta vinculada + no son de préstamo ya terminado
  const candidates = await prisma.fixedExpense.findMany({
    where:   { userId, autoPay: true, accountId: { not: null } },
    include: { loan: { select: { status: true, paidInstallments: true, totalInstallments: true } } },
  });

  const paid: { id: string; name: string; amount: number }[] = [];

  for (const e of candidates) {
    // Skip si el préstamo vinculado ya terminó
    if (e.loan?.status === 'PAID') continue;

    // Estado efectivo: si fue pagado este mes → skip
    const status = effectiveStatus(e.status, e.lastPaidAt, e.loan?.status ?? null);
    if (status === 'PAID') continue;

    // Solo pagar si el día de vencimiento ya llegó este mes
    if (e.dueDate > dayToday) continue;

    // Verificar que la cuenta existe y pertenece al usuario
    const account = await prisma.account.findFirst({ where: { id: e.accountId!, userId, isArchived: false } });
    if (!account) continue;

    // Marcar como pagado
    await prisma.fixedExpense.update({
      where: { id: e.id },
      data:  { status: 'PAID', lastPaidAt: today },
    });

    // Crear transacción
    const cat = await prisma.category.upsert({
      where:  { name_userId: { name: 'Cuentas Fijas', userId } },
      update: {},
      create: { name: 'Cuentas Fijas', color: '#6366f1', userId },
    });

    await prisma.transaction.create({ data: {
      title:         `[AutoPay] ${e.name}`,
      amount:        N(e.amount),
      date:          today,
      type:          'EXPENSE',
      paymentMethod: 'BANK_TRANSFER',
      categoryId:    cat.id,
      accountId:     e.accountId!,
      loanId:        e.loanId ?? undefined,
      userId,
    }});

    // Avanzar cuota del préstamo si corresponde
    if (e.loanId && e.loan?.status === 'ACTIVE') {
      const newPaid = e.loan.paidInstallments + 1;
      await prisma.loan.update({
        where: { id: e.loanId },
        data:  {
          paidInstallments: newPaid,
          status: newPaid >= e.loan.totalInstallments ? 'PAID' : 'ACTIVE',
        },
      });
    }

    paid.push({ id: e.id, name: e.name, amount: N(e.amount) });
  }

  return res.json({ paid, count: paid.length });
};
