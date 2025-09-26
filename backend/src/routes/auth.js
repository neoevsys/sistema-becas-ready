const express = require('express');
const authController = require('../controllers/authController');
const requireAdmin = require('../middlewares/requireAdmin');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP
  message: {
    error: 'Demasiados intentos de login. Intente nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true
});

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión como admin
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { accessToken: string, expiresIn: string, admin: object }
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del admin autenticado
 * @access  Private (Admin)
 * @headers Authorization: Bearer <token>
 * @returns { admin: object }
 */
router.get('/me', requireAdmin, authController.getMe);

module.exports = router;
