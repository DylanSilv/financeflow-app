// Script de exportación MySQL → JSON (ejecutar ANTES de migrar a Supabase)
// Uso: npx ts-node --transpile-only prisma/export-mysql.ts
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma   = new PrismaClient({ adapter });

async function main() {
  console.log('Exportando datos de MySQL...');

  const [users, accounts, categories, cards, loans, fixedExpenses, savingsGoals, transactions, transfers] =
    await Promise.all([
      prisma.user.findMany(),
      prisma.account.findMany(),
      prisma.category.findMany(),
      prisma.card.findMany(),
      prisma.loan.findMany(),
      prisma.fixedExpense.findMany(),
      prisma.savingsGoal.findMany(),
      prisma.transaction.findMany(),
      prisma.transfer.findMany(),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    users,
    accounts,
    categories,
    cards,
    loans,
    fixedExpenses,
    savingsGoals,
    transactions,
    transfers,
  };

  const outPath = path.join(__dirname, 'mysql-export.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

  console.log(`✅ Exportación completa → ${outPath}`);
  console.log(`   users:         ${users.length}`);
  console.log(`   accounts:      ${accounts.length}`);
  console.log(`   categories:    ${categories.length}`);
  console.log(`   cards:         ${cards.length}`);
  console.log(`   loans:         ${loans.length}`);
  console.log(`   fixedExpenses: ${fixedExpenses.length}`);
  console.log(`   savingsGoals:  ${savingsGoals.length}`);
  console.log(`   transactions:  ${transactions.length}`);
  console.log(`   transfers:     ${transfers.length}`);
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
