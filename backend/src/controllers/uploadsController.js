const { body, validationResult } = require('express-validator');
const { storageService } = require('../services/storageService');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Validaciones para upload
const uploadValidation = [
  body('kind')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('El tipo de archivo debe contener solo letras, números, guiones y guiones bajos')
];

// POST /api/uploads
const uploadFiles = async (req, res, next) => {
  try {
    // Aplicar middleware de multer
    const uploadMiddleware = storageService.getUploadMiddleware();
    
    uploadMiddleware(req, res, async (multerError) => {
      try {
        // Manejar errores de multer
        if (multerError) {
          logger.error('Error de multer:', multerError);
          
          if (multerError.code === 'LIMIT_FILE_SIZE') {
            const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB) || 10;
            return next(new ApiError(`Archivo excede el tamaño máximo de ${maxSizeMB}MB`, 400));
          }
          
          if (multerError.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError('Demasiados archivos. Máximo 10 archivos permitidos', 400));
          }
          
          if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new ApiError('Campo de archivo no esperado. Use "files" como nombre de campo', 400));
          }
          
          // Si es nuestro ApiError personalizado, pasarlo
          if (multerError instanceof ApiError) {
            return next(multerError);
          }
          
          return next(new ApiError('Error subiendo archivos', 500));
        }

        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
        }

        // Verificar que se proporcionaron archivos
        if (!req.files || req.files.length === 0) {
          return next(new ApiError('No se proporcionaron archivos para subir', 400));
        }

        // Validar archivos
        storageService.validateFiles(req.files);

        // Obtener tipo de archivo desde body (opcional)
        const kind = req.body.kind || 'document';

        // Procesar archivos subidos
        const processedFiles = await storageService.processUploadedFiles(req.files, kind);

        // Respuesta exitosa
        res.status(201).json({
          success: true,
          message: `${processedFiles.length} archivo(s) subido(s) exitosamente`,
          data: {
            files: processedFiles.map(file => ({
              kind: file.kind,
              filename: file.filename,
              originalname: file.originalname,
              mimetype: file.mimetype,
              sizeBytes: file.sizeBytes,
              urlOrPath: file.urlOrPath
            })),
            uploadedAt: new Date().toISOString(),
            storageInfo: storageService.getStorageInfo()
          }
        });

        logger.info(`${processedFiles.length} archivos subidos exitosamente por IP: ${req.ip}`);

      } catch (error) {
        logger.error('Error procesando archivos:', error);
        
        if (error instanceof ApiError) {
          return next(error);
        }
        
        next(new ApiError('Error interno procesando archivos', 500));
      }
    });

  } catch (error) {
    logger.error('Error en uploadFiles:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

// GET /api/uploads/info
const getUploadInfo = async (req, res, next) => {
  try {
    const info = storageService.getStorageInfo();
    
    res.status(200).json({
      success: true,
      data: {
        ...info,
        endpoint: '/api/uploads',
        fieldName: 'files',
        maxFilesPerRequest: 10,
        supportedFormats: {
          documents: ['PDF', 'DOC', 'DOCX'],
          images: ['JPG', 'JPEG', 'PNG']
        },
        usage: {
          method: 'POST',
          contentType: 'multipart/form-data',
          example: 'curl -F "files=@document.pdf" -F "files=@image.jpg" -F "kind=academic_docs" /api/uploads'
        }
      }
    });

  } catch (error) {
    logger.error('Error en getUploadInfo:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

module.exports = {
  uploadFiles: [uploadValidation, uploadFiles],
  getUploadInfo
};
