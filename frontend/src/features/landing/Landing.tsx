import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, Shield, Layers, RefreshCw, CreditCard, Target,
  ArrowRight, CheckCircle2, ChevronRight,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: TrendingUp,
    color: '#6366f1',
    title: 'Dashboard en tiempo real',
    desc:  'Visualizá tu balance total, ingresos, gastos y patrimonio actualizado al instante.',
  },
  {
    icon: Layers,
    color: '#10b981',
    title: 'Multi-cuenta y tarjetas',
    desc:  'Bancas, efectivo, tarjetas de débito y crédito, todo centralizado en un solo lugar.',
  },
  {
    icon: RefreshCw,
    color: '#f59e0b',
    title: 'AutoPay de gastos fijos',
    desc:  'Configurá tus pagos recurrentes y dejá que la app los registre sola cada mes.',
  },
  {
    icon: CreditCard,
    color: '#ef4444',
    title: 'Seguimiento de préstamos',
    desc:  'Controlá cuotas, montos restantes y progreso de cada compromiso financiero.',
  },
  {
    icon: Target,
    color: '#a855f7',
    title: 'Metas de ahorro',
    desc:  'Definí objetivos con fechas y seguí tu progreso mes a mes.',
  },
  {
    icon: Shield,
    color: '#06b6d4',
    title: 'Tus datos, solo tuyos',
    desc:  'Cada usuario tiene su propio espacio financiero, completamente aislado y seguro.',
  },
];

const CHECKS = [
  'Sin tarjeta de crédito requerida',
  'Configuración en menos de 5 minutos',
  'Acceso desde cualquier dispositivo',
];

// ─── Mock preview cards ───────────────────────────────────────

function MockDashboard() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow detrás */}
      <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-3xl -z-10 scale-95" />

      <div className="bg-[#0f0f0f] border border-zinc-800/60 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header simulado */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60 bg-[#0a0a0a]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
          </div>
          <div className="flex-1 mx-4 h-5 bg-zinc-800 rounded-md" />
        </div>

        <div className="p-5 space-y-4">
          {/* Greeting simulado */}
          <div>
            <div className="h-3 w-24 bg-zinc-800 rounded-sm mb-2" />
            <div className="h-6 w-48 bg-zinc-700 rounded-sm" />
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { accent: '#6366f1', val: '$132.578', label: 'Balance' },
              { accent: '#10b981', val: '$121.586', label: 'Ingresos' },
              { accent: '#f87171', val: '$21.377',  label: 'Gastos' },
              { accent: '#a855f7', val: '$12.300',  label: 'Ahorros' },
            ].map(({ accent, val, label }) => (
              <div key={label} className="bg-[#171717] border border-zinc-800/50 rounded-xl p-3 relative overflow-hidden">
                <div className="absolute top-0 left-3 right-3 h-[2px] rounded-full opacity-70"
                  style={{ backgroundColor: accent }} />
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">{label}</div>
                <div className="text-sm font-bold text-white mt-1">{val}</div>
              </div>
            ))}
          </div>

          {/* Chart simulado */}
          <div className="bg-[#171717] border border-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-indigo-500 rounded-full" />
              <div className="h-3 w-36 bg-zinc-700 rounded-sm" />
            </div>
            <div className="h-24 flex items-end gap-1.5">
              {[20,35,28,42,38,55,45,62,48,70,58,80,65,120,95].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                  <div className="w-full rounded-sm bg-red-400/50"
                    style={{ height: `${h * 0.25}px` }} />
                  <div className="w-full rounded-sm bg-emerald-500/60"
                    style={{ height: `${h * 0.5}px` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Landing ─────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white p-[3px] shadow-sm shadow-white/10">
              <img src="/logo.png" alt="FinTrack" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="font-semibold text-white tracking-tight">FinTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
              Iniciar sesión
            </Link>
            <Link to="/register"
              className="text-sm font-semibold bg-[#00ba8a] hover:bg-[#00c994] text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-[#00ba8a]/20 flex items-center gap-1.5">
              Crear cuenta <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#003352]/30 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-[#00ba8a]/8 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Gestión financiera personal
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
            >
              Tomá el control de{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                tus finanzas
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-xl mx-auto"
            >
              Registrá tus ingresos y gastos, seguí tus préstamos, gestioná tus cuentas
              y visualizá tu patrimonio en tiempo real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
            >
              <Link to="/register"
                className="flex items-center justify-center gap-2 bg-[#00ba8a] hover:bg-[#00c994] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-xl shadow-[#00ba8a]/25 text-sm">
                Crear cuenta gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login"
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                Ya tengo cuenta
              </Link>
            </motion.div>

            {/* Check list */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-x-6 gap-y-2"
            >
              {CHECKS.map(c => (
                <span key={c} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                  {c}
                </span>
              ))}
            </motion.div>
          </div>

          {/* App preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16"
          >
            <MockDashboard />
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
              Todo lo que necesitás en un lugar
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
              Diseñado para ser simple y completo. Sin hojas de cálculo, sin complicaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-6 hover:border-zinc-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: color + '18' }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6 border-t border-zinc-800/40">
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-indigo-600/8 rounded-3xl blur-3xl -z-10" />
          <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
            Empezá hoy, es gratis
          </h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
            Creá tu cuenta en segundos y empezá a tener claridad sobre tus finanzas personales.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-[#00ba8a] hover:bg-[#00c994] text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-xl shadow-[#00ba8a]/25 text-sm">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white p-[2px]">
              <img src="/logo.png" alt="FinTrack" className="w-full h-full object-contain rounded-md" />
            </div>
            <span className="text-sm font-medium text-zinc-400">FinTrack</span>
          </div>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} FinTrack · Gestión financiera personal
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <Link to="/login" className="hover:text-zinc-400 transition-colors">Iniciar sesión</Link>
            <Link to="/register" className="hover:text-zinc-400 transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
