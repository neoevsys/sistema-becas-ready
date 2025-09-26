const express = require('express');
const scholarshipsController = require('../controllers/scholarshipsController');

const router = express.Router();

/**
 * @route   GET /api/scholarships
 * @desc    Obtener lista de becas con filtros y paginación
 * @access  Public
 * @query   {
 *   status: 'published' | 'closed',
 *   q: string (búsqueda por título),
 *   featured: boolean,
 *   page: number (1-1000),
 *   limit: number (1-100),
 *   sort: 'newest' | 'oldest' | 'featured' | 'closing_soon' | 'title'
 * }
 * @returns {
 *   scholarships: Array<Scholarship>,
 *   pagination: PaginationMeta,
 *   filters: FiltersMeta
 * }
 */
router.get('/', scholarshipsController.listScholarships);

/**
 * @route   GET /api/scholarships/:identifier
 * @desc    Obtener detalle de una beca por slug o ID
 * @access  Public
 * @param   identifier - Slug o MongoDB ObjectId de la beca
 * @returns { scholarship: ScholarshipDetail }
 * @note    No devuelve becas con status 'archived'
 */
router.get('/:identifier', scholarshipsController.getScholarship);

module.exports = router;
