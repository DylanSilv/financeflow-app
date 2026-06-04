import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Intentar recuperar el token de la sesión anterior
  const storedToken = localStorage.getItem('financeflow_token');
  // En un entorno real, aquí deberíamos validar el token con el backend al cargar

  return {
    user: null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    isLoading: false,

    setAuth: (user, token) => {
      localStorage.setItem('financeflow_token', token);
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('financeflow_token');
      set({ user: null, token: null, isAuthenticated: false });
      // Opcional: window.location.href = '/login';
    },
  };
});