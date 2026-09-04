import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandSplash } from '@/components/brand-splash';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

import { AuthLayout, AuthMobileLogo } from './AuthLayout';
import { PasswordInput } from './PasswordInput';

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${saludo}, ${name.split(' ')[0]}!`;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const setUser = useAuthStore(s => s.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      setSessionExpired(true);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile } = await supabase.from('User').select('id, name, email').single();
      if (!profile) throw new Error('No se encontró el perfil de usuario.');

      setUser(profile);
      setWelcome(getGreeting(profile.name));
      await new Promise(r => setTimeout(r, 1600));
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Credenciales incorrectas.');
      setLoading(false);
    }
  };

  return (
    <>
      <BrandSplash
        visible={welcome !== null}
        title={welcome ?? ''}
        subtitle="Cargando tu panel financiero…"
      />

      <AuthLayout>
        <AnimatePresence mode="wait">
          {!welcome && (
            <motion.div
              key="form"
              className="w-full max-w-sm"
              variants={stagger}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            >
              <motion.div variants={fadeUp}>
                <AuthMobileLogo />
              </motion.div>

              <motion.div variants={fadeUp} className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Ingresá tus credenciales para continuar
                </p>
              </motion.div>

              <div className="space-y-5">
                <AnimatePresence>
                  {sessionExpired && (
                    <motion.div
                      key="expired"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm text-amber-500"
                    >
                      Tu sesión expiró. Iniciá sesión nuevamente.
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-destructive/30 bg-destructive/10 text-destructive overflow-hidden rounded-lg border p-3 text-center text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div variants={fadeUp} className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="tu@email.com"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <PasswordInput
                      id="login-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="pt-2">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <motion.span
                            className="block size-4 rounded-full border-2 border-current/30 border-t-current"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                          />
                          Verificando…
                        </>
                      ) : (
                        'Iniciar sesión'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.p
                  variants={fadeUp}
                  className="text-muted-foreground pt-1 text-center text-sm"
                >
                  ¿No tenés cuenta?{' '}
                  <Link to="/register" className="text-foreground font-medium hover:underline">
                    Registrate gratis
                  </Link>
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthLayout>
    </>
  );
};
