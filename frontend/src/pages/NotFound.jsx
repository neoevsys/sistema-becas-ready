import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-primary-600 mb-2">404</h1>
        </div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">
          Página no encontrada
        </h2>
        <p className="text-secondary-600 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Link 
            to="/" 
            className="btn-primary w-full block"
          >
            Volver al Inicio
          </Link>
          <Link 
            to="/scholarships" 
            className="btn-outline w-full block"
          >
            Ver Becas Disponibles
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 p-4 bg-secondary-100 rounded-lg">
          <p className="text-sm text-secondary-600">
            ¿Necesitas ayuda? Contacta nuestro soporte en:
            <br />
            <strong>becas@universidad.edu.co</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
