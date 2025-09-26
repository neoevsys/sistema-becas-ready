import { useParams, Link } from 'react-router-dom';

const ApplicationForm = () => {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-app py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Inicio
          </Link>
          <span className="mx-2 text-secondary-400">/</span>
          <Link to={`/scholarships/${slug}`} className="text-primary-600 hover:text-primary-700">
            Detalle de Beca
          </Link>
          <span className="mx-2 text-secondary-400">/</span>
          <span className="text-secondary-600">Formulario de Postulación</span>
        </nav>

        {/* Placeholder Content */}
        <div className="card p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Formulario de Postulación
          </h1>
          
          <p className="text-secondary-600 mb-6">
            Formulario para postularse a la beca: <strong>{slug}</strong>
          </p>
          
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-secondary-900 mb-2">Características a implementar:</h3>
            <ul className="text-left text-secondary-600 space-y-1">
              <li>• Formulario con Formik + Yup validación</li>
              <li>• Datos personales y académicos</li>
              <li>• Upload de documentos con FileInput</li>
              <li>• Integración con API de postulaciones</li>
              <li>• Confirmación de envío exitoso</li>
            </ul>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link to={`/scholarships/${slug}`} className="btn-secondary">
              Volver al Detalle
            </Link>
            <button className="btn-primary" disabled>
              Enviar Postulación (Próximamente)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
