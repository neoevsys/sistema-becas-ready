import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { listPublic } from '../services/scholarships';
import ScholarshipCard from '../components/ScholarshipCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const Landing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const limit = 9; // 3x3 grid

  // React Query para obtener becas
  const {
    data: scholarshipsData,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['scholarships', searchQuery, featuredFilter, currentPage],
    queryFn: () => listPublic({
      q: searchQuery || undefined,
      featured: featuredFilter || undefined,
      page: currentPage,
      limit
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mostrar error toast
  if (isError) {
    toast.error(error?.response?.data?.message || 'Error al cargar las becas');
  }

  const scholarships = scholarshipsData?.data?.scholarships || [];
  const pagination = scholarshipsData?.data?.pagination || {};
  const hasScholarships = scholarships.length > 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset a primera página al buscar
  };

  const handlePreviousPage = () => {
    if (pagination.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="container-app py-20">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6">
            Encuentra tu 
            <span className="text-primary-600"> Beca Ideal</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
            Conectamos estudiantes talentosos con oportunidades de financiamiento 
            educativo. Explora becas disponibles y postúlate de manera sencilla.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="card p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar becas por nombre, área de estudio..."
                  className="input-field w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Featured Filter */}
              <div className="md:w-48">
                <select
                  className="input-field w-full"
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                >
                  <option value="">Todas las becas</option>
                  <option value="true">Solo destacadas</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="btn-primary px-8"
              >
                Buscar
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm text-secondary-600">
              <span>
                {pagination.total ? `${pagination.total} becas encontradas` : 'Cargando...'}
              </span>
              <Link to="/admin" className="text-primary-600 hover:text-primary-700">
                Acceso Administrador →
              </Link>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader size="lg" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 text-center border-red-200 bg-red-50">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Error al cargar las becas
              </h3>
              <p className="text-red-600 mb-4">
                Hubo un problema al obtener la información. Intenta nuevamente.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !hasScholarships && (
          <div className="py-12">
            <EmptyState
              title="No encontramos becas"
              description={
                searchQuery || featuredFilter 
                  ? "No hay becas que coincidan con tu búsqueda. Intenta con otros términos."
                  : "Actualmente no hay becas disponibles. Vuelve pronto para ver nuevas oportunidades."
              }
              actionLabel="Limpiar filtros"
              onAction={() => {
                setSearchQuery('');
                setFeaturedFilter('');
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* Scholarships Grid */}
        {!isLoading && !isError && hasScholarships && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {scholarships.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPrev}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-secondary-600">
                    Página {pagination.currentPage} de {pagination.totalPages}
                  </span>
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Features Section (solo si no hay búsqueda activa) */}
      {!searchQuery && !featuredFilter && (
        <div className="bg-white">
          <div className="container-app py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                ¿Cómo funciona?
              </h2>
              <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                Nuestro proceso simplificado te ayuda a encontrar y postularte a becas de forma eficiente
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  1. Explora Becas
                </h3>
                <p className="text-secondary-600">
                  Navega por nuestra base de datos de becas con filtros avanzados 
                  para encontrar oportunidades que se ajusten a tu perfil.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  2. Completa tu Perfil
                </h3>
                <p className="text-secondary-600">
                  Llena el formulario de postulación con tu información académica 
                  y personal. Sube tus documentos de soporte de manera segura.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  3. Seguimiento
                </h3>
                <p className="text-secondary-600">
                  Recibe actualizaciones sobre el estado de tu postulación 
                  y mantente informado durante todo el proceso de selección.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="container-app py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
              Miles de estudiantes ya han encontrado su beca ideal. Únete a ellos y 
              da el siguiente paso hacia tu futuro académico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="#" className="btn-secondary text-lg px-8 py-3">
                Explorar Más Becas
              </Link>
              <Link to="/admin" className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3">
                Panel de Administración
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
