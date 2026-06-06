/**
 * Importa resúmenes mensuales desde los Excel para poblar el gráfico de evolución patrimonial.
 * Lee cada archivo de 2025 (Ene-Dic) y 2026 (Ene-May) y crea:
 *   - 1 transacción INCOME (Cobro del mes) en cuenta Itaú
 *   - 1 transacción INCOME (Beneficio Antel) en cuenta Beneficio Antel, si corresponde
 *   - 1 transacción EXPENSE (total gastos del mes) en cuenta Itaú
 * Salta junio 2026 (ya cargado manualmente con detalle real).
 */

import XLSX from 'xlsx';
import path from 'path';
import { PrismaClient }    from '@prisma/client';
import { PrismaMariaDb }   from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma  = new PrismaClient({ adapter } as any);

const IMPORTS_BASE = path.resolve(__dirname, '../../../imports/Registros financiero');
const USER_EMAIL   = process.env.SEED_USER_EMAIL!;

const MONTH_MAP: Record<string, number> = {
  Enero:1, Febrero:2, 'Marzo_':3, 'Copia de Marzo_':3, Abril:4,
  Mayo:5, ' Mayo':5, Junio:6, Julio:7, ' Julio':7, Agosto:8,
  Septiembre:9, ' Septiembre':9, Octubre:10, ' Octubre':10,
  Noviembre:11, Diciembre:12,
};

function excelDateToJs(v: unknown): Date | null {
  if (typeof v !== 'number' || v < 40_000 || v > 60_000) return null;
  return new Date((v - 25569) * 86400 * 1000);
}

function num(v: unknown): number {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

interface MonthSummary {
  year: number; month: number;
  cobro: number; beneficio: number;
  totalExpenses: number;
  date: Date;
}

function parseFile(filePath: string, year: number, month: number): MonthSummary | null {
  try {
    const wb   = XLSX.readFile(filePath);
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

    let cobro     = 0;
    let beneficio = 0;

    // ── Ingresos (filas 1-15, col A/B) ────────────────────────
    for (let i = 1; i <= 15; i++) {
      const row   = rows[i] ?? [];
      const label = String(row[0] ?? '').trim().toLowerCase();
      const val   = num(row[1]);
      if (label === 'cobro')               cobro     = val;
      if (label.startsWith('beneficio'))   beneficio = val;
    }

    // ── Gastos fijos: fila donde col[3]="Total" → col[4] ─────
    let fixedTotal = 0;
    for (const row of rows) {
      if (String((row as unknown[])[3] ?? '').trim() === 'Total') {
        const v = num((row as unknown[])[4]);
        if (v > 0) { fixedTotal = v; break; }
      }
    }

    // ── Compras: buscar sección COMPRAS y su fila "Total" ─────
    let purchasesTotal = 0;
    let inCompras = false;
    for (const row of rows) {
      const a = String((row as unknown[])[0] ?? '').trim();
      if (a.toUpperCase().includes('COMPRAS')) { inCompras = true; continue; }
      if (inCompras && a === 'Total') {
        const v = num((row as unknown[])[1]);
        if (v > 0) { purchasesTotal = v; break; }
        // Si no tiene monto en col B, parar igual (no queremos secciones posteriores)
        break;
      }
      // Parar si llegamos a DEVOLUCIONES u otra sección principal
      if (inCompras && (a.toUpperCase().includes('DEVOLUC') || a === 'Itau' || a === 'Efectivo')) break;
    }

    // ── Fallback 2025: "Total gastos" en col A ────────────────
    const gastoRow = rows.find(r => String((r as unknown[])[0]).trim().toLowerCase() === 'total gastos ');
    const totalGastos2025 = gastoRow ? num((gastoRow as unknown[])[1]) : 0;

    const totalExpenses = totalGastos2025 > 0 ? totalGastos2025 : fixedTotal + purchasesTotal;

    const dayDate = new Date(Date.UTC(year, month - 1, 5));
    return { year, month, cobro, beneficio, totalExpenses, date: dayDate };
  } catch (e) {
    console.warn(`  ⚠ No se pudo leer ${filePath}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error('Usuario no encontrado: ' + USER_EMAIL);

  const itauAcc   = await prisma.account.findFirst({ where: { userId: user.id, name: 'Itaú'           } });
  const benefAcc  = await prisma.account.findFirst({ where: { userId: user.id, name: 'Beneficio Antel'} });
  if (!itauAcc || !benefAcc) throw new Error('Cuentas no encontradas');

  // Upsert categorías
  const upsertCat = async (name: string, color: string) =>
    prisma.category.upsert({
      where:  { name_userId: { name, userId: user.id } },
      update: {},
      create: { name, color, userId: user.id },
    });

  const catSueldo  = await upsertCat('Sueldo',       '#10b981');
  const catBenef   = await upsertCat('Beneficios',   '#06b6d4');
  const catGastos  = await upsertCat('Gastos mes',   '#ef4444');

  const YEARS: [number, string[]][] = [
    [2025, ['Enero','Febrero','Marzo_','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']],
    [2026, ['Enero','Febrero','Marzo_','Abril',' Mayo']],  // Junio 2026 ya está cargado
  ];

  let imported = 0;

  for (const [year, months] of YEARS) {
    for (const monthName of months) {
      const monthNum = MONTH_MAP[monthName];
      if (!monthNum) { console.warn(`Mes desconocido: ${monthName}`); continue; }

      const filePath = path.join(IMPORTS_BASE, String(year), `${monthName}.xlsx`);
      const summary  = parseFile(filePath, year, monthNum);
      if (!summary) continue;

      const label = `${monthName.trim()} ${year}`;
      console.log(`  ${label}: cobro=$${summary.cobro} | beneficio=$${summary.beneficio} | gastos=$${summary.totalExpenses.toFixed(0)}`);

      // Borrar transacciones de resumen que ya existan para este mes (evitar duplicados)
      await prisma.transaction.deleteMany({
        where: {
          userId: user.id,
          title: { in: [`Cobro ${label}`, `Beneficio Antel ${label}`, `Gastos ${label}`] },
        },
      });

      const txDate = summary.date;

      // Cobro (sueldo)
      if (summary.cobro > 0) {
        await prisma.transaction.create({ data: {
          title: `Cobro ${label}`, amount: summary.cobro, date: txDate,
          type: 'INCOME', paymentMethod: 'BANK_TRANSFER',
          categoryId: catSueldo.id, accountId: itauAcc.id, userId: user.id,
        }});
      }

      // Beneficio Antel
      if (summary.beneficio > 0) {
        await prisma.transaction.create({ data: {
          title: `Beneficio Antel ${label}`, amount: summary.beneficio, date: txDate,
          type: 'INCOME', paymentMethod: 'BANK_TRANSFER',
          categoryId: catBenef.id, accountId: benefAcc.id, userId: user.id,
        }});
      }

      // Gastos totales del mes
      if (summary.totalExpenses > 0) {
        await prisma.transaction.create({ data: {
          title: `Gastos ${label}`, amount: summary.totalExpenses, date: txDate,
          type: 'EXPENSE', paymentMethod: 'BANK_TRANSFER',
          categoryId: catGastos.id, accountId: itauAcc.id, userId: user.id,
        }});
      }

      imported++;
    }
  }

  console.log(`\n✅ ${imported} meses importados correctamente.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
