import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/Loader';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy loading de páginas
const Landing = lazy(() => import('../pages/Landing'));
const ScholarshipDetail = lazy(() => import('../pages/ScholarshipDetail'));
const ApplicationForm = lazy(() => import('../pages/ApplicationForm'));
const AdminLogin = lazy(() => import('../pages/AdminLogin'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" />
        </div>
      }
    >
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/scholarships/:slug" element={<ScholarshipDetail />} />
        <Route path="/apply/:slug" element={<ApplicationForm />} />

        {/* Rutas de admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
