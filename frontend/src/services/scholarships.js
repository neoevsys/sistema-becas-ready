import api from './api';

// Funciones públicas (sin autenticación)
export const listPublic = async (params = {}) => {
  try {
    const response = await api.get('/scholarships', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching public scholarships:', error);
    throw error;
  }
};

export const getBySlug = async (slug) => {
  try {
    const response = await api.get(`/scholarships/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scholarship by slug:', error);
    throw error;
  }
};

// Funciones admin (requieren autenticación)
export const listAdmin = async (params = {}) => {
  try {
    const response = await api.get('/admin/scholarships', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin scholarships:', error);
    throw error;
  }
};

export const create = async (data) => {
  try {
    const response = await api.post('/admin/scholarships', data);
    return response.data;
  } catch (error) {
    console.error('Error creating scholarship:', error);
    throw error;
  }
};

export const update = async (id, patch) => {
  try {
    const response = await api.patch(`/admin/scholarships/${id}`, patch);
    return response.data;
  } catch (error) {
    console.error('Error updating scholarship:', error);
    throw error;
  }
};

// Objeto de servicio para compatibilidad (opcional)
export const scholarshipService = {
  listPublic,
  getBySlug,
  listAdmin,
  create,
  update
};
