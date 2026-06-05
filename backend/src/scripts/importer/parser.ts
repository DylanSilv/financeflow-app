import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { SECTION_TO_ACCOUNT, ACCOUNT_TO_METHOD, INCOME_TO_ACCOUNT, shouldSkipIncome } from './accounts';

export const IMPORTS_BASE = path.resolve(
  __dirname, '../../../../imports/Registros financiero',
);

// ─── Shared types ────────────────────────────────────────────

export interface ParsedTx {
  title: string;
  amount: number;
  date: Date | null;
  status: 'Pagado' | 'Pendiente';
  accountName: string;
  paymentMethod: string;
  section: string;
}

export interface ParsedIncome {
  source: string;
  accountName: string;
  amount: number;
  date: Date | null;
}

export interface ParsedFixedExpense {
  name: string;
  amount: number;
  dueDay: number | null;
  status: 'PAID' | 'PENDING';
}

export interface ParsedSavings {
  name: string;
  amount: number;
}

export interface ParsedMonthly {
  year: number;
  month: number;
  filePath: string;
  format: '2025' | '2026';
  income: ParsedIncome[];
  fixedExpenses: ParsedFixedExpense[];
  savings: ParsedSavings[];
  transactions: ParsedTx[];
  warnings: string[];
  skipped: number;
}

export interface ParsedLoan {
  name: string;
  loanType: 'PERSONAL' | 'PURCHASE';
  originalAmount: number;
  totalInstallments: number;
  installmentAmount: number;
  paidInstallments: number;
  startDate: Date | null;
  endDate: Date | null;
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
  notes: string;
}

// ─── Low-level helpers ───────────────────────────────────────

type Row = unknown[];

function excelDate(v: unknown): Date | null {
  if (typeof v !== 'number' || v < 40_000 || v > 60_000) return null;
  const d = new Date((v - 25569) * 86400 * 1000);
  return isNaN(d.getTime()) ? null : d;
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && isFinite(v) && v !== 0) return v;
  return null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function rows(ws: XLSX.WorkSheet): Row[] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as Row[];
}

// ─── Format detection ────────────────────────────────────────
// 2026 layout: sections labelled "COMPRAS ..." (uppercase)
// 2025 layout: sections labelled "Compras ..." (capitalized)

type Layout = '2025' | '2026';

function detectLayout(data: Row[]): Layout {
  for (let i = 8; i < 22; i++) {
    const c0 = str(data[i]?.[0]);
    if (c0.startsWith('COMPRAS')) return '2026';
    if (c0.startsWith('Compras')) return '2025';
  }
  return '2025';
}

// ─── Income ──────────────────────────────────────────────────

function parseIncome(data: Row[], fallbackDate: Date | null): ParsedIncome[] {
  const income: ParsedIncome[] = [];
  // Scan rows 1–10: col 0 = label, col 1 = amount
  // Row 2 col 1 is the pay date (Excel serial), not an amount — filtered by shouldSkipIncome
  for (let i = 1; i <= 10; i++) {
    const row = data[i] ?? [];
    const label = str(row[0]);
    const amount = num(row[1]);
    if (!label || !amount || shouldSkipIncome(label)) continue;

    const dateSerial = data[2]?.[1];  // row 2 col 1 always holds the cobro date
    const date = excelDate(dateSerial) ?? fallbackDate;
    const accountName = INCOME_TO_ACCOUNT[label] ?? INCOME_TO_ACCOUNT[label + ' '] ?? 'BROU';
    income.push({ source: label, accountName, amount, date });
  }
  return income;
}

// ─── Fixed expenses ──────────────────────────────────────────
// Col 3 = name, 4 = amount, 5/6 = date, 7 = status (2026 only)

