const { query, body, param, validationResult } = require('express-validator');
const Scholarship = require('../models/Scholarship');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Validaciones para listar becas admin
const listAdminScholarshipsValidation = [
  query('status')
    .optional()
    .isIn(['draft', 'published', 'closed', 'archived'])
    .withMessage('Status debe ser draft, published, closed o archived'),
  
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('La página debe ser un número entre 1 y 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'title', 'status'])
    .withMessage('Sort debe ser: newest, oldest, title, status')
];

// Validaciones para crear beca
const createScholarshipValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
  
  body('benefits')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Los beneficios deben tener entre 10 y 1000 caracteres'),
  
  body('vacancies')
    .isInt({ min: 1, max: 10000 })
    .withMessage('El número de vacantes debe estar entre 1 y 10000'),
  
  body('modality')
    .isIn(['presencial', 'virtual', 'hibrida'])
    .withMessage('La modalidad debe ser presencial, virtual o hibrida'),
  
  body('requirements')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos un requisito'),
  
  body('requirements.*')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Cada requisito debe tener entre 5 y 200 caracteres'),
  
  body('eligibleLevels')
    .isArray({ min: 1 })
    .withMessage('Debe especificar al menos un nivel elegible'),
  
  body('eligibleLevels.*')
    .isIn(['pregrado', 'posgrado', 'maestria', 'doctorado', 'tecnico', 'diplomado'])
    .withMessage('Nivel elegible inválido'),
  
  body('openAt')
    .isISO8601()
    .toDate()
    .withMessage('Fecha de apertura inválida'),
  
  body('closeAt')
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      return value > req.body.openAt;
    })
    .withMessage('La fecha de cierre debe ser posterior a la fecha de apertura'),
  
  body('contactEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email de contacto inválido')
];

// Validaciones para actualizar beca
const updateScholarshipValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de beca inválido'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'closed', 'archived'])
    .withMessage('Status debe ser draft, published, closed o archived'),
  
  body('vacancies')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('El número de vacantes debe estar entre 1 y 10000'),
  
  body('openAt')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Fecha de apertura inválida'),
  
  body('closeAt')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Fecha de cierre inválida')
    .custom(async (value, { req }) => {
      if (!value) return true; // Si no se proporciona closeAt, pasar la validación
      
      // Si se proporciona openAt en el request, comparar con él
      if (req.body.openAt) {
        return new Date(value) > new Date(req.body.openAt);
      }
      
      // Si no se proporciona openAt, obtener de la base de datos
      if (req.params.id) {
        try {
          const Scholarship = require('../models/Scholarship');
          const scholarship = await Scholarship.findById(req.params.id);
          if (scholarship && scholarship.openAt) {
            return new Date(value) > scholarship.openAt;
          }
        } catch (error) {
          // Si hay error obteniendo la beca, continuar con otras validaciones
          return true;
        }
      }
      
      return true; // Si no se puede validar, continuar
    })
    .withMessage('La fecha de cierre debe ser posterior a la fecha de apertura')
];

// GET /api/admin/scholarships
const listAdminScholarships = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Parámetros de consulta inválidos', 400, errors.array()));
    }

    const {
      status,
      q,
      page = 1,
      limit = 20,
      sort = 'newest'
    } = req.query;

    // Construir filtros
    const filters = {};
    if (status) {
      filters.status = status;
    }

    // Filtro de búsqueda por texto
    if (q && q.trim()) {
      filters.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    // Configurar ordenamiento
    let sortQuery = {};
    switch (sort) {
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'title':
        sortQuery = { title: 1 };
        break;
      case 'status':
        sortQuery = { status: 1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [scholarships, totalCount] = await Promise.all([
      Scholarship.find(filters)
        .populate('createdBy', 'email role')
        .populate('updatedBy', 'email role')
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Scholarship.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: {
        scholarships: scholarships.map(scholarship => ({
          ...scholarship,
          canApply: scholarship.status === 'published' && 
                   new Date(scholarship.openAt) <= new Date() && 
                   new Date(scholarship.closeAt) >= new Date()
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: { status, q, sort }
      }
    });

    logger.info(`Admin listó ${scholarships.length} becas`, { 
      adminId: req.user.id, 
      filters, 
      page 
    });

  } catch (error) {
    logger.error('Error al listar becas admin:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

// POST /api/admin/scholarships
const createScholarship = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
    }

    const scholarshipData = {
      ...req.body,
      createdBy: req.user.id,
      status: req.body.status || 'draft'
    };

    // Generar slug si no se proporciona
    if (!scholarshipData.slug) {
      scholarshipData.slug = scholarshipData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const scholarship = new Scholarship(scholarshipData);
    await scholarship.save();

    await scholarship.populate('createdBy', 'email role');

    res.status(201).json({
      success: true,
      message: 'Beca creada exitosamente',
      data: {
        scholarship: scholarship.toObject({ virtuals: true })
      }
    });

    logger.info(`Admin creó beca: ${scholarship.title}`, { 
      adminId: req.user.id,
      scholarshipId: scholarship._id 
    });

  } catch (error) {
    logger.error('Error al crear beca:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern.slug) {
        return next(new ApiError('Ya existe una beca con ese slug', 409));
      }
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return next(new ApiError('Error de validación', 400, validationErrors));
    }
    
    next(new ApiError('Error interno del servidor', 500));
  }
};

// PATCH /api/admin/scholarships/:id
const updateScholarship = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Buscar la beca actual
    const currentScholarship = await Scholarship.findById(id);
    if (!currentScholarship) {
      return next(new ApiError('Beca no encontrada', 404));
    }

    // Validar transiciones de estado válidas
    if (updateData.status && updateData.status !== currentScholarship.status) {
      const validTransitions = {
        'draft': ['published'],
        'published': ['closed'],
        'closed': ['archived'],
        'archived': [] // No se puede cambiar desde archived
      };

      const allowedTransitions = validTransitions[currentScholarship.status] || [];
      if (!allowedTransitions.includes(updateData.status)) {
        return next(new ApiError(
          `Transición de estado inválida: ${currentScholarship.status} → ${updateData.status}`, 
          400
        ));
      }
    }

    // Validaciones específicas para publicación
    if (updateData.status === 'published') {
      const now = new Date();
      const openAt = updateData.openAt ? new Date(updateData.openAt) : currentScholarship.openAt;
      const closeAt = updateData.closeAt ? new Date(updateData.closeAt) : currentScholarship.closeAt;

      if (closeAt <= now) {
        return next(new ApiError('No se puede publicar una beca con fecha de cierre pasada', 400));
      }

      if (closeAt <= openAt) {
        return next(new ApiError('La fecha de cierre debe ser posterior a la fecha de apertura', 400));
      }
    }

    // Agregar metadatos de actualización
    updateData.updatedBy = req.user.id;

    // Actualizar la beca
    const scholarship = await Scholarship.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'email role').populate('updatedBy', 'email role');

    res.status(200).json({
      success: true,
      message: 'Beca actualizada exitosamente',
      data: {
        scholarship: scholarship.toObject({ virtuals: true })
      }
    });

    logger.info(`Admin actualizó beca: ${scholarship.title}`, {
      adminId: req.user.id,
      scholarshipId: scholarship._id,
      changes: updateData
    });

  } catch (error) {
    logger.error('Error al actualizar beca:', error);
    
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
  listAdminScholarships: [listAdminScholarshipsValidation, listAdminScholarships],
  createScholarship: [createScholarshipValidation, createScholarship],
  updateScholarship: [updateScholarshipValidation, updateScholarship]
};
