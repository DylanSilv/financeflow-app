import {
  ComposedChart, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp,
  Plus, RefreshCw, Target, CreditCard, Building2,
} from 'lucide-react';
import { useDashboardData, AccountBalance, ActiveLoan, SavingsGoal } from '@/hooks/useDashboardData';

// ─── Formatting ──────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDec = (n: number) =>
  n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Skeleton ────────────────────────────────────────────────

const Skeleton = ({ h = 'h-8', w = 'w-full' }: { h?: string; w?: string }) => (
  <div className={`${h} ${w} bg-zinc-800 animate-pulse rounded-md`} />
);

// ─── Metric Card ─────────────────────────────────────────────

type Trend = 'positive' | 'negative' | 'neutral';

function MetricCard({
  title, amount, sub, trend, icon: Icon, loading,
}: {
  title: string; amount: string; sub: string;
  trend: Trend; icon: React.ElementType; loading: boolean;
}) {
  return (
    <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl flex flex-col gap-3">
      <div className="flex justify-between items-center text-zinc-400">
        <span className="text-sm font-medium">{title}</span>
        <Icon className="w-5 h-5" />
      </div>
      {loading ? (
        <><Skeleton h="h-9" w="w-36" /><Skeleton h="h-4" w="w-24" /></>
      ) : (
        <>
          <h3 className="text-3xl font-semibold tracking-tight text-white">${amount}</h3>
          <p className={`text-sm ${
            trend === 'positive' ? 'text-emerald-500' :
            trend === 'negative' ? 'text-red-400' : 'text-zinc-500'
          }`}>{sub}</p>
        </>
      )}
    </div>
  );
}

// ─── Account Balance Card ────────────────────────────────────

