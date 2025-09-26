const { query, param, validationResult } = require('express-validator');
const Scholarship = require('../models/Scholarship');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Validaciones para listar becas
const listScholarshipsValidation = [
  query('status')
    .optional()
    .isIn(['published', 'closed'])
    .withMessage('Status debe ser published o closed'),
  
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La búsqueda debe tener entre 2 y 100 caracteres'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured debe ser true o false'),
  
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
    .isIn(['newest', 'oldest', 'featured', 'closing_soon', 'title'])
    .withMessage('Sort debe ser: newest, oldest, featured, closing_soon, title')
];

// Validaciones para obtener beca por slug o ID
const getScholarshipValidation = [
  param('identifier')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Identificador inválido')
];

// GET /api/scholarships
const listScholarships = async (req, res, next) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Parámetros de consulta inválidos', 400, errors.array()));
    }

    // Extraer parámetros con valores por defecto
    const {
      status = 'published',
      q,
      featured,
      page = 1,
      limit = 20,
      sort = 'newest'
    } = req.query;

    // Construir filtros
    const filters = {
      status: status === 'published' ? 'published' : { $in: ['published', 'closed'] }
    };

    // Filtro por featured
    if (featured !== undefined) {
      filters.featured = featured === 'true';
    }

    // Filtro de búsqueda por texto
    let textSearchQuery = {};
    if (q && q.trim()) {
      textSearchQuery = {
        $or: [
          { title: { $regex: q.trim(), $options: 'i' } },
          { description: { $regex: q.trim(), $options: 'i' } }
        ]
      };
    }

    // Combinar filtros
    const query = { ...filters, ...textSearchQuery };

    // Configurar ordenamiento
    let sortQuery = {};
    switch (sort) {
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'featured':
        sortQuery = { featured: -1, createdAt: -1 };
        break;
      case 'closing_soon':
        sortQuery = { closeAt: 1, createdAt: -1 };
        break;
      case 'title':
        sortQuery = { title: 1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Ejecutar consulta con paginación
    const [scholarships, totalCount] = await Promise.all([
      Scholarship.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-createdBy -updatedBy -__v')
        .lean(),
      Scholarship.countDocuments(query)
    ]);

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // Agregar campos virtuales manualmente para documentos lean
    const enrichedScholarships = scholarships.map(scholarship => ({
      ...scholarship,
      canApply: scholarship.status === 'published' && 
                new Date(scholarship.openAt) <= new Date() && 
                new Date(scholarship.closeAt) >= new Date(),
      daysRemaining: scholarship.status === 'published' ? 
        Math.max(0, Math.ceil((new Date(scholarship.closeAt) - new Date()) / (1000 * 60 * 60 * 24))) : 
        null
    }));

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: {
        scholarships: enrichedScholarships,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? parseInt(page) + 1 : null,
          prevPage: hasPrevPage ? parseInt(page) - 1 : null
        },
        filters: {
          status,
          q: q || null,
          featured: featured !== undefined ? featured === 'true' : null,
          sort
        }
      }
    });

    logger.info(`Becas listadas: ${scholarships.length} de ${totalCount} total, página ${page}`);

  } catch (error) {
    logger.error('Error al listar becas:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

// GET /api/scholarships/:identifier (slug o ID)
const getScholarship = async (req, res, next) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Identificador inválido', 400, errors.array()));
    }

    const { identifier } = req.params;

    // Buscar por slug o por ID
    let scholarship;
    
    // Verificar si es un ObjectId válido
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    
    if (isObjectId) {
      scholarship = await Scholarship.findById(identifier)
        .select('-createdBy -updatedBy -__v');
    } else {
      scholarship = await Scholarship.findOne({ slug: identifier })
        .select('-createdBy -updatedBy -__v');
    }

    // Verificar si la beca existe
    if (!scholarship) {
      return next(new ApiError('Beca no encontrada', 404));
    }

    // Verificar que no esté archivada
    if (scholarship.status === 'archived') {
      return next(new ApiError('Beca no disponible', 404));
    }

    // Convertir a objeto para agregar campos virtuales
    const scholarshipObj = scholarship.toObject({ virtuals: true });

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: {
        scholarship: scholarshipObj
      }
    });

    logger.info(`Beca obtenida: ${scholarship.title} (${identifier})`);

  } catch (error) {
    logger.error('Error al obtener beca:', error);
    
    // Manejar errores específicos de MongoDB
    if (error.name === 'CastError') {
      return next(new ApiError('Identificador de beca inválido', 400));
    }
    
    next(new ApiError('Error interno del servidor', 500));
  }
};

module.exports = {
  listScholarships: [listScholarshipsValidation, listScholarships],
  getScholarship: [getScholarshipValidation, getScholarship]
};
