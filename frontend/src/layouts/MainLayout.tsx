import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Target, CalendarDays, TrendingDown, Settings, LogOut,
  Menu, X, Landmark, Tag, Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Nav structure ────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { name: 'Dashboard',   icon: LayoutDashboard, path: '/' },
      { name: 'Movimientos', icon: ArrowLeftRight,  path: '/transactions' },
    ],
  },
  {
    label: 'Cuentas',
    items: [
      { name: 'Cuentas',   icon: Landmark,     path: '/accounts' },
      { name: 'Tarjetas',  icon: CreditCard,   path: '/cards' },
      { name: 'Ahorros',   icon: Target,       path: '/savings' },
    ],
  },
  {
    label: 'Compromisos',
    items: [
      { name: 'Préstamos',     icon: TrendingDown, path: '/loans' },
      { name: 'Cuentas Fijas', icon: CalendarDays, path: '/fixed-expenses' },
    ],
  },
  {
    label: 'Organización',
    items: [
      { name: 'Categorías', icon: Tag, path: '/categories' },
    ],
  },
];

// ─── Nav Progress ─────────────────────────────────────────────

function NavProgress({ navigating }: { navigating: boolean }) {
  return (
    <AnimatePresence>
      {navigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-indigo-500/10"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Logout Overlay ───────────────────────────────────────────

function useFarewell(name: string) {
  const h = new Date().getHours();
  const momento = h < 12 ? 'día' : h < 20 ? 'tarde' : 'noche';
  const first = name.split(' ')[0];
  return { mensaje: `¡Que tengas un lindo ${momento}!`, nombre: first };
}

function LogoutOverlay({ visible, userName }: { visible: boolean; userName: string }) {
  const { mensaje, nombre } = useFarewell(userName);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] bg-[#09090b] flex flex-col items-center justify-center gap-7 text-center"
        >
          {/* Glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#003352]/30 rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00ba8a]/10 rounded-full blur-[80px]" />
          </div>

          <motion.div
            className="w-24 h-24 rounded-2xl bg-white p-2.5 shadow-2xl shadow-black/40 relative z-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            <img src="/logo.png" alt="FinTrack" className="w-full h-full object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative z-10 space-y-2"
          >
            <p className="text-4xl font-bold text-white tracking-tight">{mensaje}</p>
            <p className="text-zinc-500 text-sm">Hasta la próxima, {nombre}.</p>
          </motion.div>

          <motion.div
            className="flex gap-2 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-[#00ba8a]"
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────

function SidebarContent({
  idPrefix = 'desktop',
  location,
  user,
  loggingOut,
  onLogout,
}: {
  idPrefix?: string;
  location: ReturnType<typeof useLocation>;
  user: { name: string; email: string } | null;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-2 mb-8 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-white p-[3px] flex-shrink-0 shadow shadow-white/10">
          <img src="/logo.png" alt="FinTrack" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-white">FinTrack</span>
          <span className="text-[10px] text-zinc-600 font-medium tracking-wider uppercase">Personal</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-1">
                {group.label}
              </p>
            )}
            {group.items.map(item => {
              const active = isActive(item.path);
              return (
                <div key={item.name} className="relative">
                  {active && (
                    <motion.div
                      layoutId={`${idPrefix}-active-bg`}
                      className="absolute inset-0 bg-[#00ba8a]/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  {active && (
                    <motion.div
                      layoutId={`${idPrefix}-active-bar`}
                      className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#00ba8a] rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Link
                    to={item.path}
                    className={`relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      active ? 'text-[#00ba8a]' : ''
                    }`} />
                    {item.name}
                  </Link>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 pt-4 space-y-1 border-t border-zinc-800/50">
        {/* Settings */}
        <div className="relative">
          {isActive('/settings') && (
            <motion.div
              layoutId={`${idPrefix}-active-bg`}
              className="absolute inset-0 bg-indigo-500/10 rounded-xl"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          {isActive('/settings') && (
            <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-indigo-500 rounded-full" />
          )}
          <Link to="/settings"
            className={`relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive('/settings')
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Settings className={`w-4 h-4 ${isActive('/settings') ? 'text-indigo-400' : ''}`} />
            Configuración
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout} disabled={loggingOut}
          className="w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <motion.div animate={loggingOut ? { rotate: 360 } : {}} transition={{ duration: 0.5 }}>
            <LogOut className="w-4 h-4" />
          </motion.div>
          Cerrar sesión
        </button>

        {/* User card */}
        <div className="mt-2 bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow shadow-indigo-500/20">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name ?? 'Usuario'}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email ?? ''}</p>
          </div>
          <div className="flex-shrink-0">
            <Zap className="w-3 h-3 text-indigo-500/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────

export const MainLayout = () => {
  const location     = useLocation();
  const navigate     = useNavigate();
  const user         = useAuthStore(s => s.user);
  const logout       = useAuthStore(s => s.logout);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const [navigating,  setNavigating]  = useState(false);
  const [prevPath,    setPrevPath]    = useState(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setNavigating(true);
      const t = setTimeout(() => setNavigating(false), 450);
      setPrevPath(location.pathname);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 2200));
    logout();
    navigate('/login', { replace: true });
  };

  const sidebarProps = { location, user, loggingOut, onLogout: handleLogout };

  return (
    <>
      <NavProgress navigating={navigating} />
      <LogoutOverlay visible={loggingOut} userName={user?.name ?? ''} />

      <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden">

        {/* ── Sidebar desktop ── */}
        <aside className="hidden md:flex w-60 flex-shrink-0 flex-col p-4 border-r border-[#003352]/40 bg-[#080f14] h-full select-none">
          <SidebarContent idPrefix="desktop" {...sidebarProps} />
        </aside>

        {/* ── Drawer móvil ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                key="drawer"
                initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col p-4 bg-[#080f14] border-r border-[#003352]/40 select-none md:hidden"
              >
                <button onClick={() => setSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
                <SidebarContent idPrefix="drawer" {...sidebarProps} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Contenido principal ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header móvil */}
          <div className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#003352]/40 bg-[#080f14]">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
              aria-label="Abrir menú">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-[10px]">F</div>
              <span className="text-sm font-semibold text-white">FinTrack</span>
            </div>
          </div>

          {/* Página */}
          <main className="flex-1 overflow-y-auto bg-[#09090b]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="p-4 md:p-8 max-w-7xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};
