import axios from 'axios';

// Variable para callback de navegación (será inyectada desde App.jsx)
let navigateCallback = null;

export const setNavigateCallback = (callback) => {
  navigateCallback = callback;
};

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token solo para rutas admin
    if (config.url.startsWith('/admin')) {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo de errores 401 en rutas admin
    if (error.response?.status === 401 && error.config?.url?.startsWith('/admin')) {
      // Limpiar token y datos del admin
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      
      // Navegar a login si está disponible el callback
      if (navigateCallback) {
        navigateCallback('/admin/login');
      }
      
      console.warn('Token admin inválido o expirado, redirigiendo al login');
    }
    
    return Promise.reject(error);
  }
);

export default api;
