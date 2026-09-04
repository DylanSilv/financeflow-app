import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PageHeader } from '@/components/page-header';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-muted-foreground mb-2 px-1 text-[11px] font-semibold tracking-widest uppercase">
      {title}
    </p>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  badge,
  children,
  onClick,
  chevronOpen,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  badge?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  chevronOpen?: boolean;
}) {
  const content = (
    <>
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium">{label}</p>
        {value && <p className="text-muted-foreground mt-0.5 truncate text-xs">{value}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && <Badge variant="secondary">{badge}</Badge>}
        {children}
        {onClick && (
          <motion.div animate={{ rotate: chevronOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="text-muted-foreground size-4" />
          </motion.div>
        )}
      </div>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-4 px-4 py-3.5">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/40 flex w-full items-center gap-4 px-4 py-3.5 transition-colors"
    >
      {content}
    </button>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  // Cambio de contraseña
  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const resetPwForm = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setShowCur(false);
    setShowNew(false);
    setPwError(null);
    setPwSuccess(false);
  };

  const handleTogglePw = () => {
    if (pwOpen) resetPwForm();
    setPwOpen(o => !o);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (next.length < 8) return setPwError('La nueva contraseña debe tener al menos 8 caracteres.');
    if (next !== confirm) return setPwError('Las contraseñas nuevas no coinciden.');

    setPwLoading(true);
    try {
      // Re-autenticar con la contraseña actual antes de cambiarla.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: current,
      });
      if (signInError) {
        setPwError('La contraseña actual es incorrecta.');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      setPwSuccess(true);
      setTimeout(() => {
        setPwOpen(false);
        resetPwForm();
      }, 1800);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setPwError(msg ?? 'No se pudo cambiar la contraseña.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise(r => setTimeout(r, 500));
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <PageHeader title="Configuración" description="Ajustes de tu cuenta y preferencias." />

      <motion.section {...fadeUp(0.08)}>
        <SectionHeader title="Perfil" />
        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex items-center gap-4 border-b px-4 py-5">
            <div className="bg-primary text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{user?.name ?? '—'}</p>
              <p className="text-muted-foreground truncate text-sm">{user?.email ?? '—'}</p>
            </div>
          </div>

          <SettingRow icon={User} label="Nombre" value={user?.name ?? '—'} />
          <SettingRow icon={Mail} label="Correo" value={user?.email ?? '—'} />

          <div className="border-t">
            <SettingRow
              icon={Shield}
              label="Contraseña"
              value="••••••••"
              onClick={handleTogglePw}
              chevronOpen={pwOpen}
            />

            <AnimatePresence>
              {pwOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handleChangePassword}
                    className="flex flex-col gap-4 px-4 pt-1 pb-5"
                  >
                    <PasswordField
                      id="cur-pw"
                      label="Contraseña actual"
                      value={current}
                      onChange={setCurrent}
                      show={showCur}
                      onToggle={() => setShowCur(s => !s)}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <PasswordField
                        id="new-pw"
                        label="Nueva contraseña"
                        value={next}
                        onChange={setNext}
                        show={showNew}
                        onToggle={() => setShowNew(s => !s)}
                      />
                      <PasswordField
                        id="confirm-pw"
                        label="Confirmar nueva"
                        value={confirm}
                        onChange={setConfirm}
                        show={showNew}
                        onToggle={() => setShowNew(s => !s)}
                      />
                    </div>

                    {next.length > 0 && next.length < 8 && (
                      <p className="text-xs text-amber-500">Mínimo 8 caracteres.</p>
                    )}
                    {pwError && <p className="text-destructive text-xs">{pwError}</p>}
                    {pwSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-success flex items-center gap-2 text-xs"
                      >
                        <Check className="size-4" /> Contraseña actualizada correctamente.
                      </motion.div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={pwLoading || pwSuccess || !current || !next || !confirm}
                      >
                        {pwLoading ? 'Guardando…' : 'Cambiar contraseña'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleTogglePw}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.section>

      <motion.section {...fadeUp(0.14)}>
        <SectionHeader title="Preferencias" />
        <Card className="gap-0 overflow-hidden py-0">
          <SettingRow icon={Palette} label="Apariencia" value="Tema de la aplicación">
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={v => v && setTheme(v as 'light' | 'dark' | 'system')}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="light" aria-label="Modo claro">
                <Sun className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Modo oscuro">
                <Moon className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="Según el sistema">
                <Monitor className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </SettingRow>

          <SettingRow
            icon={Globe}
            label="Moneda"
            value="Peso uruguayo (UYU)"
            badge="Próximamente"
          />
          <SettingRow
            icon={Bell}
            label="Notificaciones"
            value="Recordatorios de pago"
            badge="Próximamente"
          />
        </Card>
      </motion.section>

      <motion.section {...fadeUp(0.2)}>
        <SectionHeader title="Cuenta" />
        <Card className="gap-0 overflow-hidden py-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={cn(
              'hover:bg-destructive/5 flex w-full items-center gap-4 px-4 py-3.5 transition-colors',
              loggingOut && 'opacity-60',
            )}
          >
            <div className="bg-destructive/10 flex size-9 shrink-0 items-center justify-center rounded-xl">
              <LogOut className="text-destructive size-4" />
            </div>
            <span className="text-destructive text-sm font-medium">
              {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </span>
          </button>
        </Card>
      </motion.section>

      <p className="text-muted-foreground pb-4 text-center text-xs">
        FinTrack v1.0.0 — Uso personal
      </p>
    </div>
  );
}
