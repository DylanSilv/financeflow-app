import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, Shield, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${name.split(' ')[0]}!`;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const FEATURES = [
  { icon: TrendingUp, title: 'Dashboard en tiempo real',   desc: 'Visualizá tu patrimonio, ingresos y gastos de un vistazo.' },
  { icon: Layers,     title: 'Gestión multi-cuenta',       desc: 'Bancas, efectivo, tarjetas y préstamos en un solo lugar.' },
  { icon: Shield,     title: 'Tus datos, solo tuyos',      desc: 'Cada usuario tiene su espacio financiero completamente aislado.' },
];

export const Register = () => {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [welcome,         setWelcome]         = useState<string | null>(null);

  const setUser  = useAuthStore(s => s.setUser);
  const navigate = useNavigate();

  const validate = (): string => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword)
      return 'Todos los campos son obligatorios.';
    if (name.trim().length < 2)
      return 'El nombre debe tener al menos 2 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'El formato del email no es válido.';
    if (password.length < 8)
      return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword)
      return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email:    email.trim().toLowerCase(),
        password,
        options:  { data: { name: name.trim() } },
      });
      if (signUpError) throw signUpError;

      if (!signUpData.session) {
        setError('Revisá tu correo para confirmar tu cuenta antes de iniciar sesión.');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from('User').select('id, name, email').single();
      if (!profile) throw new Error('No se pudo obtener el perfil de usuario.');

      setUser(profile);
      setWelcome(getGreeting(profile.name));
      await new Promise(r => setTimeout(r, 1600));
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear la cuenta. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <>
    {/* ── Overlay de bienvenida full-screen ── */}
    <AnimatePresence>
      {welcome && (
        <motion.div
          key="welcome-overlay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 text-center bg-[#09090b]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
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
            <p className="text-4xl font-bold text-white tracking-tight">{welcome}</p>
            <p className="text-zinc-500 text-sm">Preparando tu panel financiero...</p>
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

    <div className="min-h-screen flex bg-[#09090b] font-sans text-zinc-100">

      {/* ── Panel izquierdo — marca ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden
                      bg-gradient-to-br from-[#001f35] via-[#002a42] to-[#09090b]">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#003352]/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#00ba8a]/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00ba8a]/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-[3px] shadow-sm shadow-white/10">
            <img src="/logo.png" alt="FinTrack" className="w-full h-full object-contain rounded-lg" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">FinTrack</span>
        </div>

        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
              Empezá hoy<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                sin costo
              </span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Creá tu cuenta en segundos y comenzá a registrar tus finanzas de forma ordenada y clara.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          © {new Date().getFullYear()} FinTrack · Gestión financiera personal
        </p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">

        <AnimatePresence mode="wait">

          {!welcome && (
            <motion.div key="form" className="w-full max-w-sm"
              variants={stagger} initial="hidden" animate="show"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            >
              {/* Logo mobile */}
              <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-8 lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-white p-[3px]">
                  <img src="/logo.png" alt="FinTrack" className="w-full h-full object-contain rounded-md" />
                </div>
                <span className="font-semibold text-white">FinTrack</span>
              </motion.div>

              <motion.div variants={fadeUp} className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">Crear cuenta</h2>
                <p className="text-sm text-zinc-500 mt-1.5">Completá tus datos para empezar</p>
              </motion.div>

              <div className="space-y-5">
                <AnimatePresence>
                  {error && (
                    <motion.div key="error"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="p-3 text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg text-center overflow-hidden"
                    >{error}</motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  <motion.div variants={fadeUp} className="space-y-1.5">
                    <label htmlFor="reg-name" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre completo</label>
                    <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)}
                      required disabled={loading} autoComplete="name" placeholder="Dylan Silva"
                      className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/70 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-1.5">
                    <label htmlFor="reg-email" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                    <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required disabled={loading} autoComplete="email" placeholder="tu@email.com"
                      className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/70 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-1.5">
                    <label htmlFor="reg-password" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Contraseña</label>
                    <div className="relative">
                      <input id="reg-password"
                        type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        required disabled={loading} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
                        className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3 pr-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/70 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 8 && (
                      <p className="text-xs text-amber-500">{password.length}/8 caracteres mínimos</p>
                    )}
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-1.5">
                    <label htmlFor="reg-confirm" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Confirmar contraseña</label>
                    <input id="reg-confirm"
                      type={showPassword ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required disabled={loading} autoComplete="new-password" placeholder="••••••••"
                      className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-600 disabled:opacity-50 ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-700/60 focus:ring-red-500/30 focus:border-red-600/70'
                          : 'border-zinc-700/60 focus:ring-indigo-500/40 focus:border-indigo-500/70'
                      }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
                    )}
                  </motion.div>

                  <motion.button variants={fadeUp} type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="w-full bg-[#00ba8a] hover:bg-[#00c994] text-white font-semibold rounded-xl px-4 py-3 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#00ba8a]/20"
                  >
                    {loading ? (
                      <>
                        <motion.span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full block"
                          animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                        Creando cuenta...
                      </>
                    ) : 'Crear Cuenta'}
                  </motion.button>
                </form>

                <motion.p variants={fadeUp} className="text-center text-sm text-zinc-500 pt-1">
                  ¿Ya tenés cuenta?{' '}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Iniciá sesión
                  </Link>
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};
