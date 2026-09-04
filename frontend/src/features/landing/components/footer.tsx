import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="border-t px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-white p-[2px]">
            <img src="/logo.png" alt="FinTrack" className="size-full rounded-md object-contain" />
          </div>
          <span className="text-sm font-medium">FinTrack</span>
        </div>

        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} FinTrack · Gestión financiera personal
        </p>

        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <Link to="/login" className="hover:text-foreground transition-colors">
            Iniciar sesión
          </Link>
          <Link to="/register" className="hover:text-foreground transition-colors">
            Registrarse
          </Link>
        </div>
      </div>
    </footer>
  );
}
