import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: inyectar token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financeflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ── Response: manejar sesión expirada ────────────────────
let redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if ((status === 401 || status === 403) && !redirectingToLogin) {
      redirectingToLogin = true;
      useAuthStore.getState().logout();
      window.location.replace('/login?expired=1');
    }

    return Promise.reject(error);
  },
);