function parseFixedExpenses(data: Row[], layout: Layout): ParsedFixedExpense[] {
  const result: ParsedFixedExpense[] = [];
  const statusCol = layout === '2026' ? 7 : -1;

  for (let i = 2; i <= 12; i++) {
    const row = data[i] ?? [];
    const name   = str(row[3]);
    const amount = num(row[4]);
    if (!name || !amount) continue;
    if (name === 'Categorias' || name === 'Total' || name.includes('Voy pagando')) continue;

    const dateVal = layout === '2026' ? row[6] : row[5];
    const d    = excelDate(dateVal);
    const dueDay  = d ? d.getUTCDate() : null;
    const rawStatus = statusCol >= 0 ? str(row[statusCol]) : '';
    const status: 'PAID' | 'PENDING' = rawStatus === 'Pagado' ? 'PAID' : 'PENDING';

    result.push({ name, amount, dueDay, status });
  }
  return result;
}

// ─── Savings ─────────────────────────────────────────────────
// Col 7/9 = name, 8/10 = amount (varies by layout)

function parseSavings(data: Row[]): ParsedSavings[] {
  const result: ParsedSavings[] = [];
  // Try both col offsets used across 2025/2026 files
  const pairs: [number, number][] = [[7, 8], [9, 10]];

  for (let i = 1; i <= 8; i++) {
    const row = data[i] ?? [];
    for (const [nc, na] of pairs) {
      const name   = str(row[nc]);
      const amount = num(row[na]);
      if (!name || !amount) continue;
      if (name === 'Objetivo' || name === 'Total' || name.startsWith('Mes')) continue;
      if (!result.some(r => r.name === name)) {
        result.push({ name, amount });
      }
    }
  }
  return result;
}

// Titles that are section-end markers or account-subtotal labels, never real transactions
const SECTION_SKIP = new Set([
  'Total', 'Total ',
  'Brou', 'BROU',
  'Santander', 'Santander ',
  'Itau', 'Itaú',
  'Itau Alimentación', 'Itau Alimentacion',
  'Efectivo', 'Beneficio Antel',
]);

// ─── Transaction sections ────────────────────────────────────

interface Section { label: string; offset: number }

function findSections(data: Row[]): { sectionRow: number; sections: Section[]; width: number; layout: Layout } {
  const layout = detectLayout(data);
  const prefix = layout === '2026' ? 'COMPRAS' : 'Compras';
  const width  = layout === '2026' ? 6 : 5;

  for (let i = 8; i < 22; i++) {
    const row = data[i] ?? [];
    const labels = (row as unknown[])
      .map((c, j) => ({ c: str(c), j }))
      .filter(x => x.c.startsWith(prefix));
    if (labels.length > 0) {
      const sections: Section[] = labels.map(x => ({ label: x.c, offset: x.j }));
      // For single-section 2025, also check for plain "Compras" at col 0
      if (sections.length === 0 && layout === '2025') {
        sections.push({ label: 'Compras', offset: 0 });
      }
      return { sectionRow: i, sections, width, layout };
    }
  }
  return { sectionRow: -1, sections: [], width, layout };
}

