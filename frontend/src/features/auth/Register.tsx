import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${name.split(' ')[0]}!`;
}

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const Register = () => {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [welcome,         setWelcome]         = useState<string | null>(null);

  const setAuth  = useAuthStore(s => s.setAuth);
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
      const { data } = await api.post('/auth/register', {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password,
      });
      setAuth(data.user, data.token);
      setWelcome(getGreeting(data.user.name));
      await new Promise(r => setTimeout(r, 1600));
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'No se pudo crear la cuenta. Intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans text-zinc-100 overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="wait">

        {/* Pantalla de bienvenida */}
        {welcome ? (
          <motion.div
            key="welcome"
            className="flex flex-col items-center gap-6 text-center relative z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-3xl shadow-2xl shadow-indigo-500/30"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
            >
              F
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="text-3xl font-semibold text-white tracking-tight">{welcome}</p>
              <p className="text-zinc-500 mt-2 text-sm">Preparando tu panel financiero...</p>
            </motion.div>
            <motion.div className="flex gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {[0, 1, 2].map(i => (
                <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>

        ) : (

          /* Formulario */
          <motion.div
            key="form"
            className="w-full max-w-sm relative z-10"
            variants={stagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          >
            <motion.div variants={fadeUp} className="text-center mb-8">
              <motion.div
                className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-500/30"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
              >
                F
              </motion.div>
              <h2 className="text-2xl font-semibold tracking-tight">Crear cuenta</h2>
              <p className="text-sm text-zinc-400 mt-2">Empezá a gestionar tus finanzas</p>
            </motion.div>

            <div className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md text-center overflow-hidden"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                <motion.div variants={fadeUp} className="space-y-2">
                  <label htmlFor="reg-name" className="text-sm font-medium text-zinc-300">Nombre completo</label>
                  <input
                    id="reg-name"
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    required disabled={loading} autoComplete="name"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600 disabled:opacity-60"
                    placeholder="Dylan Silva"
                  />
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-2">
                  <label htmlFor="reg-email" className="text-sm font-medium text-zinc-300">Email</label>
                  <input
                    id="reg-email"
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required disabled={loading} autoComplete="email"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600 disabled:opacity-60"
                    placeholder="tu@email.com"
                  />
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-2">
                  <label htmlFor="reg-password" className="text-sm font-medium text-zinc-300">Contraseña</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      required disabled={loading} autoComplete="new-password"
                      className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600 disabled:opacity-60"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-amber-500">{password.length}/8 caracteres mínimos</p>
                  )}
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-2">
                  <label htmlFor="reg-confirm" className="text-sm font-medium text-zinc-300">Confirmar contraseña</label>
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    required disabled={loading} autoComplete="new-password"
                    className={`w-full bg-[#111111] border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-600 disabled:opacity-60 ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-800 focus:ring-red-500/30 focus:border-red-600'
                        : 'border-zinc-800 focus:ring-indigo-500/50 focus:border-indigo-500'
                    }`}
                    placeholder="••••••••"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
                  )}
                </motion.div>

                <motion.button
                  variants={fadeUp}
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white text-black font-medium rounded-md px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <motion.span
                        className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full block"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                      />
                      Creando cuenta...
                    </>
                  ) : 'Crear Cuenta'}
                </motion.button>
              </form>

              <motion.p variants={fadeUp} className="text-center text-sm text-zinc-500 pt-2">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="text-white hover:underline">Iniciá sesión</Link>
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
