import { BrowserRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import AppRoutes from './routes/AppRoutes';
import { setNavigateCallback } from './services/api';
import { useEffect } from 'react';

// Importar estilos de react-toastify
import 'react-toastify/dist/ReactToastify.css';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Componente interno para inyectar navigate
const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Inyectar callback de navegación en el servicio API
    setNavigateCallback(navigate);
  }, [navigate]);

  return (
    <AuthProvider>
      <Layout>
        <AppRoutes />
      </Layout>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container"
      />
    </AuthProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