function parseSections(
  data: Row[],
  year: number,
  month: number,
): { transactions: ParsedTx[]; warnings: string[]; skipped: number } {
  const { sectionRow, sections, width, layout } = findSections(data);
  const transactions: ParsedTx[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  if (sectionRow < 0 || sections.length === 0) {
    return { transactions, warnings: ['No se encontró sección de compras'], skipped };
  }

  // Date and status column offsets relative to section start
  const dateCol   = layout === '2026' ? 3 : 2;
  const statusCol = layout === '2026' ? 4 : 3;
  const txStart   = sectionRow + 2; // skip col-header row

  // Find end: first row where col[section[0].offset] === "Total"
  let txEnd = data.length;
  for (let i = txStart + 1; i < data.length; i++) {
    if (str(data[i]?.[sections[0].offset]) === 'Total') {
      txEnd = i;
      break;
    }
  }

  const fallback = new Date(year, month - 1, 15);

  for (const { label, offset } of sections) {
    const accountName = SECTION_TO_ACCOUNT[label] ?? 'Itaú';
    const paymentMethod = ACCOUNT_TO_METHOD[accountName] ?? 'DEBIT_CARD';

    for (let i = txStart; i < txEnd; i++) {
      const row    = data[i] ?? [];
      const title  = str(row[offset]);
      const amount = num(row[offset + 1]);
      if (!title || !amount || amount < 0) continue;
      // Skip per-section total markers and account-subtotal summary rows that leak
      // in when a shorter section ends before the longest section does
      if (SECTION_SKIP.has(title.trim())) continue;

      const rawDate   = row[offset + dateCol];
      const date      = excelDate(rawDate);
      const rawStatus = str(row[offset + statusCol]);
      const status: 'Pagado' | 'Pendiente' = rawStatus === 'Pagado' ? 'Pagado' : 'Pendiente';

      if (!date) {
        // placeholder like "DD/MM/AAAA" or "00/06/2026" → use fallback silently
        if (typeof rawDate === 'string' && rawDate.startsWith('00/')) {
          skipped++;
          continue;
        }
        warnings.push(`Fecha inválida en "${title}" (${year}-${month}), usando ${fallback.toISOString().split('T')[0]}`);
        transactions.push({ title, amount, date: fallback, status, accountName, paymentMethod, section: label });
      } else {
        transactions.push({ title, amount, date, status, accountName, paymentMethod, section: label });
      }
    }
  }

  return { transactions, warnings, skipped };
}

// ─── Efectivo section (2026 only, below the summary) ─────────

function parseEfectivo(
  data: Row[],
  year: number,
  month: number,
): ParsedTx[] {
  const result: ParsedTx[] = [];
  const fallback = new Date(year, month - 1, 15);

  for (let i = 40; i < data.length - 1; i++) {
    if (str(data[i]?.[0]).startsWith('Efectivo') && str(data[i + 1]?.[0]) === 'Notas') {
      const itemStart = i + 2;
      for (let j = itemStart; j < data.length; j++) {
        const title  = str(data[j]?.[0]);
        const amount = num(data[j]?.[1]);
        if (title === 'Total ' || title === 'Total') break;
        if (!title || !amount || amount < 0) continue;
        result.push({
          title, amount, date: fallback,
          status: 'Pagado',
          accountName: 'Efectivo',
          paymentMethod: 'CASH',
          section: 'Efectivo',
        });
      }
      break;
    }
  }
  return result;
}

// ─── Month name → number ─────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12,
};

function monthFromFilename(filename: string): number {
  const base = path.basename(filename).toLowerCase().replace(/[\s_]/g, '');
  for (const [name, n] of Object.entries(MONTH_MAP)) {
    if (base.startsWith(name)) return n;
  }
  return 0;
}

// ─── Public: scan monthly files ──────────────────────────────

export function scanMonthlyFiles(): string[] {
  const files: string[] = [];
  for (const year of ['2025', '2026']) {
    const dir = path.join(IMPORTS_BASE, year);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      if (!f.endsWith('.xlsx')) continue;
      if (f.toLowerCase().startsWith('copia')) continue;
      files.push(path.join(dir, f));
    }
  }
  return files;
}

// ─── Public: parse one monthly file ──────────────────────────

export function parseMonthly(filePath: string): ParsedMonthly | null {
  let wb: XLSX.WorkBook;
  try { wb = XLSX.readFile(filePath); }
  catch { return null; }

  const ws   = wb.Sheets[wb.SheetNames[0]];
  const data = rows(ws);

  const year  = parseInt(path.dirname(filePath).split(path.sep).pop() ?? '2025');
  const month = monthFromFilename(filePath);
  if (!month) return null;

  // Skip empty templates (cobro = 0 or placeholder)
  const cobroVal = data[1]?.[1];
  if (typeof cobroVal !== 'number' || cobroVal <= 0) return null;

  const layout = detectLayout(data);
  const fallbackDate = excelDate(data[2]?.[1]) ?? new Date(year, month - 1, 1);

  const income       = parseIncome(data, fallbackDate);
  const fixedExpenses = parseFixedExpenses(data, layout);
  const savings      = parseSavings(data);
  const { transactions: txSections, warnings, skipped } = parseSections(data, year, month);
  const txEfectivo   = layout === '2026' ? parseEfectivo(data, year, month) : [];

  return {
    year, month, filePath, format: layout,
    income,
    fixedExpenses,
    savings,
    transactions: [...txSections, ...txEfectivo],
    warnings,
    skipped,
  };
}

