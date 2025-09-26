const express = require('express');
const uploadsController = require('../controllers/uploadsController');

const router = express.Router();

/**
 * @route   POST /api/uploads
 * @desc    Subir múltiples archivos de soporte para postulaciones
 * @access  Public
 * @form    multipart/form-data
 * @files   files[] - Array de archivos (máximo 10)
 * @body    {
 *   kind?: string - Tipo de archivos (academic_docs, certificates, photos, etc.)
 * }
 * @returns {
 *   files: [{
 *     kind: string,
 *     filename: string,
 *     originalname: string,
 *     mimetype: string,
 *     sizeBytes: number,
 *     urlOrPath: string
 *   }],
 *   uploadedAt: string,
 *   storageInfo: object
 * }
 * @validations {
 *   - Tipos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG
 *   - Tamaño máximo por archivo: MAX_UPLOAD_MB (env)
 *   - Máximo 10 archivos por request
 *   - Nombres de archivo sanitizados automáticamente
 *   - Validación de mimetype vs extensión
 * }
 * @usage {
 *   // Con curl
 *   curl -X POST http://localhost:5000/api/uploads \
 *     -F "files=@cv.pdf" \
 *     -F "files=@certificate.jpg" \
 *     -F "kind=academic_docs"
 *   
 *   // Con JavaScript/FormData
 *   const formData = new FormData();
 *   formData.append('files', fileInput1.files[0]);
 *   formData.append('files', fileInput2.files[0]);
 *   formData.append('kind', 'academic_docs');
 *   
 *   fetch('/api/uploads', {
 *     method: 'POST',
 *     body: formData
 *   });
 * }
 */
router.post('/', uploadsController.uploadFiles);

/**
 * @route   GET /api/uploads/info
 * @desc    Obtener información sobre configuración de uploads
 * @access  Public
 * @returns {
 *   storageType: string,
 *   maxSizeMB: number,
 *   allowedTypes: string[],
 *   allowedExtensions: string[],
 *   maxFiles: number,
 *   endpoint: string,
 *   fieldName: string,
 *   supportedFormats: object,
 *   usage: object
 * }
 */
router.get('/info', uploadsController.getUploadInfo);

module.exports = router;
