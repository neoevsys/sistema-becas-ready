import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getBySlug } from '../services/scholarships';
import Loader from '../components/Loader';

const ScholarshipDetail = () => {
  const { slug } = useParams();

  // React Query para obtener la beca por slug
  const {
    data: scholarshipData,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['scholarship', slug],
    queryFn: () => getBySlug(slug),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!slug
  });

  // Mostrar error toast
  if (isError) {
    toast.error(error?.response?.data?.message || 'Error al cargar la beca');
  }

  // Redirect si no hay slug
  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  const scholarship = scholarshipData?.data;

  // Helper para formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper para formatear fechas simples
  const formatSimpleDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determinar estado de la beca y si puede postular
  const getScholarshipStatus = () => {
    if (!scholarship) return { status: 'unknown', canApply: false, message: '' };

    const now = new Date();
    const openAt = new Date(scholarship.openAt);
    const closeAt = new Date(scholarship.closeAt);

    if (now < openAt) {
      return {
        status: 'upcoming',
        canApply: false,
        message: `Abre el ${formatSimpleDate(scholarship.openAt)}`,
        color: 'bg-blue-100 text-blue-800'
      };
    }

    if (now >= openAt && now <= closeAt) {
      return {
        status: 'open',
        canApply: true,
        message: `Abierta hasta el ${formatSimpleDate(scholarship.closeAt)}`,
        color: 'bg-green-100 text-green-800'
      };
    }

    return {
      status: 'closed',
      canApply: false,
      message: `Cerrada desde el ${formatSimpleDate(scholarship.closeAt)}`,
      color: 'bg-red-100 text-red-800'
    };
  };

  const statusInfo = getScholarshipStatus();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size="lg" className="mb-4" />
          <p className="text-secondary-600">Cargando información de la beca...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-8 border-red-200 bg-red-50">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Beca no encontrada
            </h1>
            <p className="text-red-600 mb-6">
              La beca que buscas no existe o ha sido eliminada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="btn-primary">
                Volver al Inicio
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-outline"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No scholarship found
  if (!scholarship) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">
            Beca no encontrada
          </h1>
          <Link to="/" className="btn-primary">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-app py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-secondary-600">
            <Link to="/" className="hover:text-primary-600">Inicio</Link>
            <span>/</span>
            <span className="text-secondary-900">Detalles de beca</span>
          </div>
        </nav>

        {/* Header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
            <div className="flex-1 mb-4 lg:mb-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
                {scholarship.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.message}
                </span>
                <span className="text-sm text-secondary-600">
                  {scholarship.vacancies} cupos disponibles
                </span>
                <span className="text-sm text-secondary-600 capitalize">
                  Modalidad: {scholarship.modality}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              {statusInfo.canApply ? (
                <Link
                  to={`/apply/${slug}`}
                  className="btn-primary text-lg px-8 py-3"
                >
                  Postular Ahora
                </Link>
              ) : (
                <button
                  disabled
                  className="btn-primary opacity-50 cursor-not-allowed text-lg px-8 py-3"
                >
                  {statusInfo.status === 'upcoming' ? 'Aún no disponible' : 'Periodo cerrado'}
                </button>
              )}
              <Link to="/" className="btn-outline text-lg px-8 py-3">
                ← Volver
              </Link>
            </div>
          </div>

          {/* Description */}
          <div className="prose max-w-none">
            <p className="text-lg text-secondary-700 leading-relaxed">
              {scholarship.description}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Beneficios */}
            {scholarship.benefits && scholarship.benefits.length > 0 && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                  Beneficios
                </h2>
                <ul className="space-y-2">
                  {scholarship.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-secondary-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requisitos */}
            {scholarship.requirements && scholarship.requirements.length > 0 && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                  Requisitos
                </h2>
                <ul className="space-y-3">
                  {scholarship.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        <span className="text-primary-600 text-sm font-medium">{index + 1}</span>
                      </div>
                      <span className="text-secondary-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documentos Requeridos */}
            {scholarship.requiredDocuments && scholarship.requiredDocuments.length > 0 && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                  Documentos Requeridos
                </h2>
                <ul className="space-y-2">
                  {scholarship.requiredDocuments.map((document, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-secondary-700">{document}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Términos y Condiciones */}
            {scholarship.termsAndConditions && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                  Términos y Condiciones
                </h2>
                <div className="prose max-w-none">
                  <p className="text-secondary-700 whitespace-pre-line">
                    {scholarship.termsAndConditions}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Fechas Importantes */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Fechas Importantes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Apertura:</span>
                  <span className="font-medium text-secondary-900">
                    {formatSimpleDate(scholarship.openAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Cierre:</span>
                  <span className="font-medium text-secondary-900">
                    {formatSimpleDate(scholarship.closeAt)}
                  </span>
                </div>
                {scholarship.examAt && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Examen:</span>
                    <span className="font-medium text-secondary-900">
                      {formatSimpleDate(scholarship.examAt)}
                    </span>
                  </div>
                )}
                {scholarship.resultsAt && (
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Resultados:</span>
                    <span className="font-medium text-secondary-900">
                      {formatSimpleDate(scholarship.resultsAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Información Adicional */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Información Adicional
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="block text-sm text-secondary-600 mb-1">Niveles Elegibles:</span>
                  <span className="font-medium text-secondary-900">
                    {scholarship.eligibleLevels?.join(', ') || 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-secondary-600 mb-1">Cupos Totales:</span>
                  <span className="font-medium text-secondary-900">
                    {scholarship.vacancies}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-secondary-600 mb-1">Modalidad:</span>
                  <span className="font-medium text-secondary-900 capitalize">
                    {scholarship.modality}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacto */}
            {scholarship.contact && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">
                  Información de Contacto
                </h3>
                <div className="text-secondary-700 whitespace-pre-line">
                  {scholarship.contact}
                </div>
              </div>
            )}

            {/* CTA Móvil (fijo en bottom) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-secondary-200">
              {statusInfo.canApply ? (
                <Link
                  to={`/apply/${slug}`}
                  className="btn-primary w-full text-center"
                >
                  Postular Ahora
                </Link>
              ) : (
                <button
                  disabled
                  className="btn-primary w-full opacity-50 cursor-not-allowed"
                >
                  {statusInfo.status === 'upcoming' ? 'Aún no disponible' : 'Periodo cerrado'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetail;
