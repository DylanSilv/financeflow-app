import {
  ComposedChart, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Wallet,
  RefreshCw, Target, CreditCard, Building2, ArrowRight, Zap,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useDashboardData, AccountBalance, ActiveLoan, SavingsGoal, CategoryExpense } from '@/hooks/useDashboardData';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';

// ─── Formatting ──────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Skeleton ────────────────────────────────────────────────

const Skeleton = ({ h = 'h-8', w = 'w-full' }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} bg-zinc-800/60 animate-pulse rounded-lg`} />
);

// ─── Help Tooltip ────────────────────────────────────────────

function HelpTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex flex-shrink-0"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center cursor-help transition-colors">
        <span className="text-[9px] font-bold text-zinc-400 leading-none">?</span>
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#1c1c1c] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-300 shadow-2xl z-50 pointer-events-none leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-700" />
        </div>
      )}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────

function SectionHeader({ title, subtitle, accent = '#6366f1', tooltip }: { title: string; subtitle?: string; accent?: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {tooltip && <HelpTooltip text={tooltip} />}
        </div>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Animated amount ─────────────────────────────────────────

function AnimatedAmount({ rawValue, format }: { rawValue: number; format: (n: number) => string }) {
  const animated = useAnimatedNumber(rawValue);
  return <>{format(animated)}</>;
}

// ─── Metric Card ─────────────────────────────────────────────

type Trend = 'positive' | 'negative' | 'neutral';

function MetricCard({
  title, amount, rawValue, sub, trend, icon: Icon, loading, accentColor, tooltip,
}: {
  title: string; amount: string; rawValue?: number; sub: string;
  trend: Trend; icon: React.ElementType; loading: boolean; accentColor: string; tooltip?: string;
}) {
  return (
    <motion.div
      className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Accent line top */}
      <div className="absolute top-0 left-5 right-5 h-[2px] rounded-full opacity-60"
        style={{ backgroundColor: accentColor }} />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</span>
          {tooltip && <HelpTooltip text={tooltip} />}
        </div>
        <div className="p-2 rounded-xl" style={{ backgroundColor: accentColor + '18' }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 mt-1">
          <Skeleton h="h-8" w="w-32" />
          <Skeleton h="h-3" w="w-20" />
        </div>
      ) : (
        <>
          <h3 className="text-2xl font-bold tracking-tight text-white leading-none">
            ${rawValue !== undefined
              ? <AnimatedAmount rawValue={rawValue} format={n => Math.abs(n).toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} />
              : amount
            }
          </h3>
          <p className={`text-xs font-medium ${
            trend === 'positive' ? 'text-emerald-500' :
            trend === 'negative' ? 'text-red-400' : 'text-zinc-600'
          }`}>{sub}</p>
        </>
      )}
    </motion.div>
  );
}

// ─── Account Card ────────────────────────────────────────────

function AccountCard({ acc }: { acc: AccountBalance }) {
  const isNeg = acc.balance < 0;
  const typeLabel: Record<string, string> = {
    CHECKING: 'Corriente', SAVINGS: 'Ahorro', CASH: 'Efectivo', BENEFIT: 'Beneficio',
  };
  const isBenefit = acc.type === 'BENEFIT';
  const received  = acc.receivedThisMonth;
  const color     = acc.color ?? '#6366f1';

  return (
    <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '20' }}>
        <Building2 className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{acc.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-zinc-600">{typeLabel[acc.type]}</span>
          {isBenefit && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              received ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {received ? '✓ recibido' : 'pendiente'}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold tabular-nums ${
          isBenefit && received ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-white'
        }`}>
          {isBenefit && acc.monthlyAmount
            ? `$${fmt(acc.monthlyAmount)}`
            : `${isNeg ? '-' : ''}$${fmt(Math.abs(acc.balance))}`
          }
        </p>
        {!isBenefit && (
          <p className={`text-[10px] mt-0.5 ${isNeg ? 'text-red-600' : 'text-zinc-600'}`}>
            {isNeg ? 'negativo' : 'disponible'}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Loan Card ───────────────────────────────────────────────

function LoanCard({ loan }: { loan: ActiveLoan }) {
  const typeLabel = loan.loanType === 'PERSONAL' ? 'Préstamo' : 'Cuotas';
  const remaining = loan.totalInstallments - loan.paidInstallments;
  const pct = loan.progress;
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white truncate block">{loan.name}</span>
          <span className="text-[11px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
            {typeLabel}
          </span>
        </div>
        <span className="text-xs font-semibold text-indigo-400 flex-shrink-0">
          {loan.paidInstallments}/{loan.totalInstallments}
        </span>
      </div>
      <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#10b981' : '#6366f1' }} />
      </div>
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>Resta <span className="text-zinc-300 font-medium">${fmt(loan.remainingAmount)}</span></span>
        <span>{remaining > 0 ? `${remaining} × $${fmt(loan.installmentAmount)}` : 'Última cuota'}</span>
      </div>
    </div>
  );
}

// ─── Savings Card ────────────────────────────────────────────

function SavingsCard({ goal }: { goal: SavingsGoal }) {
  const pct  = Math.min(goal.progress, 100);
  const done = pct >= 100;
  const color = goal.color ?? '#6366f1';
  return (
    <div className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-5 space-y-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-white">{goal.name}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
        }`}>{pct}%</span>
      </div>
      <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">${fmt(goal.currentAmount)} ahorrado</span>
        <span className="text-zinc-600">meta ${fmt(goal.targetAmount)}</span>
      </div>
    </div>
  );
}

// ─── Pie colours ─────────────────────────────────────────────

const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

// ─── Custom tooltip ───────────────────────────────────────────

interface TooltipPayloadEntry { name: string; value: number; color: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-zinc-700/60 rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-zinc-400 font-medium mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: ${fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Greeting ────────────────────────────────────────────────

function useGreeting(name: string) {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${name.split(' ')[0]}`;
}

function useCurrentMonth() {
  return new Date().toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
}

// ─── Main Dashboard ──────────────────────────────────────────

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const greeting    = useGreeting(user?.name ?? '');
  const currentMonth = useCurrentMonth();

  const {
    balanceTotal, balanceCuentas,
    evolucion, prestamos, ahorros,
    loading, error, refetch,
  } = useDashboardData();

  const autoPayRan = useRef(false);
  const [autoPayResult, setAutoPayResult] = useState<{ name: string; amount: number }[] | null>(null);

  useEffect(() => {
    if (autoPayRan.current) return;
    autoPayRan.current = true;
    api.post<{ paid: { id: string; name: string; amount: number }[]; count: number }>('/fixed-expenses/autopay')
      .then(r => { if (r.data.count > 0) { setAutoPayResult(r.data.paid); refetch(); } })
      .catch(() => {});
  }, [refetch]);

  const now = new Date();
  const [catMode,  setCatMode]  = useState<'month' | 'all'>('month');
  const [catYear,  setCatYear]  = useState(now.getFullYear());
  const [catMonth, setCatMonth] = useState(now.getMonth() + 1);
  const [gastosCategorias, setGastosCategorias] = useState<{ categories: CategoryExpense[]; total: number } | null>(null);
  const [catLoading, setCatLoading] = useState(true);

  const isCurrentMonth = catYear === now.getFullYear() && catMonth === now.getMonth() + 1;

  const prevMonth = () => {
    if (catMonth === 1) { setCatYear(y => y - 1); setCatMonth(12); }
    else setCatMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (catMonth === 12) { setCatYear(y => y + 1); setCatMonth(1); }
    else setCatMonth(m => m + 1);
  };

  const catMonthLabel = new Date(catYear, catMonth - 1, 1)
    .toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });

  useEffect(() => {
    setCatLoading(true);
    const params = catMode === 'month' ? `?year=${catYear}&month=${catMonth}` : '';
    api.get(`/dashboard/gastos-categoria${params}`)
      .then(r => setGastosCategorias(r.data))
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, [catMode, catYear, catMonth]);

  const mIncome   = balanceTotal?.monthIncome   ?? 0;
  const mExpenses = balanceTotal?.monthExpenses ?? 0;
  const balance   = balanceTotal?.balance        ?? 0;
  const totalSaved = ahorros ? ahorros.reduce((s, g) => s + g.currentAmount, 0) : 0;

  const chartData = (evolucion ?? []).slice(-15).map(d => ({
    name:     d.label,
    ingresos: Math.round(d.income),
    gastos:   Math.round(d.expenses),
    balance:  Math.round(d.balance),
  }));

  const cats = gastosCategorias?.categories ?? [];
  const pieData = cats.length <= 6 ? cats : [
    ...cats.slice(0, 6),
    { name: 'Otros', color: '#71717a', total: cats.slice(6).reduce((s, c) => s + c.total, 0), percentage: 0 },
  ];

  // Onboarding: usuario sin cuentas
  const isNewUser = !loading && balanceCuentas !== null && balanceCuentas.length === 0;
  if (isNewUser) {
    return (
      <div className="flex flex-col gap-6 max-w-xl mx-auto pt-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            F
          </div>
          <h1 className="text-2xl font-bold text-white">¡Bienvenido a FinTrack!</h1>
          <p className="text-zinc-400 mt-2 text-sm">Tu panel financiero personal. Para empezar, completá estos pasos.</p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { step: 1, label: 'Agregá tus tarjetas', desc: 'Vinculá tus tarjetas de débito y crédito para ver tus saldos.', href: '/cards' },
            { step: 2, label: 'Registrá un movimiento', desc: 'Anotá ingresos y gastos para llevar el control de tu dinero.', href: '/transactions' },
            { step: 3, label: 'Configurá gastos fijos', desc: 'Cargá tus pagos recurrentes (alquiler, servicios, suscripciones).', href: '/fixed-expenses' },
          ].map(({ step, label, desc, href }) => (
            <motion.a key={step} href={href}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: step * 0.1, duration: 0.3 }}
              className="flex items-center gap-4 p-4 bg-[#111111] border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 flex-shrink-0">
                {step}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
            </motion.a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Banner AutoPay ── */}
      {autoPayResult && autoPayResult.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 flex items-start justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-300">
                AutoPay procesó {autoPayResult.length} gasto{autoPayResult.length !== 1 ? 's' : ''} automáticamente
              </p>
              <p className="text-xs text-indigo-500/80 mt-0.5">
                {autoPayResult.map(e => `${e.name} ($${e.amount.toLocaleString('es-UY', { minimumFractionDigits: 0 })})`).join(' · ')}
              </p>
            </div>
          </div>
          <button onClick={() => setAutoPayResult(null)} className="text-indigo-600 hover:text-indigo-400 transition-colors flex-shrink-0 text-xl leading-none">×</button>
        </motion.div>
      )}

      {/* ── Header ── */}
      <header className="flex justify-between items-end">
        <div>
          <p className="text-sm text-zinc-500 mb-1 capitalize">{currentMonth}</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">{greeting}</h1>
          <p className="text-zinc-500 mt-1 text-sm">Acá está el estado actual de tus finanzas.</p>
        </div>
        {error && (
          <button onClick={refetch}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 px-3 py-1.5 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        )}
      </header>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Balance Total" loading={loading} accentColor="#6366f1"
          amount={fmtDec(balance)} rawValue={balance}
          sub={balance >= 0 ? '↑ Patrimonio neto' : '↓ Balance negativo'}
          trend={balance >= 0 ? 'positive' : 'negative'} icon={Wallet}
          tooltip="Suma de los saldos disponibles en todas tus cuentas. Representa tu patrimonio neto en este momento."
        />
        <MetricCard
          title="Ingresos del mes" loading={loading} accentColor="#10b981"
          amount={fmt(mIncome)} rawValue={mIncome}
          sub={mIncome > 0 ? `+$${fmt(mIncome)} ingresado` : 'Sin ingresos este mes'}
          trend={mIncome > 0 ? 'positive' : 'neutral'} icon={ArrowUpRight}
          tooltip="Total de ingresos registrados durante el mes actual. Incluye sueldos, transferencias recibidas y cualquier entrada de dinero."
        />
        <MetricCard
          title="Gastos del mes" loading={loading} accentColor="#f87171"
          amount={fmt(mExpenses)} rawValue={mExpenses}
          sub={mExpenses > 0 ? `-$${fmt(mExpenses)} gastado` : 'Sin gastos este mes'}
          trend={mExpenses > 0 ? 'negative' : 'neutral'} icon={ArrowDownRight}
          tooltip="Total de egresos registrados durante el mes actual. Incluye todos tus gastos, compras y pagos realizados."
        />
        <MetricCard
          title="Total ahorrado" loading={loading} accentColor="#a855f7"
          amount={fmt(totalSaved)} rawValue={totalSaved}
          sub={`${ahorros?.length ?? 0} fondo${(ahorros?.length ?? 0) !== 1 ? 's' : ''} activo${(ahorros?.length ?? 0) !== 1 ? 's' : ''}`}
          trend={totalSaved > 0 ? 'positive' : 'neutral'} icon={Target}
          tooltip="Suma del dinero acumulado en todos tus objetivos de ahorro. No incluye el saldo general de tus cuentas."
        />
      </div>

      {/* ── Evolution Chart ── */}
      <div className="bg-[#111111] border border-zinc-800/60 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <SectionHeader
            title="Evolución Patrimonial"
            subtitle="Ingresos, gastos y balance acumulado por mes"
            accent="#6366f1"
            tooltip="Muestra cómo evolucionaron tus ingresos, gastos y balance mes a mes. Las barras son ingresos y gastos; la línea es tu balance acumulado."
          />
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Gastos</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Balance</span>
          </div>
        </div>

        {loading ? (
          <Skeleton h="h-[280px]" />
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-zinc-600 text-sm">Sin datos de evolución</div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="gastos"   name="Gastos"   fill="#f87171" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Area type="monotone" dataKey="balance" name="Balance" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#gradBalance)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Middle Row: Gastos por Categoría + Préstamos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gastos por Categoría */}
        <div className="bg-[#111111] border border-zinc-800/60 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-5">
            <div>
              <SectionHeader
                title="Gastos por Categoría"
                subtitle={catMode === 'month' ? catMonthLabel : 'Total histórico'}
                accent="#f59e0b"
                tooltip="Distribución de tus gastos según la categoría asignada. Podés ver el mes actual o el historial completo con el selector."
              />
              {!catLoading && gastosCategorias && (
                <p className="text-lg font-bold text-white -mt-2 ml-4">
                  ${gastosCategorias.total.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                  <span className="text-xs font-normal text-zinc-500 ml-1.5">en gastos</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Navegador de mes */}
              {catMode === 'month' && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-1 py-1">
                  <button onClick={prevMonth}
                    className="p-1 text-zinc-500 hover:text-white transition-colors rounded">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-zinc-300 font-medium px-1 min-w-[72px] text-center capitalize">
                    {new Date(catYear, catMonth - 1, 1).toLocaleDateString('es-UY', { month: 'short', year: '2-digit' })}
                  </span>
                  <button onClick={nextMonth} disabled={isCurrentMonth}
                    className="p-1 text-zinc-500 hover:text-white transition-colors rounded disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {/* Toggle Mes / Histórico */}
              <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
                {(['month', 'all'] as const).map(p => (
                  <button key={p} onClick={() => setCatMode(p)}
                    className={`px-3 py-1 rounded-md transition-all font-medium ${
                      catMode === p ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}>
                    {p === 'month' ? 'Mes' : 'Histórico'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {catLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} h="h-5" />)}</div>
          ) : cats.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sin datos de gastos.</p>
          ) : cats[0].name === 'Sin categoría' && cats.length === 1 ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Target className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Sin categorías asignadas</p>
                <p className="text-xs text-zinc-600 mt-1">Total: ${fmt(gastosCategorias?.total ?? 0)}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="total" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={78} paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name}
                          fill={entry.color !== '#71717a' ? entry.color : PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={7}
                      formatter={(v) => <span className="text-[11px] text-zinc-400">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {cats.slice(0, 6).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color !== '#71717a' ? cat.color : PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-zinc-400 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-zinc-500 font-medium">{cat.percentage}%</span>
                    <span className="text-xs text-zinc-400 font-semibold w-20 text-right">${fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compromisos Activos */}
        <div className="bg-[#111111] border border-zinc-800/60 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader title="Compromisos Activos" subtitle="Préstamos y cuotas en curso" accent="#ef4444"
            tooltip="Préstamos personales y compras en cuotas que todavía tenés pendientes. Muestra cuántas cuotas pagaste y cuánto falta."
          />
            {!loading && prestamos && prestamos.length > 0 && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold -mt-4">
                {prestamos.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton h="h-4" w="w-40" /><Skeleton h="h-1.5" /><Skeleton h="h-3" w="w-32" />
                </div>
              ))}
            </div>
          ) : !prestamos || prestamos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] gap-2 text-center">
              <CreditCard className="w-8 h-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">Sin compromisos activos</p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[360px] pr-1">
              {prestamos.filter(l => l.loanType === 'PERSONAL').length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Préstamos</p>
                  <div className="space-y-5">
                    {prestamos.filter(l => l.loanType === 'PERSONAL').map(loan => (
                      <LoanCard key={loan.id} loan={loan} />
                    ))}
                  </div>
                </div>
              )}
              {prestamos.some(l => l.loanType === 'PERSONAL') && prestamos.some(l => l.loanType === 'PURCHASE') && (
                <div className="border-t border-zinc-800/60" />
              )}
              {prestamos.filter(l => l.loanType === 'PURCHASE').length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Compras en cuotas</p>
                  <div className="space-y-5">
                    {prestamos.filter(l => l.loanType === 'PURCHASE').map(loan => (
                      <LoanCard key={loan.id} loan={loan} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Balance por Cuenta ── */}
      <div>
        <SectionHeader title="Balance por Cuenta" subtitle="Saldo actual en cada cuenta" accent="#06b6d4"
          tooltip="Saldo disponible en cada una de tus cuentas, calculado en base a tu saldo inicial más los movimientos registrados."
        />
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} h="h-[68px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(balanceCuentas ?? []).map(acc => <AccountCard key={acc.id} acc={acc} />)}
          </div>
        )}
      </div>

      {/* ── Objetivos de Ahorro ── */}
      {(loading || (ahorros && ahorros.length > 0)) && (
        <div>
          <SectionHeader title="Objetivos de Ahorro" subtitle="Progreso de tus metas" accent="#a855f7"
            tooltip="Tus metas de ahorro y cuánto llevás acumulado en cada una. Cuando llegás al 100% la meta está cumplida."
          />
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <Skeleton key={i} h="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(ahorros ?? []).map(g => <SavingsCard key={g.id} goal={g} />)}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
