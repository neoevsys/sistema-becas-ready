const { query, body, param, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Scholarship = require('../models/Scholarship');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Validaciones para listar postulaciones admin
const listAdminApplicationsValidation = [
  query('scholarshipId')
    .optional()
    .isMongoId()
    .withMessage('ID de beca inválido'),
  
  query('status')
    .optional()
    .isIn([
      'submitted', 'pre_evaluation', 'eligible', 'not_eligible',
      'invited_exam', 'passed_exam', 'failed_exam', 'interview',
      'selected', 'waitlist', 'rejected', 'awarded'
    ])
    .withMessage('Status de postulación inválido'),
  
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
    .isIn(['newest', 'oldest', 'status', 'name'])
    .withMessage('Sort debe ser: newest, oldest, status, name')
];

// Validaciones para cambiar estado de postulación
const updateApplicationStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID de postulación inválido'),
  
  body('status')
    .isIn([
      'submitted', 'pre_evaluation', 'eligible', 'not_eligible',
      'invited_exam', 'passed_exam', 'failed_exam', 'interview',
      'selected', 'waitlist', 'rejected', 'awarded'
    ])
    .withMessage('Status de postulación inválido'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('El comentario debe tener entre 10 y 1000 caracteres')
];

// GET /api/admin/applications
const listAdminApplications = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Parámetros de consulta inválidos', 400, errors.array()));
    }

    const {
      scholarshipId,
      status,
      q,
      page = 1,
      limit = 20,
      sort = 'newest'
    } = req.query;

    // Construir filtros
    const filters = {};
    if (scholarshipId) {
      filters.scholarshipId = scholarshipId;
    }
    if (status) {
      filters.status = status;
    }

    // Filtro de búsqueda por texto (nombre completo o email)
    if (q && q.trim()) {
      filters.$or = [
        { firstName: { $regex: q.trim(), $options: 'i' } },
        { lastName: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { docNumber: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    // Configurar ordenamiento
    let sortQuery = {};
    switch (sort) {
      case 'oldest':
        sortQuery = { submittedAt: 1 };
        break;
      case 'status':
        sortQuery = { status: 1, submittedAt: -1 };
        break;
      case 'name':
        sortQuery = { firstName: 1, lastName: 1 };
        break;
      case 'newest':
      default:
        sortQuery = { submittedAt: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, totalCount] = await Promise.all([
      Application.find(filters)
        .populate({
          path: 'scholarshipId',
          select: 'title slug status'
        })
        .select('-files -utm_source -utm_medium -utm_campaign -utm_term -utm_content -ipAddress -userAgent')
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Application.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // Enriquecer datos con campos virtuales
    const enrichedApplications = applications.map(app => ({
      ...app,
      fullName: `${app.firstName} ${app.lastName}`,
      age: app.birthDate ? Math.floor((Date.now() - new Date(app.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }));

    res.status(200).json({
      success: true,
      data: {
        applications: enrichedApplications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        },
        filters: { scholarshipId, status, q, sort }
      }
    });

    logger.info(`Admin listó ${applications.length} postulaciones`, { 
      adminId: req.user.id, 
      filters, 
      page 
    });

  } catch (error) {
    logger.error('Error al listar postulaciones admin:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

// GET /api/admin/applications/:id
const getAdminApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new ApiError('ID de postulación inválido', 400));
    }

    const application = await Application.findById(id)
      .populate({
        path: 'scholarshipId',
        select: 'title slug status openAt closeAt requirements eligibleLevels'
      });

    if (!application) {
      return next(new ApiError('Postulación no encontrada', 404));
    }

    // Convertir a objeto con virtuals
    const applicationData = application.toObject({ virtuals: true });

    res.status(200).json({
      success: true,
      data: {
        application: applicationData
      }
    });

    logger.info(`Admin obtuvo detalle de postulación: ${application._id}`, {
      adminId: req.user.id,
      applicationId: application._id
    });

  } catch (error) {
    logger.error('Error al obtener postulación:', error);
    
    if (error.name === 'CastError') {
      return next(new ApiError('ID de postulación inválido', 400));
    }
    
    next(new ApiError('Error interno del servidor', 500));
  }
};

// PATCH /api/admin/applications/:id/status
const updateApplicationStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
    }

    const { id } = req.params;
    const { status, comment } = req.body;

    // Buscar la postulación actual
    const application = await Application.findById(id).populate('scholarshipId', 'title');
    if (!application) {
      return next(new ApiError('Postulación no encontrada', 404));
    }

    const previousStatus = application.status;

    // Validar transiciones de estado válidas
    const validTransitions = {
      'submitted': ['pre_evaluation', 'rejected'],
      'pre_evaluation': ['eligible', 'not_eligible'],
      'eligible': ['invited_exam', 'interview', 'selected', 'waitlist'],
      'not_eligible': ['rejected'],
      'invited_exam': ['passed_exam', 'failed_exam'],
      'passed_exam': ['interview', 'selected', 'waitlist'],
      'failed_exam': ['rejected'],
      'interview': ['selected', 'waitlist', 'rejected'],
      'selected': ['awarded'],
      'waitlist': ['selected', 'rejected'],
      'rejected': [], // Estado final
      'awarded': []   // Estado final
    };

    const allowedTransitions = validTransitions[previousStatus] || [];
    if (!allowedTransitions.includes(status)) {
      return next(new ApiError(
        `Transición de estado inválida: ${previousStatus} → ${status}`, 
        400
      ));
    }

    // Actualizar el estado
    application.status = status;
    
    // Agregar comentario al historial si se proporciona
    if (comment) {
      if (!application.statusHistory) {
        application.statusHistory = [];
      }
      application.statusHistory.push({
        status: status,
        comment: comment,
        changedBy: req.user.id,
        changedAt: new Date()
      });
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Estado de postulación actualizado exitosamente',
      data: {
        applicationId: application._id,
        previousStatus,
        newStatus: status,
        updatedAt: new Date().toISOString()
      }
    });

    logger.info(`Admin cambió estado de postulación: ${previousStatus} → ${status}`, {
      adminId: req.user.id,
      applicationId: application._id,
      scholarshipTitle: application.scholarshipId.title,
      comment: comment || null
    });

  } catch (error) {
    logger.error('Error al actualizar estado de postulación:', error);
    
    if (error.name === 'CastError') {
      return next(new ApiError('ID de postulación inválido', 400));
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

// GET /api/admin/exports/applications.csv
const exportApplicationsCSV = async (req, res, next) => {
  try {
    const { scholarshipId, status } = req.query;

    // Construir filtros
    const filters = {};
    if (scholarshipId) {
      filters.scholarshipId = scholarshipId;
    }
    if (status) {
      filters.status = status;
    }

    // Obtener todas las postulaciones que coincidan con los filtros
    const applications = await Application.find(filters)
      .populate({
        path: 'scholarshipId',
        select: 'title slug'
      })
      .select([
        'firstName', 'lastName', 'email', 'phone', 'docType', 'docNumber',
        'nationality', 'gender', 'birthDate', 'university', 'major', 'level',
        'gpa', 'status', 'submittedAt'
      ])
      .sort({ submittedAt: -1 })
      .lean();

    // Definir columnas del CSV
    const csvColumns = [
      'ID',
      'Nombres',
      'Apellidos',
      'Email',
      'Teléfono',
      'Tipo Documento',
      'Número Documento',
      'Nacionalidad',
      'Género',
      'Fecha Nacimiento',
      'Edad',
      'Universidad',
      'Carrera',
      'Nivel',
      'Promedio',
      'Estado',
      'Fecha Postulación',
      'Beca'
    ];

    // Convertir datos a CSV
    const csvRows = [];
    csvRows.push(csvColumns.join(','));

    applications.forEach(app => {
      const age = app.birthDate ? Math.floor((Date.now() - new Date(app.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '';
      
      const row = [
        app._id,
        `"${app.firstName}"`,
        `"${app.lastName}"`,
        app.email,
        `"${app.phone}"`,
        app.docType,
        app.docNumber,
        `"${app.nationality}"`,
        app.gender,
        app.birthDate ? new Date(app.birthDate).toLocaleDateString('es-CO') : '',
        age,
        `"${app.university}"`,
        `"${app.major}"`,
        app.level,
        app.gpa,
        app.status,
        new Date(app.submittedAt).toLocaleDateString('es-CO'),
        `"${app.scholarshipId?.title || ''}"`
      ];
      
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `postulaciones-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    res.status(200).send('\ufeff' + csvContent); // BOM para UTF-8

    logger.info(`Admin exportó ${applications.length} postulaciones a CSV`, {
      adminId: req.user.id,
      filters,
      filename
    });

  } catch (error) {
    logger.error('Error al exportar postulaciones:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

module.exports = {
  listAdminApplications: [listAdminApplicationsValidation, listAdminApplications],
  getAdminApplication,
  updateApplicationStatus: [updateApplicationStatusValidation, updateApplicationStatus],
  exportApplicationsCSV
};
