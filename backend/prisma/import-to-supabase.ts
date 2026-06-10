// Script de importación JSON → Supabase/PostgreSQL
// Uso: npx ts-node --transpile-only prisma/import-to-supabase.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool    = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

interface ExportedData {
  exportedAt: string;
  users:         Prisma.UserCreateInput[];
  accounts:      Record<string, unknown>[];
  categories:    Record<string, unknown>[];
  cards:         Record<string, unknown>[];
  loans:         Record<string, unknown>[];
  fixedExpenses: Record<string, unknown>[];
  savingsGoals:  Record<string, unknown>[];
  transactions:  Record<string, unknown>[];
  transfers:     Record<string, unknown>[];
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  return new Date(v as string);
}

async function main() {
  const dataPath = path.join(__dirname, 'mysql-export.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('mysql-export.json no encontrado. Ejecutá export-mysql.ts primero.');
  }

  const data: ExportedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Importando datos exportados el ${data.exportedAt}...`);

  // Orden: respetar las FK constraints
  // 1. Users
  console.log(`\n→ Users (${data.users.length})`);
  for (const u of data.users) {
    await prisma.user.upsert({
      where:  { id: u.id as string },
      update: {},
      create: {
        id:        u.id as string,
        email:     u.email as string,
        password:  u.password as string,
        name:      u.name as string,
        avatarUrl: u.avatarUrl as string | null ?? null,
        createdAt: toDate(u.createdAt)!,
        updatedAt: toDate(u.updatedAt)!,
      },
    });
  }

  // 2. Accounts
  console.log(`→ Accounts (${data.accounts.length})`);
  for (const a of data.accounts) {
    await prisma.account.upsert({
      where:  { id: a.id as string },
      update: {},
      create: {
        id:             a.id as string,
        name:           a.name as string,
        type:           a.type as 'CHECKING' | 'SAVINGS' | 'CASH' | 'BENEFIT',
        icon:           a.icon as string | null ?? null,
        color:          a.color as string | null ?? null,
        initialBalance: a.initialBalance as number,
        isArchived:     (a.isArchived as boolean) ?? false,
        userId:         a.userId as string,
      },
    });
  }

  // 3. Categories
  console.log(`→ Categories (${data.categories.length})`);
  for (const c of data.categories) {
    await prisma.category.upsert({
      where:  { id: c.id as string },
      update: {},
      create: {
        id:     c.id as string,
        name:   c.name as string,
        icon:   c.icon as string | null ?? null,
        color:  c.color as string | null ?? null,
        userId: c.userId as string,
      },
    });
  }

  // 4. Loans
  console.log(`→ Loans (${data.loans.length})`);
  for (const l of data.loans) {
    await prisma.loan.upsert({
      where:  { id: l.id as string },
      update: {},
      create: {
        id:                l.id as string,
        name:              l.name as string,
        lenderName:        l.lenderName as string | null ?? null,
        loanType:          l.loanType as 'PERSONAL' | 'PURCHASE',
        originalAmount:    l.originalAmount as number,
        totalInstallments: l.totalInstallments as number,
        installmentAmount: l.installmentAmount as number,
        paidInstallments:  (l.paidInstallments as number) ?? 0,
        startDate:         toDate(l.startDate),
        endDate:           toDate(l.endDate),
        status:            (l.status as 'ACTIVE' | 'PAID' | 'CANCELLED') ?? 'ACTIVE',
        notes:             l.notes as string | null ?? null,
        userId:            l.userId as string,
      },
    });
  }

  // 5. Cards
  console.log(`→ Cards (${data.cards.length})`);
  for (const c of data.cards) {
    await prisma.card.upsert({
      where:  { id: c.id as string },
      update: {},
      create: {
        id:             c.id as string,
        name:           c.name as string,
        type:           c.type as 'CREDIT' | 'DEBIT',
        limit:          c.limit as number | null ?? null,
        balanceUsed:    (c.balanceUsed as number) ?? 0,
        closingDate:    c.closingDate as number | null ?? null,
        dueDate:        c.dueDate as number | null ?? null,
        brand:          c.brand as string | null ?? null,
        lastFourDigits: c.lastFourDigits as string | null ?? null,
        color:          c.color as string | null ?? null,
        userId:         c.userId as string,
        accountId:      c.accountId as string | null ?? null,
      },
    });
  }

  // 6. FixedExpenses
  console.log(`→ FixedExpenses (${data.fixedExpenses.length})`);
  for (const e of data.fixedExpenses) {
    await prisma.fixedExpense.upsert({
      where:  { id: e.id as string },
      update: {},
      create: {
        id:         e.id as string,
        name:       e.name as string,
        amount:     e.amount as number,
        dueDate:    e.dueDate as number,
        autoPay:    (e.autoPay as boolean) ?? false,
        status:     (e.status as 'PENDING' | 'PAID' | 'OVERDUE') ?? 'PENDING',
        lastPaidAt: toDate(e.lastPaidAt),
        userId:     e.userId as string,
        accountId:  e.accountId as string | null ?? null,
        loanId:     e.loanId as string | null ?? null,
      },
    });
  }

  // 7. SavingsGoals
  console.log(`→ SavingsGoals (${data.savingsGoals.length})`);
  for (const g of data.savingsGoals) {
    await prisma.savingsGoal.upsert({
      where:  { id: g.id as string },
      update: {},
      create: {
        id:            g.id as string,
        name:          g.name as string,
        targetAmount:  g.targetAmount as number,
        currentAmount: (g.currentAmount as number) ?? 0,
        deadline:      toDate(g.deadline),
        color:         g.color as string | null ?? null,
        userId:        g.userId as string,
      },
    });
  }

  // 8. Transactions
  console.log(`→ Transactions (${data.transactions.length})`);
  for (const t of data.transactions) {
    await prisma.transaction.upsert({
      where:  { id: t.id as string },
      update: {},
      create: {
        id:            t.id as string,
        title:         t.title as string,
        description:   t.description as string | null ?? null,
        amount:        t.amount as number,
        date:          toDate(t.date)!,
        type:          t.type as 'INCOME' | 'EXPENSE',
        paymentMethod: t.paymentMethod as 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER',
        categoryId:    t.categoryId as string | null ?? null,
        cardId:        t.cardId as string | null ?? null,
        accountId:     t.accountId as string | null ?? null,
        loanId:        t.loanId as string | null ?? null,
        userId:        t.userId as string,
        createdAt:     toDate(t.createdAt)!,
        updatedAt:     toDate(t.updatedAt)!,
      },
    });
  }

  // 9. Transfers
  console.log(`→ Transfers (${data.transfers.length})`);
  for (const t of data.transfers) {
    await prisma.transfer.upsert({
      where:  { id: t.id as string },
      update: {},
      create: {
        id:            t.id as string,
        amount:        t.amount as number,
        date:          toDate(t.date)!,
        description:   t.description as string | null ?? null,
        fromAccountId: t.fromAccountId as string,
        toAccountId:   t.toAccountId as string,
        userId:        t.userId as string,
        createdAt:     toDate(t.createdAt)!,
      },
    });
  }

  console.log('\n✅ Importación completa en Supabase.');
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
