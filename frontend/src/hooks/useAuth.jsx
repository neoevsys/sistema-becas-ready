import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// Helper functions para manejo de autenticación
export const getToken = () => {
  return localStorage.getItem('admin_token');
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

export const logout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_data');
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.success && response.data.data.accessToken) {
      const { accessToken, admin } = response.data.data;
      
      // Guardar token y datos mínimos del admin
      localStorage.setItem('admin_token', accessToken);
      localStorage.setItem('admin_data', JSON.stringify({
        id: admin.id,
        email: admin.email,
        role: admin.role
      }));
      
      return { success: true, admin };
    } else {
      return { success: false, error: 'Respuesta inválida del servidor' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error al iniciar sesión' 
    };
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token al cargar
    const token = getToken();
    const userData = localStorage.getItem('admin_data');
    
    if (token && userData) {
      setIsAuth(true);
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      setIsAuth(true);
      setUser(result.admin);
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    setUser(null);
  };

  const value = {
    isAuthenticated: isAuth,
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
