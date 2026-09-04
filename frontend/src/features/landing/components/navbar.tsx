import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export function LandingNavbar() {
  return (
    <nav className="bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-white p-[3px]">
            <img src="/logo.png" alt="FinTrack" className="size-full rounded-lg object-contain" />
          </div>
          <span className="font-semibold tracking-tight">FinTrack</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Funciones
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Precio
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Preguntas
          </a>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