// ─── Public: parse Prestamos.xlsx ────────────────────────────

export function parseLoans(): ParsedLoan[] {
  const filePath = path.join(IMPORTS_BASE, 'Préstamos /Prestamos.xlsx');
  let wb: XLSX.WorkBook;
  try { wb = XLSX.readFile(filePath); }
  catch { return []; }

  const loans: ParsedLoan[] = [];

  // ── Hoja "Prestamos" — personal loans ────────────────────
  const wsPrest = wb.Sheets['Prestamos'];
  const dprest  = rows(wsPrest);

  let loanName   = '';
  let loanRows: Row[] = [];

  function flushPersonalLoan() {
    if (!loanName || loanRows.length === 0) return;

    const allPaid  = loanRows.filter(r => str(r[6]) === 'Pagado').length;
    const total    = loanRows.length;

    // Use max installment amount — first installment is often a special lower amount
    const amounts = loanRows
      .map(r => parseFloat(String(r[2] ?? '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')))
      .filter(n => !isNaN(n) && n > 0);
    const instAmt = amounts.length > 0 ? Math.max(...amounts) : 0;
    const origAmt  = parseInt(String(loanRows[0][0] ?? '').replace(/[^0-9]/g, '')) || 0;

    loans.push({
      name:              loanName,
      loanType:          'PERSONAL',
      originalAmount:    origAmt,
      totalInstallments: total,
      installmentAmount: instAmt,
      paidInstallments:  allPaid,
      startDate:         excelDate(loanRows[0][7]),
      endDate:           excelDate(loanRows[total - 1][8]),
      status:            allPaid >= total ? 'PAID' : 'ACTIVE',
      notes:             str(loanRows[0][5]),
    });
    loanRows = [];
  }

  for (const row of dprest) {
    const c0 = str(row[0]);
    if (c0.startsWith('Préstamo') || c0.startsWith('Prestamo')) {
      flushPersonalLoan();
      loanName = c0.replace(/^Préstamo\s+|^Prestamo\s+/i, '').trim();
    } else if (c0 === 'Monto ') {
      // header row, skip
    } else if (typeof row[1] === 'number') {
      loanRows.push(row);
    }
  }
  flushPersonalLoan();

  // ── Hoja "Compras" — purchase installments ───────────────
  const wsComp = wb.Sheets['Compras'];
  const dcomp  = rows(wsComp);

  for (const row of dcomp.slice(1)) {
    const name = str(row[0]);
    if (!name) continue;

    const instAmt  = typeof row[1] === 'number' ? row[1] : 0;
    const totalInst = typeof row[2] === 'number' ? row[2] : 1;
    const origAmt  = instAmt * totalInst;
    const status: 'PAID' | 'ACTIVE' = str(row[5]) === 'Pagado' ? 'PAID' : 'ACTIVE';

    // Derive paidInstallments: Pagado → all; Pendiente → estimate from start date vs Jun 2026
    // Use UTC methods to avoid UTC-3 timezone shifting dates to the previous month
    let paid = status === 'PAID' ? totalInst : 0;
    if (status === 'ACTIVE') {
      const startD = excelDate(row[3]);
      if (startD) {
        const latestYear = 2026, latestMonth = 6;
        const elapsed = (latestYear - startD.getUTCFullYear()) * 12
          + (latestMonth - (startD.getUTCMonth() + 1));
        paid = Math.min(Math.max(elapsed, 1), totalInst - 1);
      } else {
        paid = 1;
      }
    }

    loans.push({
      name,
      loanType:          'PURCHASE',
      originalAmount:    origAmt,
      totalInstallments: totalInst,
      installmentAmount: instAmt,
      paidInstallments:  paid,
      startDate:         excelDate(row[3]),
      endDate:           excelDate(row[4]),
      status,
      notes: '',
    });
  }

  return loans;
}
