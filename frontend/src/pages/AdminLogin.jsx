import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth, isAuthenticated } from '../hooks/useAuth';
import Loader from '../components/Loader';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email inválido')
    .required('Email es requerido'),
  password: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Contraseña es requerida')
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        toast.success('¡Bienvenido al panel de administración!');
        navigate('/admin', { replace: true });
      } else {
        toast.error(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      toast.error('Error interno, intenta nuevamente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-2xl font-bold text-secondary-900">Sistema de Becas</span>
          </Link>
          <h2 className="text-3xl font-bold text-secondary-900">
            Acceso de Administrador
          </h2>
          <p className="mt-2 text-secondary-600">
            Inicia sesión para gestionar becas y postulaciones
          </p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="input-field"
                    placeholder="admin@becas.com"
                    disabled={isLoading}
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                    Contraseña
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="input-field"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center"
                    disabled={isSubmitting || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Credentials hint */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Credenciales de prueba:</h3>
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> admin@becas.com<br />
              <strong>Contraseña:</strong> Admin123!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
