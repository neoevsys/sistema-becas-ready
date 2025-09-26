const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const AdminUser = require('../models/AdminUser');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Generar JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
};

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError('Datos de entrada inválidos', 400, errors.array()));
    }

    const { email, password } = req.body;

    // Buscar admin por email
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      logger.warn(`Intento de login fallido para email: ${email}`);
      return next(new ApiError('Credenciales inválidas', 401));
    }

    // Verificar contraseña
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Contraseña incorrecta para admin: ${email}`);
      return next(new ApiError('Credenciales inválidas', 401));
    }

    // Generar token
    const accessToken = generateToken(admin._id);
    const expiresIn = process.env.JWT_EXPIRES || '7d';

    // Respuesta exitosa
    logger.info(`Login exitoso para admin: ${email}`);
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        accessToken,
        expiresIn,
        admin: admin.toPublicJSON()
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

// GET /api/auth/me - Obtener información del admin autenticado
const getMe = async (req, res, next) => {
  try {
    // El admin ya está disponible desde el middleware requireAdmin
    res.status(200).json({
      success: true,
      data: {
        admin: req.admin.toPublicJSON()
      }
    });
  } catch (error) {
    logger.error('Error en getMe:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

module.exports = {
  login: [loginValidation, login],
  getMe
};
