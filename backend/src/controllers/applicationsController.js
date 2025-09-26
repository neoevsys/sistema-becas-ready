const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Scholarship = require('../models/Scholarship');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Validaciones completas para crear aplicación
const createApplicationValidation = [
  // Datos personales
  body('docType')
    .isIn(['cedula', 'pasaporte', 'cedula_extranjeria', 'tarjeta_identidad'])
    .withMessage('Tipo de documento inválido'),
  
  body('docNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .matches(/^[A-Z0-9\-]+$/i)
    .withMessage('Número de documento inválido'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-záéíóúñ\s]+$/i)
    .withMessage('Nombre inválido'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-záéíóúñ\s]+$/i)
    .withMessage('Apellido inválido'),
  
  body('nationality')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nacionalidad inválida'),
  
  body('gender')
    .isIn(['masculino', 'femenino', 'otro', 'prefiero_no_decir'])
    .withMessage('Género inválido'),
  
  body('birthDate')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const now = new Date();
      const age = now.getFullYear() - value.getFullYear();
      return age >= 16 && age <= 100;
    })
    .withMessage('Fecha de nacimiento inválida (edad debe estar entre 16 y 100 años)'),
  
  body('maritalStatus')
    .isIn(['soltero', 'casado', 'union_libre', 'separado', 'divorciado', 'viudo'])
    .withMessage('Estado civil inválido'),
  
  body('birthCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ciudad de nacimiento inválida'),
  
  body('residenceCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ciudad de residencia inválida'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('phone')
    .matches(/^[\+]?[0-9\s\-\(\)]{7,15}$/)
    .withMessage('Número de teléfono inválido'),
  
  body('hasDisability')
    .isBoolean()
    .withMessage('hasDisability debe ser true o false'),
  
  body('disabilityDetail')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Detalle de discapacidad debe tener entre 10 y 500 caracteres'),
  
  body('isIndigenous')
    .isBoolean()
    .withMessage('isIndigenous debe ser true o false'),
  
  body('indigenousDetail')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Detalle indígena debe tener entre 10 y 500 caracteres'),

  // Datos académicos
  body('university')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Universidad inválida'),
  
  body('universityType')
    .isIn(['publica', 'privada', 'internacional'])
    .withMessage('Tipo de universidad inválido'),
  
  body('major')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Carrera inválida'),
  
  body('academicStatus')
    .isIn(['estudiante', 'graduado', 'egresado', 'cursando'])
    .withMessage('Estado académico inválido'),
  
  body('level')
    .isIn(['pregrado', 'posgrado', 'maestria', 'doctorado', 'tecnico', 'diplomado'])
    .withMessage('Nivel académico inválido'),
  
  body('campusCity')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ciudad del campus inválida'),
  
  body('gpa')
    .isFloat({ min: 0.0, max: 5.0 })
    .withMessage('Promedio académico debe estar entre 0.0 y 5.0'),
  
  body('ranking')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ranking debe ser un número positivo'),
  
  body('credits')
    .isInt({ min: 0 })
    .withMessage('Créditos debe ser un número no negativo'),
  
  body('entryYear')
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage('Año de ingreso inválido'),
  
  body('graduationYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage('Año de graduación inválido'),

  // Motivación
  body('sourceInfo')
    .isIn([
      'redes_sociales', 'sitio_web_universidad', 'recomendacion_amigo',
      'email_institucional', 'periodico', 'evento', 'otro'
    ])
    .withMessage('Fuente de información inválida'),
  
  body('motivation')
    .trim()
    .isLength({ min: 100, max: 2000 })
    .withMessage('La motivación debe tener entre 100 y 2000 caracteres'),
  
  body('links.linkedin')
    .optional()
    .isURL()
    .matches(/linkedin\.com/)
    .withMessage('URL de LinkedIn inválida'),
  
  body('links.portfolio')
    .optional()
    .isURL()
    .withMessage('URL de portfolio inválida'),

  // Archivos subidos (opcional - referencias a archivos previamente subidos)
  body('files')
    .optional()
    .isArray()
    .withMessage('Files debe ser un array'),
  
  body('files.*.kind')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Kind del archivo inválido'),
  
  body('files.*.filename')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Filename del archivo inválido'),
  
  body('files.*.mimetype')
    .optional()
    .isIn([
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/jpg', 'image/png'
    ])
    .withMessage('Mimetype del archivo no permitido'),
  
  body('files.*.sizeBytes')
    .optional()
    .isInt({ min: 1, max: 52428800 })
    .withMessage('Tamaño del archivo inválido'),
  
  body('files.*.urlOrPath')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('URL o path del archivo inválido'),

  // Consentimientos obligatorios
  body('acceptRequirements')
    .equals('true')
    .withMessage('Debe aceptar los requisitos'),
  
  body('commitToProcess')
    .equals('true')
    .withMessage('Debe comprometerse con el proceso'),
  
  body('acceptPrivacy')
    .equals('true')
    .withMessage('Debe aceptar la política de privacidad')
];

// POST /api/applications
const createApplication = async (req, res, next) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
    }

    const { scholarshipId, docType, docNumber } = req.body;

    // 1. Validar que la beca existe
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return next(new ApiError('Beca no encontrada', 404));
    }

    // 2. Validar que la beca esté publicada
    if (scholarship.status !== 'published') {
      return next(new ApiError('La beca no está disponible para postulaciones', 400));
    }

    // 3. Validar fechas de la beca
    const now = new Date();
    if (now < new Date(scholarship.openAt)) {
      return next(new ApiError('Las postulaciones aún no han abierto', 400));
    }
    
    if (now > new Date(scholarship.closeAt)) {
      return next(new ApiError('Las postulaciones han cerrado', 400));
    }

    // 4. Validar condición anti-duplicado
    const existingApplication = await Application.findOne({
      scholarshipId,
      docType,
      docNumber
    });

    if (existingApplication) {
      return next(new ApiError('Ya existe una postulación con este documento para esta beca', 409));
    }

    // 5. Validar consentimientos específicos
    if (req.body.hasDisability && !req.body.disabilityDetail) {
      return next(new ApiError('Debe proporcionar detalle de la discapacidad', 400));
    }

    if (req.body.isIndigenous && !req.body.indigenousDetail) {
      return next(new ApiError('Debe proporcionar detalle de pertenencia indígena', 400));
    }

    if (req.body.graduationYear && req.body.graduationYear < req.body.entryYear) {
      return next(new ApiError('El año de graduación debe ser posterior al año de ingreso', 400));
    }

    // 6. Capturar UTM de headers o query
    const utmData = {};
    const possibleSources = [req.query, req.headers, req.body];
    
    for (const source of possibleSources) {
      if (source.utm_source || source['x-utm-source']) {
        utmData.utm_source = source.utm_source || source['x-utm-source'];
      }
      if (source.utm_medium || source['x-utm-medium']) {
        utmData.utm_medium = source.utm_medium || source['x-utm-medium'];
      }
      if (source.utm_campaign || source['x-utm-campaign']) {
        utmData.utm_campaign = source.utm_campaign || source['x-utm-campaign'];
      }
      if (source.utm_term || source['x-utm-term']) {
        utmData.utm_term = source.utm_term || source['x-utm-term'];
      }
      if (source.utm_content || source['x-utm-content']) {
        utmData.utm_content = source.utm_content || source['x-utm-content'];
      }
    }

    // 7. Preparar datos de la aplicación
    const applicationData = {
      ...req.body,
      scholarshipId,
      status: 'submitted',
      submittedAt: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      ...utmData
    };

    // 8. Convertir consentimientos a booleanos
    applicationData.acceptRequirements = true;
    applicationData.commitToProcess = true;
    applicationData.acceptPrivacy = true;
    applicationData.hasDisability = applicationData.hasDisability === true || applicationData.hasDisability === 'true';
    applicationData.isIndigenous = applicationData.isIndigenous === true || applicationData.isIndigenous === 'true';

    // 9. Crear la aplicación
    const application = new Application(applicationData);
    await application.save();

    // 10. Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Postulación creada exitosamente',
      data: {
        applicationId: application._id,
        status: application.status,
        submittedAt: application.submittedAt,
        scholarshipTitle: scholarship.title
      }
    });

    logger.info(`Nueva postulación creada: ${application._id} para beca ${scholarship.title} por ${applicationData.firstName} ${applicationData.lastName}`);

  } catch (error) {
    logger.error('Error al crear postulación:', error);
    
    // Manejar errores específicos
    if (error.code === 11000) {
      // Error de duplicado (por si acaso el índice unique funciona)
      return next(new ApiError('Ya existe una postulación con este documento para esta beca', 409));
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ApiError('Error de validación', 400, validationErrors));
    }
    
    if (error.name === 'CastError') {
      return next(new ApiError('ID de beca inválido', 400));
    }
    
    next(new ApiError('Error interno del servidor', 500));
  }
};

module.exports = {
  createApplication: [createApplicationValidation, createApplication]
};
