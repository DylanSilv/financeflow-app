import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Target, CalendarDays, TrendingDown, Settings, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { name: 'Dashboard',     icon: LayoutDashboard, path: '/' },
  { name: 'Movimientos',   icon: ArrowLeftRight,  path: '/transactions' },
  { name: 'Tarjetas',      icon: CreditCard,      path: '/cards' },
  { name: 'Préstamos',     icon: TrendingDown,    path: '/loans' },
  { name: 'Cuentas Fijas', icon: CalendarDays,    path: '/fixed-expenses' },
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
            initial={{ width: '0%', x: 0 }}
            animate={{ width: '85%' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
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
          className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center"
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
  const location   = useLocation();
  const navigate   = useNavigate();
  const user       = useAuthStore(s => s.user);
  const logout     = useAuthStore(s => s.logout);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const [navigating,  setNavigating]  = useState(false);
  const [prevPath,    setPrevPath]    = useState(location.pathname);

  // Disparar barra de progreso al cambiar de ruta
  useEffect(() => {
    if (location.pathname !== prevPath) {
      setNavigating(true);
      const t = setTimeout(() => setNavigating(false), 450);
      setPrevPath(location.pathname);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 650));
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <NavProgress navigating={navigating} />
      <LogoutOverlay visible={loggingOut} />

      <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="w-64 flex flex-col justify-between p-4 border-r border-zinc-900 bg-[#0a0a0a] h-full select-none"
        >
          <div>
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 px-2 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                F
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">FinanceFlow</span>
            </motion.div>

            {/* Nav */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item, i) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.07 + i * 0.035, duration: 0.2 }}
                    className="relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-bg"
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
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* Footer sidebar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="border-t border-zinc-900 pt-4 space-y-1"
          >
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
          </motion.div>
        </motion.aside>

        {/* Contenido — fade limpio sin movimiento */}
        <main className="flex-1 overflow-y-auto h-full">
          <AnimatePresence mode="sync">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="p-8 max-w-7xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};
