import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Bell, Globe, ChevronRight, LogOut, Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-1">
      {title}
    </p>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  badge,
  onClick,
}: {
  icon:    React.ElementType;
  label:   string;
  value?:  string;
  badge?:  string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors rounded-xl group disabled:cursor-default"
    >
      <div className="w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        {value && <p className="text-xs text-zinc-500 truncate mt-0.5">{value}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {onClick && (
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        )}
      </div>
    </button>
  );
}

function PasswordField({
  id, label, value, onChange, show, onToggle,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-2.5 text-zinc-600 hover:text-zinc-400 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const user     = useAuthStore(s => s.user);
  const logout   = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // Cambio de contraseña
  const [pwOpen,    setPwOpen]    = useState(false);
  const [current,   setCurrent]   = useState('');
  const [next,      setNext]      = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const resetPwForm = () => {
    setCurrent(''); setNext(''); setConfirm('');
    setShowCur(false); setShowNew(false);
    setPwError(null); setPwSuccess(false);
  };

  const handleTogglePw = () => {
    if (pwOpen) resetPwForm();
    setPwOpen(o => !o);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (next.length < 8) { setPwError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (next !== confirm) { setPwError('Las contraseñas nuevas no coinciden.'); return; }

    setPwLoading(true);
    try {
      // Re-autenticar con la contraseña actual antes de cambiarla
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    user?.email ?? '',
        password: current,
      });
      if (signInError) { setPwError('La contraseña actual es incorrecta.'); return; }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      setPwSuccess(true);
      setTimeout(() => { setPwOpen(false); resetPwForm(); }, 1800);
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
    <div className="flex flex-col gap-8 max-w-2xl">

      <motion.header {...fadeUp()}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configuración</h1>
        <p className="text-zinc-400 mt-1">Ajustes de tu cuenta y preferencias.</p>
      </motion.header>

      {/* Perfil */}
      <motion.div {...fadeUp(0.08)}>
        <SectionHeader title="Perfil" />
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">

          {/* Avatar + nombre */}
          <div className="flex items-center gap-4 px-4 py-5 border-b border-zinc-800/60">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-white truncate">{user?.name ?? '—'}</p>
              <p className="text-sm text-zinc-500 truncate">{user?.email ?? '—'}</p>
            </div>
          </div>

          <SettingRow icon={User} label="Nombre" value={user?.name  ?? '—'} />
          <SettingRow icon={Mail} label="Correo" value={user?.email ?? '—'} />

          {/* Contraseña — expandible */}
          <div className="border-t border-zinc-800/40">
            <button
              onClick={handleTogglePw}
              className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-zinc-100">Contraseña</p>
                <p className="text-xs text-zinc-500 mt-0.5">••••••••</p>
              </div>
              <motion.div
                animate={{ rotate: pwOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </motion.div>
            </button>

            <AnimatePresence>
              {pwOpen && (
                <motion.div
                  key="pw-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleChangePassword} className="px-4 pb-5 pt-1 flex flex-col gap-4">
                    <PasswordField
                      id="cur-pw" label="Contraseña actual"
                      value={current} onChange={setCurrent}
                      show={showCur} onToggle={() => setShowCur(s => !s)}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <PasswordField
                        id="new-pw" label="Nueva contraseña"
                        value={next} onChange={setNext}
                        show={showNew} onToggle={() => setShowNew(s => !s)}
                      />
                      <PasswordField
                        id="confirm-pw" label="Confirmar nueva"
                        value={confirm} onChange={setConfirm}
                        show={showNew} onToggle={() => setShowNew(s => !s)}
                      />
                    </div>

                    {next.length > 0 && next.length < 8 && (
                      <p className="text-xs text-yellow-500/80">Mínimo 8 caracteres.</p>
                    )}
                    {pwError   && <p className="text-xs text-red-400">{pwError}</p>}
                    {pwSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-xs text-emerald-400"
                      >
                        <Check className="w-4 h-4" /> Contraseña actualizada correctamente.
                      </motion.div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={pwLoading || pwSuccess || !current || !next || !confirm}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
                      >
                        {pwLoading ? 'Guardando...' : 'Cambiar contraseña'}
                      </button>
                      <button
                        type="button"
                        onClick={handleTogglePw}
                        className="px-4 py-2.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Preferencias */}
      <motion.div {...fadeUp(0.14)}>
        <SectionHeader title="Preferencias" />
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">
          <SettingRow icon={Globe} label="Moneda"         value="Peso uruguayo (UYU)"   badge="Próximamente" />
          <SettingRow icon={Bell}  label="Notificaciones" value="Recordatorios de pago" badge="Próximamente" />
        </div>
      </motion.div>

      {/* Cuenta */}
      <motion.div {...fadeUp(0.2)}>
        <SectionHeader title="Cuenta" />
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-500/5 transition-colors rounded-xl group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400">
              {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Versión */}
      <motion.p {...fadeUp(0.25)} className="text-center text-xs text-zinc-700 pb-4">
        FinTrack v1.0.0 — Uso personal
      </motion.p>

    </div>
  );
}
