import React, { useState } from 'react';
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

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState<string | null>(null);

  const setUser = useAuthStore(s => s.setUser);
  const navigate = useNavigate();

  const validate = (): string => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword)
      return 'Todos los campos son obligatorios.';
    if (name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'El formato del email no es válido.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
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
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ?? 'No se pudo crear la cuenta. Intentá de nuevo.',
      );
      setLoading(false);
    }
  };

  return (
    <>
      <BrandSplash
        visible={welcome !== null}
        title={welcome ?? ''}
        subtitle="Preparando tu panel financiero…"
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
                <h2 className="text-2xl font-bold tracking-tight">Creá tu cuenta</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Empezá a llevar el control de tus finanzas
                </p>
              </motion.div>

              <div className="space-y-5">
                <AnimatePresence>
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

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <motion.div variants={fadeUp} className="space-y-2">
                    <Label htmlFor="register-name">Nombre</Label>
                    <Input
                      id="register-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={loading}
                      placeholder="Tu nombre"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder="tu@email.com"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <PasswordInput
                      id="register-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-2">
                    <Label htmlFor="register-confirm">Confirmar contraseña</Label>
                    <PasswordInput
                      id="register-confirm"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
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
                          Creando cuenta…
                        </>
                      ) : (
                        'Crear cuenta'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.p
                  variants={fadeUp}
                  className="text-muted-foreground pt-1 text-center text-sm"
                >
                  ¿Ya tenés cuenta?{' '}
                  <Link to="/login" className="text-foreground font-medium hover:underline">
                    Iniciá sesión
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
