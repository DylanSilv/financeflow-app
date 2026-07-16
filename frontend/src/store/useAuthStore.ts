import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AppUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));

async function loadProfile() {
  const { data } = await supabase.from('User').select('id, name, email').single();
  return data as AppUser | null;
}

// Inicializa el listener de auth cuando se importa el módulo.
// onAuthStateChange dispara INITIAL_SESSION al arrancar con la sesión actual (o null).
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session) {
    const profile = await loadProfile();
    useAuthStore.setState({ user: profile, isAuthenticated: !!profile, isLoading: false });
  } else {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  }
});
