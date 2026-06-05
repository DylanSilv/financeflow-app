import path from 'path';
import dotenv from 'dotenv';
import { prisma } from '../../lib/Prisma';
import { ACCOUNTS } from './accounts';
import { scanMonthlyFiles, parseMonthly, parseLoans, ParsedMonthly } from './parser';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const IS_DRY = process.argv.includes('--dry-run');
const MONTHS = ['', 'Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Formatting helpers ──────────────────────────────────────

const W  = '═'.repeat(62);
const w  = '─'.repeat(62);
function h(t: string) { console.log(`\n${W}\n  ${t}\n${W}`); }
function s(t: string) { console.log(`  ${t}`); }
function sep()        { console.log(`  ${w}`); }
function uyu(n: number) {
  return '$' + n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  h(IS_DRY ? 'FinanceFlow Importer — DRY RUN' : 'FinanceFlow Importer — IMPORTACIÓN REAL');

  // ── 1. Usuario ─────────────────────────────────────────────
  console.log('\n👤  USUARIO');
  const email = process.env.SEED_USER_EMAIL?.trim();
  if (!email) {
    console.error('❌  SEED_USER_EMAIL no está definido en .env');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`\n❌  Usuario "${email}" no existe.`);
    console.error('    Ejecutá "npm run seed" primero.\n');
    process.exit(1);
  }
  s(`✅  ${user.name} (${user.email})`);
  s(`    id: ${user.id}`);

  // ── 2. Cuentas ─────────────────────────────────────────────
  console.log('\n🏦  CUENTAS (6)');
  sep();
  for (const a of ACCOUNTS) {
    s(`  ${a.name.padEnd(22)} ${a.type}`);
  }

  // ── 3. Préstamos ───────────────────────────────────────────
  const loans = parseLoans();
  console.log(`\n💳  PRÉSTAMOS (${loans.length})`);
  sep();
  const loanHeader = '  Nombre              Tipo       Monto orig  Cuotas  Cuota/mes      Pagas   Estado';
  s(loanHeader);
  sep();
  for (const l of loans) {
    const name   = l.name.padEnd(20);
    const type   = l.loanType.padEnd(10);
    const orig   = uyu(l.originalAmount).padStart(11);
    const cuotas = String(l.totalInstallments).padStart(6);
    const inst   = uyu(l.installmentAmount).padStart(12);
    const paid   = `${l.paidInstallments}/${l.totalInstallments}`.padStart(7);
    const status = l.status;
    s(`  ${name} ${type} ${orig} ${cuotas} ${inst} ${paid}   ${status}`);
  }

  // ── 4. Archivos mensuales ──────────────────────────────────
  console.log('\n📊  ARCHIVOS MENSUALES');
  sep();
  const fileHeader = '  Archivo                        Fmt   Ingresos  GFijos  Ahorros  Compras  Warn';
  s(fileHeader);
  sep();

  const allFiles  = scanMonthlyFiles();
  const parsed: ParsedMonthly[] = [];
  const allWarnings: string[] = [];

  let totalSkipped  = 0;
  let emptyFiles    = 0;

  for (const fp of allFiles) {
    const result = parseMonthly(fp);
    const rel = fp.replace(path.resolve(__dirname, '../../../../imports/Registros financiero/'), '').replace(/\\/g, '/');

    if (!result) {
      emptyFiles++;
      continue;
    }

    parsed.push(result);
    totalSkipped += result.skipped;

    const warn = result.warnings.length > 0 ? `⚠️  ${result.warnings.length}` : '';
    result.warnings.forEach(w => allWarnings.push(`  ${rel}: ${w}`));

    const label = `${result.year}/${MONTHS[result.month]}`.padEnd(30);
    const fmt   = result.format.padEnd(5);
    const inc   = String(result.income.length).padStart(8);
    const gf    = String(result.fixedExpenses.length).padStart(7);
    const sav   = String(result.savings.length).padStart(8);
    const tx    = String(result.transactions.length).padStart(8);
    s(`  ${label} ${fmt} ${inc} ${gf} ${sav} ${tx}  ${warn}`);
  }

  sep();

  const totals = parsed.reduce(
    (acc, p) => {
      acc.income += p.income.length;
      acc.gf     += p.fixedExpenses.length;
      acc.sav    += p.savings.length;
      acc.tx     += p.transactions.length;
      return acc;
    },
    { income: 0, gf: 0, sav: 0, tx: 0 },
  );

  const tLabel = 'TOTALES'.padEnd(30);
  s(`  ${tLabel}      ` +
    `${String(totals.income).padStart(8)} ` +
    `${String(totals.gf).padStart(7)} ` +
    `${String(totals.sav).padStart(8)} ` +
    `${String(totals.tx).padStart(8)}`);

  s(`\n  Archivos con datos: ${parsed.length}  |  Templates vacíos ignorados: ${emptyFiles}`);
  s(`  Filas omitidas (placeholder "00/mm/aaaa"): ${totalSkipped}`);

  // ── 5. Resumen de registros a insertar ─────────────────────
  console.log('\n📦  REGISTROS A INSERTAR');
  sep();
  s(`  Cuentas (Account)       ${ACCOUNTS.length}`);
  s(`  Préstamos (Loan)        ${loans.length}`);
  s(`  Transacciones (income)  ${totals.income}`);
  s(`  Transacciones (expense) ${totals.tx}`);
  s(`  Gastos fijos (muestra)  ${totals.gf}  (deduplicados por nombre al importar)`);
  s(`  Objetivos ahorro        ${totals.sav}  (deduplicados por nombre al importar)`);

  // ── 6. Advertencias ────────────────────────────────────────
  if (allWarnings.length > 0) {
    console.log(`\n⚠️   ADVERTENCIAS (${allWarnings.length})`);
    sep();
    allWarnings.slice(0, 20).forEach(w => s(w));
    if (allWarnings.length > 20) s(`  ... y ${allWarnings.length - 20} más`);
  } else {
    console.log('\n⚠️   ADVERTENCIAS (0) — ninguna');
  }

  // ── 7. Muestra de transacciones ────────────────────────────
  const sample = parsed.flatMap(p => p.transactions).slice(0, 6);
  if (sample.length > 0) {
    console.log('\n🔍  MUESTRA (primeras 6 transacciones)');
    sep();
    for (const tx of sample) {
      const d = tx.date ? tx.date.toISOString().split('T')[0] : 'sin fecha';
      s(`  ${d}  ${tx.title.substring(0, 30).padEnd(30)}  ${uyu(tx.amount).padStart(12)}  [${tx.accountName}]`);
    }
  }

  // ── 8. Cierre dry-run / arranque real ─────────────────────
  console.log('');
  if (IS_DRY) {
    console.log(`${W}`);
    console.log('  ✅  DRY RUN completado — sin cambios en la base de datos.');
    console.log('  →  Revisá los números y ejecutá "npm run import" para insertar.');
    console.log(`${W}\n`);
    await prisma.$disconnect();
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // IMPORTACIÓN REAL
  // ═══════════════════════════════════════════════════════════

  // Guardia: abortar si ya existen transacciones (evitar duplicados)
  const IS_FORCE = process.argv.includes('--force');
  const existingTx = await prisma.transaction.count({ where: { userId: user.id } });
  if (existingTx > 0 && !IS_FORCE) {
    console.error(`\n❌  Ya existen ${existingTx} transacciones para este usuario.`);
    console.error('    Usá "npm run import -- --force" para limpiar y reimportar.\n');
    await prisma.$disconnect();
    process.exit(1);
  }
  if (existingTx > 0 && IS_FORCE) {
    console.log(`\n⚠️   --force: eliminando ${existingTx} transacciones existentes…`);
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
  }

  // ── A. Cuentas ─────────────────────────────────────────────
  process.stdout.write('  Creando cuentas…      ');
  const accountMap = new Map<string, string>();
  for (const a of ACCOUNTS) {
    const acc = await prisma.account.upsert({
      where:  { name_userId: { name: a.name, userId: user.id } },
      create: { name: a.name, type: a.type as any, color: a.color, userId: user.id },
      update: {},
    });
    accountMap.set(a.name, acc.id);
  }
  console.log(`✅  ${accountMap.size} cuentas`);

  // ── B. Préstamos ───────────────────────────────────────────
  process.stdout.write('  Creando préstamos…    ');
  const loanMap = new Map<string, string>();
  for (const l of loans) {
    const existing = await prisma.loan.findFirst({
      where: { name: l.name, loanType: l.loanType as any, userId: user.id },
    });
    const loan = existing ?? await prisma.loan.create({
      data: {
        name:              l.name,
        loanType:          l.loanType  as any,
        originalAmount:    l.originalAmount,
        totalInstallments: l.totalInstallments,
        installmentAmount: l.installmentAmount,
        paidInstallments:  l.paidInstallments,
        startDate:         l.startDate ?? undefined,
        endDate:           l.endDate   ?? undefined,
        status:            l.status    as any,
        notes:             l.notes     || null,
        userId:            user.id,
      },
    });
    loanMap.set(l.name, loan.id);
  }
  console.log(`✅  ${loanMap.size} préstamos`);

  // ── C. Gastos fijos (deduplicados, más reciente por nombre) ─
  process.stdout.write('  Creando gastos fijos… ');
  const feLatest = new Map<string, { amount: number; dueDay: number | null; status: string; year: number; month: number }>();
  for (const p of parsed) {
    for (const fe of p.fixedExpenses) {
      const cur = feLatest.get(fe.name);
      if (!cur || p.year > cur.year || (p.year === cur.year && p.month > cur.month)) {
        feLatest.set(fe.name, { amount: fe.amount, dueDay: fe.dueDay, status: fe.status, year: p.year, month: p.month });
      }
    }
  }
  // Match FixedExpense → Loan by keyword
  const LOAN_KEYWORDS: [string, string][] = [
    ['creditel', 'Creditel'], ['pagodespues', 'PagoDespues'], ['pago despues', 'PagoDespues'],
    ['ute', 'UTE'], ['monopatin', 'Monopatin'], ['championes', 'Championes pri'], ['ropa', 'Ropa pri'],
  ];
  // Pre-load loanIds already linked to existing FixedExpenses (idempotency guard)
  const existingLinked = await prisma.fixedExpense.findMany({
    where: { userId: user.id, loanId: { not: null } },
    select: { loanId: true },
  });
  const usedLoanIds = new Set<string>(existingLinked.map(fe => fe.loanId!));

  function matchLoanId(name: string): string | null {
    const lower = name.toLowerCase();
    for (const [kw, loanName] of LOAN_KEYWORDS) {
      if (lower.includes(kw)) {
        const id = loanMap.get(loanName);
        if (id && !usedLoanIds.has(id)) { usedLoanIds.add(id); return id; }
      }
    }
    return null;
  }
  let feCreated = 0;
  for (const [name, fe] of feLatest.entries()) {
    const exists = await prisma.fixedExpense.findFirst({ where: { name, userId: user.id } });
    if (!exists) {
      await prisma.fixedExpense.create({
        data: {
          name,
          amount:  fe.amount,
          dueDate: fe.dueDay ?? 1,
          status:  'PENDING',
          userId:  user.id,
          loanId:  matchLoanId(name) ?? undefined,
        },
      });
      feCreated++;
    }
  }
  console.log(`✅  ${feCreated} gastos fijos`);

  // ── D. Objetivos de ahorro ─────────────────────────────────
  process.stdout.write('  Creando ahorros…      ');
  const savSeen = new Map<string, number>();
  for (const p of parsed) {
    for (const sg of p.savings) {
      const cur = savSeen.get(sg.name) ?? 0;
      if (sg.amount > cur) savSeen.set(sg.name, sg.amount);
    }
  }
  let savCreated = 0;
  for (const [name, amount] of savSeen.entries()) {
    const exists = await prisma.savingsGoal.findFirst({ where: { name, userId: user.id } });
    if (!exists) {
      await prisma.savingsGoal.create({
        data: { name, targetAmount: amount, currentAmount: amount, userId: user.id },
      });
      savCreated++;
    }
  }
  console.log(`✅  ${savCreated} objetivos de ahorro`);

  // ── E. Transacciones ───────────────────────────────────────
  process.stdout.write('  Creando transacciones… ');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txData: any[] = [];

  for (const p of parsed) {
    // Income entries
    for (const inc of p.income) {
      txData.push({
        title:         inc.source,
        amount:        inc.amount,
        date:          inc.date ?? new Date(p.year, p.month - 1, 1),
        type:          'INCOME',
        paymentMethod: 'BANK_TRANSFER',
        accountId:     accountMap.get(inc.accountName) ?? null,
        userId:        user.id,
      });
    }
    // Expense entries
    for (const tx of p.transactions) {
      txData.push({
        title:         tx.title,
        amount:        tx.amount,
        date:          tx.date ?? new Date(p.year, p.month - 1, 15),
        type:          'EXPENSE',
        paymentMethod: tx.paymentMethod as any,
        accountId:     accountMap.get(tx.accountName) ?? null,
        userId:        user.id,
      });
    }
  }

  await prisma.transaction.createMany({ data: txData });
  console.log(`✅  ${txData.length} transacciones`);

  console.log(`\n${W}`);
  console.log(`  🎉  Importación completada.`);
  console.log(`      ${accountMap.size} cuentas · ${loanMap.size} préstamos · ${txData.length} transacciones`);
  console.log(`      ${feCreated} gastos fijos · ${savCreated} objetivos de ahorro`);
  console.log(`${W}\n`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('\n❌  Error inesperado:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
