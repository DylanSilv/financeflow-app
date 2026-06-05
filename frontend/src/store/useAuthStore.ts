import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

function loadUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem('financeflow_user') ?? 'null');
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('financeflow_token');
  const storedUser  = loadUser();

  return {
    user:            storedUser,
    token:           storedToken,
    isAuthenticated: !!storedToken,

    setAuth: (user, token) => {
      localStorage.setItem('financeflow_token', token);
      localStorage.setItem('financeflow_user',  JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('financeflow_token');
      localStorage.removeItem('financeflow_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});