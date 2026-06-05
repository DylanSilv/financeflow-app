import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth  = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      navigate('/', { replace: true }); 
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans text-zinc-100">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-500/20">
            F
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-sm text-zinc-400 mt-2">Ingresa a tu cuenta de FinanceFlow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-medium rounded-md px-4 py-2 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          ¿No tienes una cuenta? <a href="/register" className="text-white hover:underline">Regístrate</a>
        </p>
      </div>
    </div>
  );
};