const express = require('express');
const rateLimit = require('express-rate-limit');
const adminScholarshipsController = require('../controllers/adminScholarshipsController');
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

// Aplicar middlewares a todas las rutas
router.use(adminRateLimit);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/scholarships
 * @desc    Listar becas con filtros admin (incluye todas las becas, incluso archivadas)
 * @access  Admin
 * @query   {
 *   status?: 'draft' | 'published' | 'closed' | 'archived',
 *   q?: string (búsqueda por título/descripción),
 *   page?: number (1-1000),
 *   limit?: number (1-100),
 *   sort?: 'newest' | 'oldest' | 'title' | 'status'
 * }
 * @returns {
 *   scholarships: Array<ScholarshipWithAdmin>,
 *   pagination: PaginationMeta,
 *   filters: FiltersMeta
 * }
 */
router.get('/', adminScholarshipsController.listAdminScholarships);

/**
 * @route   POST /api/admin/scholarships
 * @desc    Crear nueva beca
 * @access  Admin
 * @body    {
 *   title: string (5-200 chars),
 *   description: string (10-2000 chars),
 *   benefits: string (10-1000 chars),
 *   vacancies: number (1-10000),
 *   modality: 'presencial' | 'virtual' | 'hibrida',
 *   requirements: string[] (min 1),
 *   eligibleLevels: Array<'pregrado' | 'posgrado' | 'maestria' | 'doctorado' | 'tecnico' | 'diplomado'>,
 *   openAt: Date,
 *   closeAt: Date (debe ser > openAt),
 *   contactEmail: string (email válido),
 *   slug?: string (opcional, se auto-genera),
 *   status?: 'draft' | 'published' (default: draft)
 * }
 * @returns { scholarship: ScholarshipDetail }
 * @validations {
 *   - Título único y descriptivo
 *   - Fechas lógicas (closeAt > openAt)
 *   - Al menos un requisito y nivel elegible
 *   - Email válido para contacto
 *   - Slug auto-generado si no se proporciona
 * }
 */
router.post('/', adminScholarshipsController.createScholarship);

/**
 * @route   PATCH /api/admin/scholarships/:id
 * @desc    Actualizar beca existente (edición parcial)
 * @access  Admin
 * @param   id - ObjectId de la beca
 * @body    {
 *   title?: string,
 *   description?: string,
 *   status?: 'draft' | 'published' | 'closed' | 'archived',
 *   vacancies?: number,
 *   openAt?: Date,
 *   closeAt?: Date,
 *   ...otros campos opcionales
 * }
 * @returns { scholarship: ScholarshipDetail }
 * @validations {
 *   - Transiciones de estado válidas:
 *     * draft → published
 *     * published → closed  
 *     * closed → archived
 *     * archived → (sin cambios)
 *   - Para publicar: fechas válidas y no pasadas
 *   - Fechas coherentes (closeAt > openAt)
 * }
 * @note Cambios de estado se logean automáticamente
 */
router.patch('/:id', adminScholarshipsController.updateScholarship);

module.exports = router;
