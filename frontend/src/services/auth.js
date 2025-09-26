import api from './api';

// Servicios de autenticación
export const authService = {
  // Login de administrador
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Obtener información del usuario autenticado
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout (solo limpia localStorage por ahora)
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  // Verificar si hay un token válido
  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Obtener el token del localStorage
  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  // Guardar token y datos del usuario
  setAuthData: (token, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
  },

  // Obtener datos del usuario del localStorage
  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },
};
