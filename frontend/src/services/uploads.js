import api from './api';

// Función para subir archivos con multipart/form-data
export const uploadFiles = async (formData) => {
  try {
    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

// Helper para crear FormData desde archivos
export const createFormData = (files, fieldName = 'files') => {
  const formData = new FormData();
  
  if (Array.isArray(files)) {
    files.forEach((file, index) => {
      formData.append(`${fieldName}[${index}]`, file);
    });
  } else if (files) {
    formData.append(fieldName, files);
  }
  
  return formData;
};

// Helper para subir múltiples archivos
export const uploadMultipleFiles = async (files, fieldName = 'files') => {
  const formData = createFormData(files, fieldName);
  return uploadFiles(formData);
};

// Helper para subir un solo archivo
export const uploadSingleFile = async (file, fieldName = 'file') => {
  const formData = new FormData();
  formData.append(fieldName, file);
  return uploadFiles(formData);
};

// Objeto de servicio para compatibilidad (opcional)
export const uploadService = {
  uploadFiles,
  createFormData,
  uploadMultipleFiles,
  uploadSingleFile
};