function AccountCard({ acc }: { acc: AccountBalance }) {
  const isNeg = acc.balance < 0;
  const typeLabel: Record<string, string> = {
    CHECKING: 'Cuenta corriente', SAVINGS: 'Ahorro',
    CASH: 'Efectivo', BENEFIT: 'Beneficio',
  };
  const isBenefit = acc.type === 'BENEFIT';
  const received  = acc.receivedThisMonth;

  return (
    <div className={`bg-[#111111] border rounded-xl p-4 flex items-center gap-4 transition-colors ${
      isBenefit && received ? 'border-emerald-500/40' : 'border-zinc-800'
    }`}>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: acc.color ? `${acc.color}22` : '#3f3f4622' }}
      >
        <Building2 className="w-5 h-5" style={{ color: acc.color ?? '#a1a1aa' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{acc.name}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-zinc-500">{typeLabel[acc.type]}</p>
          {isBenefit && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              received
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              {received ? '✓ recibido' : 'pendiente'}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${
          isBenefit && received ? 'text-emerald-400' : isNeg ? 'text-red-400' : 'text-white'
        }`}>
          {isBenefit && acc.monthlyAmount
            ? `$${fmt(acc.monthlyAmount)}`
            : `${isNeg ? '-' : ''}$${fmt(Math.abs(acc.balance))}`
          }
        </p>
      </div>
    </div>
  );
}

// ─── Loan Card ───────────────────────────────────────────────

function LoanCard({ loan }: { loan: ActiveLoan }) {
  const typeLabel = loan.loanType === 'PERSONAL' ? 'Préstamo' : 'Cuotas';
  const remaining = loan.totalInstallments - loan.paidInstallments;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <div>
          <span className="text-sm font-medium text-white">{loan.name}</span>
          <span className="ml-2 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{typeLabel}</span>
        </div>
        <span className="text-xs text-zinc-400">
          {loan.paidInstallments}/{loan.totalInstallments} cuotas
        </span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${loan.progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>Resta ${fmt(loan.remainingAmount)}</span>
        <span>{remaining > 0 ? `${remaining} cuotas × $${fmt(loan.installmentAmount)}` : 'Última cuota'}</span>
      </div>
    </div>
  );
}

// ─── Savings Card ────────────────────────────────────────────

function SavingsCard({ goal }: { goal: SavingsGoal }) {
  const pct = Math.min(goal.progress, 100);
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: goal.color ?? '#6366f1' }}
          />
          <span className="text-sm font-medium text-white">{goal.name}</span>
        </div>
        <span className="text-xs font-semibold text-zinc-400">{pct}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: goal.color ?? '#6366f1' }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>${fmt(goal.currentAmount)} ahorrado</span>
        <span>meta ${fmt(goal.targetAmount)}</span>
      </div>
    </div>
  );
}

// ─── Pie colours ─────────────────────────────────────────────

const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

// ─── Custom tooltip ───────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c1c1e] border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: ${fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────

export default function Dashboard() {
  const {
    balanceTotal, balanceCuentas, gastosCategorias,
    evolucion, prestamos, ahorros,
    loading, error, refetch,
  } = useDashboardData();

  // Current-month metrics come from balanceTotal
  const mIncome   = balanceTotal?.monthIncome   ?? 0;
  const mExpenses = balanceTotal?.monthExpenses ?? 0;
  const balance   = balanceTotal?.balance        ?? 0;

  // Total ahorrado (suma de currentAmount de todas las metas)
  const totalSaved = ahorros ? ahorros.reduce((s, g) => s + g.currentAmount, 0) : 0;

  // Evolution data for chart (last 15 months)
  const chartData = (evolucion ?? []).slice(-15).map(d => ({
    name:     d.label,
    ingresos: Math.round(d.income),
    gastos:   Math.round(d.expenses),
    balance:  Math.round(d.balance),
  }));

  // Category data for pie (top 6 + others)
  const cats = gastosCategorias?.categories ?? [];
  const pieData = cats.length <= 6 ? cats : [
    ...cats.slice(0, 6),
    { name: 'Otros', color: '#71717a', total: cats.slice(6).reduce((s, c) => s + c.total, 0), percentage: 0 },
  ];

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ── */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Resumen Financiero</h1>
          <p className="text-zinc-400 mt-1">Estado actualizado de tus cuentas y finanzas.</p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <button
              onClick={refetch}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar
            </button>
          )}
        </div>
      </header>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Balance Total" loading={loading}
          amount={fmtDec(balance)}
          sub={balance >= 0 ? 'Patrimonio neto' : 'Balance negativo'}
          trend={balance >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
        />
        <MetricCard
          title="Ingresos (mes)" loading={loading}
          amount={fmt(mIncome)}
          sub={mIncome > 0 ? `+$${fmt(mIncome)} este mes` : 'Sin ingresos este mes'}
          trend={mIncome > 0 ? 'positive' : 'neutral'}
          icon={ArrowUpRight}
        />
        <MetricCard
          title="Gastos (mes)" loading={loading}
          amount={fmt(mExpenses)}
          sub={`-$${fmt(mExpenses)} este mes`}
          trend={mExpenses > 0 ? 'negative' : 'neutral'}
          icon={ArrowDownRight}
        />
        <MetricCard
          title="Ahorros" loading={loading}
          amount={fmt(totalSaved)}
          sub={`${ahorros?.length ?? 0} fondos activos`}
          trend={totalSaved > 0 ? 'positive' : 'neutral'}
          icon={Target}
        />
      </div>

      {/* ── Evolution Chart ── */}
      <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-white">Evolución Patrimonial</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Ingresos, gastos y balance acumulado por mes</p>
          </div>
          <TrendingUp className="w-5 h-5 text-zinc-500" />
        </div>

        {loading ? (
          <Skeleton h="h-[280px]" />
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-zinc-600">Sin datos</div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false}
                  interval={2} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="ingresos" fill="#10b981" opacity={0.6} radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Bar dataKey="gastos"   fill="#ef4444"  opacity={0.6} radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2}
                  fill="url(#gradBalance)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Middle Row: Gastos por Categoría + Préstamos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gastos por Categoría */}
        <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-1">Gastos por Categoría</h3>
          <p className="text-xs text-zinc-500 mb-5">Distribución del total histórico</p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} h="h-6" />)}
            </div>
          ) : cats.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sin datos de gastos.</p>
          ) : cats[0].name === 'Sin categoría' && cats.length === 1 ? (
            // No categories assigned yet — show informative state
            <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Target className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-medium">Sin categorías asignadas</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Total histórico: ${fmt(gastosCategorias?.total ?? 0)}
                </p>
                <p className="text-xs text-zinc-700 mt-2">
                  Asigná categorías a tus transacciones para ver el desglose.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="total" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name}
                          fill={entry.color !== '#71717a' ? entry.color : PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span className="text-xs text-zinc-400">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {cats.slice(0, 6).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color !== '#71717a' ? cat.color : PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-zinc-400 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-zinc-300 font-medium">{cat.percentage}%</span>
                    <span className="text-xs text-zinc-500 w-20 text-right">${fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Préstamos Activos — divididos por tipo */}
        <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-lg font-medium text-white">Compromisos Activos</h3>
            {!loading && prestamos && (
              <span className="text-xs bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full">
                {prestamos.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
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
              {/* Préstamos personales */}
              {prestamos.filter(l => l.loanType === 'PERSONAL').length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    Préstamos
                  </p>
                  <div className="space-y-5">
                    {prestamos.filter(l => l.loanType === 'PERSONAL').map(loan => (
                      <LoanCard key={loan.id} loan={loan} />
                    ))}
                  </div>
                </div>
              )}
              {/* Divider */}
              {prestamos.some(l => l.loanType === 'PERSONAL') && prestamos.some(l => l.loanType === 'PURCHASE') && (
                <div className="border-t border-zinc-800/60" />
              )}
              {/* Compras a crédito */}
              {prestamos.filter(l => l.loanType === 'PURCHASE').length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    Compras a crédito
                  </p>
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
        <h3 className="text-base font-medium text-white mb-3">Balance por Cuenta</h3>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} h="h-20" />)}
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
          <h3 className="text-base font-medium text-white mb-3">Objetivos de Ahorro</h3>
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
