const express = require('express');
const rateLimit = require('express-rate-limit');
const adminApplicationsController = require('../controllers/adminApplicationsController');
const requireAdmin = require('../middlewares/requireAdmin');

const router = express.Router();

// Rate limiting específico para operaciones admin
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 200, // 200 requests por 5 minutos para admins
  message: {
    success: false,
    message: 'Demasiadas operaciones administrativas. Intente de nuevo en 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting más restrictivo para exportaciones
const exportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 exportaciones por 15 minutos
  message: {
    success: false,
    message: 'Límite de exportaciones alcanzado. Intente de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar middlewares a todas las rutas
router.use(adminRateLimit);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/applications
 * @desc    Listar postulaciones con filtros admin
 * @access  Admin
 * @query   {
 *   scholarshipId?: ObjectId (filtrar por beca específica),
 *   status?: 'submitted' | 'pre_evaluation' | 'eligible' | 'not_eligible' | 
 *            'invited_exam' | 'passed_exam' | 'failed_exam' | 'interview' |
 *            'selected' | 'waitlist' | 'rejected' | 'awarded',
 *   q?: string (búsqueda por nombre, email, documento),
 *   page?: number (1-1000),
 *   limit?: number (1-100),
 *   sort?: 'newest' | 'oldest' | 'status' | 'name'
 * }
 * @returns {
 *   applications: Array<ApplicationSummary>,
 *   pagination: PaginationMeta,
 *   filters: FiltersMeta
 * }
 * @note Se excluyen datos sensibles como archivos y UTM en el listado
 */
router.get('/', adminApplicationsController.listAdminApplications);

/**
 * @route   GET /api/admin/applications/:id
 * @desc    Obtener detalle completo de una postulación
 * @access  Admin
 * @param   id - ObjectId de la postulación
 * @returns { application: ApplicationDetail }
 * @note Incluye todos los datos de la postulación, archivos adjuntos y historial
 */
router.get('/:id', adminApplicationsController.getAdminApplication);

/**
 * @route   PATCH /api/admin/applications/:id/status
 * @desc    Cambiar estado de una postulación con comentario opcional
 * @access  Admin
 * @param   id - ObjectId de la postulación
 * @body    {
 *   status: StatusEnum (ver opciones arriba),
 *   comment?: string (10-1000 chars, opcional)
 * }
 * @returns {
 *   applicationId: ObjectId,
 *   previousStatus: string,
 *   newStatus: string,
 *   updatedAt: Date
 * }
 * @validations {
 *   - Transiciones de estado válidas:
 *     * submitted → [pre_evaluation, rejected]
 *     * pre_evaluation → [eligible, not_eligible]
 *     * eligible → [invited_exam, interview, selected, waitlist]
 *     * not_eligible → [rejected]
 *     * invited_exam → [passed_exam, failed_exam]
 *     * passed_exam → [interview, selected, waitlist]
 *     * failed_exam → [rejected]
 *     * interview → [selected, waitlist, rejected]
 *     * selected → [awarded]
 *     * waitlist → [selected, rejected]
 *     * rejected → [] (final)
 *     * awarded → [] (final)
 * }
 * @note Los cambios se logean automáticamente con timestamp y admin
 */
router.patch('/:id/status', adminApplicationsController.updateApplicationStatus);

/**
 * @route   GET /api/admin/exports/applications.csv
 * @desc    Exportar postulaciones a CSV con columnas clave
 * @access  Admin
 * @query   {
 *   scholarshipId?: ObjectId (filtrar por beca),
 *   status?: StatusEnum (filtrar por estado)
 * }
 * @returns CSV file download
 * @headers {
 *   Content-Type: text/csv; charset=utf-8,
 *   Content-Disposition: attachment; filename="postulaciones-YYYY-MM-DDTHH-mm-ss.csv"
 * }
 * @columns [
 *   'ID', 'Nombres', 'Apellidos', 'Email', 'Teléfono',
 *   'Tipo Documento', 'Número Documento', 'Nacionalidad', 'Género',
 *   'Fecha Nacimiento', 'Edad', 'Universidad', 'Carrera', 'Nivel',
 *   'Promedio', 'Estado', 'Fecha Postulación', 'Beca'
 * ]
 * @note Rate limiting más restrictivo (10 exportaciones por 15 min)
 */
router.get('/exports/applications.csv', exportRateLimit, adminApplicationsController.exportApplicationsCSV);

module.exports = router;
