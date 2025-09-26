import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { listAdmin, create, update } from '../services/scholarships';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('scholarships');
  const [showForm, setShowForm] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '' });
  
  const queryClient = useQueryClient();

  // Query para obtener becas
  const {
    data: scholarshipsData,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['admin-scholarships', filters],
    queryFn: () => listAdmin(filters),
    staleTime: 2 * 60 * 1000,
  });

  // Mutación para crear beca
  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Beca creada exitosamente');
      setShowForm(false);
      queryClient.invalidateQueries(['admin-scholarships']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear la beca');
    }
  });

  // Mutación para actualizar beca
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => update(id, data),
    onSuccess: () => {
      toast.success('Beca actualizada exitosamente');
      setShowForm(false);
      setEditingScholarship(null);
      queryClient.invalidateQueries(['admin-scholarships']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar la beca');
    }
  });

  const scholarships = scholarshipsData?.data?.scholarships || [];

  // Schema de validación
  const validationSchema = Yup.object({
    title: Yup.string().required('Título es requerido'),
    description: Yup.string().required('Descripción es requerida'),
    vacancies: Yup.number().min(1, 'Debe haber al menos 1 cupo').required('Vacancies requeridas'),
    modality: Yup.string().required('Modalidad es requerida'),
    openAt: Yup.date().required('Fecha de apertura es requerida'),
    closeAt: Yup.date()
      .required('Fecha de cierre es requerida')
      .min(Yup.ref('openAt'), 'La fecha de cierre debe ser posterior a la apertura'),
    examAt: Yup.date().nullable().min(Yup.ref('closeAt'), 'La fecha del examen debe ser posterior al cierre'),
    resultsAt: Yup.date().nullable().min(Yup.ref('examAt'), 'La fecha de resultados debe ser posterior al examen'),
  });

  // Valores iniciales del formulario
  const getInitialValues = () => {
    if (editingScholarship) {
      return {
        title: editingScholarship.title || '',
        slug: editingScholarship.slug || '',
        status: editingScholarship.status || 'draft',
        featured: editingScholarship.featured || false,
        description: editingScholarship.description || '',
        benefits: editingScholarship.benefits || [''],
        vacancies: editingScholarship.vacancies || 1,
        modality: editingScholarship.modality || '',
        requirements: editingScholarship.requirements || [''],
        eligibleLevels: editingScholarship.eligibleLevels || [''],
        openAt: editingScholarship.openAt?.slice(0, 16) || '', // datetime-local format
        closeAt: editingScholarship.closeAt?.slice(0, 16) || '',
        examAt: editingScholarship.examAt?.slice(0, 16) || '',
        resultsAt: editingScholarship.resultsAt?.slice(0, 16) || '',
        requiredDocuments: editingScholarship.requiredDocuments || [''],
        contactEmail: editingScholarship.contactEmail || '',
        termsUrl: editingScholarship.termsUrl || '',
        captureUTM: editingScholarship.captureUTM || false,
      };
    }
    
    return {
      title: '',
      slug: '',
      status: 'draft',
      featured: false,
      description: '',
      benefits: [''],
      vacancies: 1,
      modality: '',
      requirements: [''],
      eligibleLevels: [''],
      openAt: '',
      closeAt: '',
      examAt: '',
      resultsAt: '',
      requiredDocuments: [''],
      contactEmail: '',
      termsUrl: '',
      captureUTM: false,
    };
  };

  // Manejar envío del formulario
  const handleSubmit = (values) => {
    const payload = {
      ...values,
      benefits: values.benefits.filter(b => b.trim()),
      requirements: values.requirements.filter(r => r.trim()),
      eligibleLevels: values.eligibleLevels.filter(l => l.trim()),
      requiredDocuments: values.requiredDocuments.filter(d => d.trim()),
    };

    if (editingScholarship) {
      updateMutation.mutate({ id: editingScholarship._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Acciones rápidas
  const quickAction = (id, action) => {
    const statusMap = {
      publish: 'published',
      close: 'closed',
      archive: 'archived'
    };
    
    updateMutation.mutate({ 
      id, 
      data: { status: statusMap[action] } 
    });
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container-app py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Panel de Administración
            </h1>
            <p className="text-secondary-600">
              Gestiona becas, postulaciones y configuraciones del sistema
            </p>
          </div>
          
          {activeTab === 'scholarships' && (
            <button
              onClick={() => {
                setEditingScholarship(null);
                setShowForm(true);
              }}
              className="btn-primary"
            >
              + Nueva Beca
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('scholarships')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scholarships'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Becas
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Postulaciones
            </button>
          </nav>
        </div>

        {/* Contenido de Becas */}
        {activeTab === 'scholarships' && (
          <>
            {/* Filtros */}
            <div className="card p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    className="input-field"
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  />
                </div>
                <div className="md:w-48">
                  <select
                    className="input-field"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicada</option>
                    <option value="closed">Cerrada</option>
                    <option value="archived">Archivada</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Becas */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : isError ? (
              <div className="card p-8 text-center">
                <p className="text-red-600">Error al cargar las becas</p>
                <button 
                  onClick={() => queryClient.invalidateQueries(['admin-scholarships'])}
                  className="btn-primary mt-4"
                >
                  Reintentar
                </button>
              </div>
            ) : scholarships.length === 0 ? (
              <EmptyState
                title="No hay becas"
                description="Crea tu primera beca para comenzar"
                actionLabel="Crear Beca"
                onAction={() => setShowForm(true)}
              />
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Fechas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Cupos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {scholarships.map((scholarship) => (
                        <tr key={scholarship._id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-secondary-900">
                                {scholarship.title}
                              </div>
                              <div className="text-sm text-secondary-500">
                                {scholarship.modality}
                                {scholarship.featured && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Destacada
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scholarship.status)}`}>
                              {scholarship.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            <div>Abre: {formatDate(scholarship.openAt)}</div>
                            <div>Cierra: {formatDate(scholarship.closeAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {scholarship.vacancies}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingScholarship(scholarship);
                                  setShowForm(true);
                                }}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Editar
                              </button>
                              {scholarship.status === 'draft' && (
                                <button
                                  onClick={() => quickAction(scholarship._id, 'publish')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Publicar
                                </button>
                              )}
                              {scholarship.status === 'published' && (
                                <button
                                  onClick={() => quickAction(scholarship._id, 'close')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cerrar
                                </button>
                              )}
                              <button
                                onClick={() => quickAction(scholarship._id, 'archive')}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                Archivar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Contenido de Postulaciones */}
        {activeTab === 'applications' && (
          <div className="card p-8 text-center">
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Gestión de Postulaciones
            </h3>
            <p className="text-secondary-600 mb-4">
              Esta sección se implementará próximamente
            </p>
            <div className="text-sm text-secondary-500">
              Aquí podrás revisar, aprobar y gestionar todas las postulaciones
            </div>
          </div>
        )}

        {/* Modal de Formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-secondary-900">
                    {editingScholarship ? 'Editar Beca' : 'Nueva Beca'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingScholarship(null);
                    }}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <Formik
                  initialValues={getInitialValues()}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                  enableReinitialize
                >
                  {({ values, isSubmitting }) => (
                    <Form className="space-y-6">
                      {/* Información Básica */}
                      <div>
                        <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Título *
                            </label>
                            <Field name="title" className="input-field" />
                            <ErrorMessage name="title" component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Slug (auto-generado)
                            </label>
                            <Field name="slug" className="input-field bg-secondary-50" readOnly />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Estado *
                            </label>
                            <Field as="select" name="status" className="input-field">
                              <option value="draft">Borrador</option>
                              <option value="published">Publicada</option>
                              <option value="closed">Cerrada</option>
                              <option value="archived">Archivada</option>
                            </Field>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Modalidad *
                            </label>
                            <Field as="select" name="modality" className="input-field">
                              <option value="">Seleccionar</option>
                              <option value="presencial">Presencial</option>
                              <option value="virtual">Virtual</option>
                              <option value="hibrido">Híbrido</option>
                            </Field>
                            <ErrorMessage name="modality" component="div" className="text-red-500 text-sm mt-1" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Cupos *
                            </label>
                            <Field type="number" name="vacancies" min="1" className="input-field" />
                            <ErrorMessage name="vacancies" component="div" className="text-red-500 text-sm mt-1" />
                          </div>

                          <div>
                            <label className="flex items-center">
                              <Field type="checkbox" name="featured" className="mr-2" />
                              <span className="text-sm font-medium text-secondary-700">Beca destacada</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Descripción *
                        </label>
                        <Field as="textarea" name="description" rows={4} className="input-field" />
                        <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                      </div>

                      {/* Fechas */}
                      <div>
                        <h3 className="text-lg font-medium text-secondary-900 mb-4">Fechas Importantes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Fecha de Apertura *
                            </label>
                            <Field type="datetime-local" name="openAt" className="input-field" />
                            <ErrorMessage name="openAt" component="div" className="text-red-500 text-sm mt-1" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Fecha de Cierre *
                            </label>
                            <Field type="datetime-local" name="closeAt" className="input-field" />
                            <ErrorMessage name="closeAt" component="div" className="text-red-500 text-sm mt-1" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Fecha de Examen (opcional)
                            </label>
                            <Field type="datetime-local" name="examAt" className="input-field" />
                            <ErrorMessage name="examAt" component="div" className="text-red-500 text-sm mt-1" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Fecha de Resultados (opcional)
                            </label>
                            <Field type="datetime-local" name="resultsAt" className="input-field" />
                            <ErrorMessage name="resultsAt" component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                        </div>
                      </div>

                      {/* Arrays dinámicos */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Beneficios */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Beneficios
                          </label>
                          <FieldArray name="benefits">
                            {({ push, remove }) => (
                              <div className="space-y-2">
                                {values.benefits.map((_, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Field name={`benefits.${index}`} className="input-field flex-1" />
                                    {values.benefits.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => push('')}
                                  className="text-primary-600 hover:text-primary-800 text-sm"
                                >
                                  + Agregar beneficio
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>

                        {/* Requisitos */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Requisitos
                          </label>
                          <FieldArray name="requirements">
                            {({ push, remove }) => (
                              <div className="space-y-2">
                                {values.requirements.map((_, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Field name={`requirements.${index}`} className="input-field flex-1" />
                                    {values.requirements.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => push('')}
                                  className="text-primary-600 hover:text-primary-800 text-sm"
                                >
                                  + Agregar requisito
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>

                        {/* Documentos Requeridos */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Documentos Requeridos
                          </label>
                          <FieldArray name="requiredDocuments">
                            {({ push, remove }) => (
                              <div className="space-y-2">
                                {values.requiredDocuments.map((_, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Field name={`requiredDocuments.${index}`} className="input-field flex-1" />
                                    {values.requiredDocuments.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => push('')}
                                  className="text-primary-600 hover:text-primary-800 text-sm"
                                >
                                  + Agregar documento
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>

                        {/* Niveles Elegibles */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Niveles Elegibles
                          </label>
                          <FieldArray name="eligibleLevels">
                            {({ push, remove }) => (
                              <div className="space-y-2">
                                {values.eligibleLevels.map((_, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Field 
                                      as="select" 
                                      name={`eligibleLevels.${index}`} 
                                      className="input-field flex-1"
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="pregrado">Pregrado</option>
                                      <option value="postgrado">Postgrado</option>
                                      <option value="maestria">Maestría</option>
                                      <option value="doctorado">Doctorado</option>
                                    </Field>
                                    {values.eligibleLevels.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => push('')}
                                  className="text-primary-600 hover:text-primary-800 text-sm"
                                >
                                  + Agregar nivel
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      </div>

                      {/* Información Adicional */}
                      <div>
                        <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Adicional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Email de Contacto
                            </label>
                            <Field type="email" name="contactEmail" className="input-field" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              URL de Términos y Condiciones
                            </label>
                            <Field type="url" name="termsUrl" className="input-field" />
                          </div>

                          <div className="md:col-span-2">
                            <label className="flex items-center">
                              <Field type="checkbox" name="captureUTM" className="mr-2" />
                              <span className="text-sm font-medium text-secondary-700">Capturar parámetros UTM</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Botones */}
                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingScholarship(null);
                          }}
                          className="btn-outline"
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={isSubmitting || createMutation.isLoading || updateMutation.isLoading}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center">
                              <Loader size="sm" className="mr-2" />
                              {editingScholarship ? 'Actualizando...' : 'Creando...'}
                            </div>
                          ) : (
                            editingScholarship ? 'Actualizar Beca' : 'Crear Beca'
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
