import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Nav Progress ─────────────────────────────────────────────

/**
 * Barra de progreso de navegación. Se reinicia con `key`, así que la animación
 * es puramente CSS y no necesita estado ni efectos.
 */
function NavProgress({ pathname }: { pathname: string }) {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 h-[2px]">
      <div
        key={pathname}
        className="from-primary to-primary/40 animate-nav-progress h-full rounded-full bg-gradient-to-r"
      />
    </div>
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
          className="bg-background fixed inset-0 z-60 flex flex-col items-center justify-center gap-7 text-center"
        >
          {/* Glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-primary/10 absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
            <div className="bg-success/10 absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]" />
          </div>

          <motion.div
            className="relative z-10 h-24 w-24 rounded-2xl bg-white p-2.5 shadow-2xl shadow-black/40"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            <img src="/logo.png" alt="FinTrack" className="h-full w-full object-contain" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative z-10 space-y-2"
          >
            <p className="text-4xl font-bold tracking-tight">{mensaje}</p>
            <p className="text-muted-foreground text-sm">Hasta la próxima, {nombre}.</p>
          </motion.div>

          <motion.div
            className="relative z-10 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="bg-success h-2 w-2 rounded-full"
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

// ─── Main Layout ──────────────────────────────────────────────

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 2200));
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <NavProgress pathname={location.pathname} />
      <LogoutOverlay visible={loggingOut} userName={user?.name ?? ''} />

      <SidebarProvider
        style={
          {
            '--sidebar-width': '16rem',
            '--sidebar-width-icon': '3rem',
            '--header-height': 'calc(var(--spacing) * 14)',
          } as React.CSSProperties
        }
      >
        <AppSidebar user={user} onLogout={handleLogout} loggingOut={loggingOut} />
        <SidebarInset>
          <SiteHeader />
          <main className="@container/main flex flex-1 flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};
