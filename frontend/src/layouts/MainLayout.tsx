import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Target,
  CalendarDays,
  TrendingDown,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Movimientos', icon: ArrowLeftRight, path: '/transactions' },
  { name: 'Tarjetas',      icon: CreditCard,   path: '/cards' },
  { name: 'Préstamos',     icon: TrendingDown, path: '/loans' },
  { name: 'Cuentas Fijas', icon: CalendarDays, path: '/fixed-expenses' },
  { name: 'Ahorros', icon: Target, path: '/savings' },
];

export const MainLayout = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar - Estilo Linear/Stripe */}
      <aside className="w-64 flex flex-col justify-between p-4 border-r border-zinc-900 bg-[#0a0a0a] h-full select-none">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
              F
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">FinanceFlow</span>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'text-white bg-zinc-900 border border-zinc-800' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar */}
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
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
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
      </aside>

      {/* Área de Contenido Principal Dinámico */}
      <main className="flex-1 overflow-y-auto h-full">
        <motion.div 
          key={location.pathname} // Forzar animación al cambiar de ruta
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-8 max-w-7xl mx-auto"
        >
          {/* Aquí React Router inyectará el Dashboard o las Tarjetas según la URL */}
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};