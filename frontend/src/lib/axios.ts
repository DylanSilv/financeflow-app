import axios from 'axios';

// En un entorno de producción, esto vendría de variables de entorno (.env)
const API_URL = 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true // Descomentar cuando implementemos cookies/sesiones cruzadas si es necesario
});

// Interceptor para inyectar el token en el futuro
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financeflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});