import api from './api';

// Función pública (sin autenticación)
export const create = async (body) => {
  try {
    const response = await api.post('/applications', body);
    return response.data;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

// Funciones admin (requieren autenticación)
export const listAdmin = async (params = {}) => {
  try {
    const response = await api.get('/admin/applications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    throw error;
  }
};

export const getAdminById = async (id) => {
  try {
    const response = await api.get(`/admin/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin application by id:', error);
    throw error;
  }
};

export const setStatus = async (id, body) => {
  try {
    const response = await api.patch(`/admin/applications/${id}/status`, body);
    return response.data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

export const exportApplicationsCsv = async () => {
  try {
    const response = await api.get('/admin/exports/applications.csv', {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting applications CSV:', error);
    throw error;
  }
};

// Objeto de servicio para compatibilidad (opcional)
export const applicationService = {
  create,
  listAdmin,
  getAdminById,
  setStatus,
  exportApplicationsCsv
};
