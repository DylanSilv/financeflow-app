import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Target, CalendarDays, TrendingDown, Settings, LogOut, Menu, X, Landmark, Tag,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { name: 'Dashboard',     icon: LayoutDashboard, path: '/' },
  { name: 'Movimientos',   icon: ArrowLeftRight,  path: '/transactions' },
  { name: 'Cuentas',       icon: Landmark,        path: '/accounts' },
  { name: 'Tarjetas',      icon: CreditCard,      path: '/cards' },
  { name: 'Préstamos',     icon: TrendingDown,    path: '/loans' },
  { name: 'Cuentas Fijas', icon: CalendarDays,    path: '/fixed-expenses' },
  { name: 'Categorías',    icon: Tag,             path: '/categories' },
  { name: 'Ahorros',       icon: Target,          path: '/savings' },
];

// ─── Barra de progreso de navegación ─────────────────────────

function NavProgress({ navigating }: { navigating: boolean }) {
  return (
    <AnimatePresence>
      {navigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-indigo-500/20"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
        >
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Overlay de logout ────────────────────────────────────────

function LogoutOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-[#0a0a0a] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
              F
            </div>
            <p className="text-zinc-500 text-sm">Cerrando sesión...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MainLayout = () => {
  const location     = useLocation();
  const navigate     = useNavigate();
  const user         = useAuthStore(s => s.user);
  const logout       = useAuthStore(s => s.logout);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const [navigating,  setNavigating]  = useState(false);
  const [prevPath,    setPrevPath]    = useState(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Barra de progreso al cambiar de ruta
  useEffect(() => {
    if (location.pathname !== prevPath) {
      setNavigating(true);
      const t = setTimeout(() => setNavigating(false), 450);
      setPrevPath(location.pathname);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  // Cerrar sidebar al navegar (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 650));
    logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = ({ idPrefix = 'desktop' }: { idPrefix?: string }) => (
    <>
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0">
            F
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">FinanceFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.name} className="relative">
                {isActive && (
                  <motion.div
                    layoutId={`${idPrefix}-active-nav-bg`}
                    className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Link
                  to={item.path}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : ''}`} />
                  {item.name}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-900 pt-4 space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900/40 transition-colors"
        >
          <motion.div animate={loggingOut ? { rotate: 360 } : {}} transition={{ duration: 0.5 }}>
            <LogOut className="w-4 h-4" />
          </motion.div>
          Cerrar sesión
        </button>

        <div className="mt-2 flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-white truncate">{user?.name ?? 'Usuario'}</span>
            <span className="text-xs text-zinc-500 truncate">{user?.email ?? ''}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <NavProgress navigating={navigating} />
      <LogoutOverlay visible={loggingOut} />

      <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">

        {/* ── Sidebar desktop (siempre visible ≥ md) ── */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col justify-between p-4 border-r border-zinc-900 bg-[#0a0a0a] h-full select-none">
          <SidebarContent />
        </aside>

        {/* ── Drawer móvil (< md) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/70 z-40 md:hidden"
              />

              {/* Panel */}
              <motion.aside
                key="drawer"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between p-4 bg-[#0a0a0a] border-r border-zinc-900 select-none md:hidden"
              >
                {/* Botón cerrar */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <SidebarContent idPrefix="drawer" />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Contenido principal ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header móvil con hamburger */}
          <div className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-900 bg-[#0a0a0a]">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-900"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-[10px]">F</div>
              <span className="text-sm font-semibold text-white">FinanceFlow</span>
            </div>
          </div>

          {/* Página */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } }}
                exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
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
