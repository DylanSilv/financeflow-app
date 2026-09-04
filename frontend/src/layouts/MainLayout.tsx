import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BrandSplash } from '@/components/brand-splash';
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

// ─── Despedida ────────────────────────────────────────────────

function useFarewell(name: string) {
  const h = new Date().getHours();
  const momento = h < 12 ? 'día' : h < 20 ? 'tarde' : 'noche';
  return {
    mensaje: `¡Que tengas un lindo ${momento}!`,
    nombre: name.split(' ')[0],
  };
}

// ─── Main Layout ──────────────────────────────────────────────

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const farewell = useFarewell(user?.name ?? '');

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 2200));
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <NavProgress pathname={location.pathname} />
      <BrandSplash
        visible={loggingOut}
        title={farewell.mensaje}
        subtitle={`Hasta la próxima, ${farewell.nombre}.`}
      />

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
