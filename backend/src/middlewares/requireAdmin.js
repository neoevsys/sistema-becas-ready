const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');

const requireAdmin = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(new ApiError('Token de acceso requerido', 401));
    }

    // Verificar formato Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return next(new ApiError('Formato de token inválido. Debe ser: Bearer <token>', 401));
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return next(new ApiError('Token de acceso requerido', 401));
    }

    // Verificar y decodificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new ApiError('Token expirado', 401));
      } else if (error.name === 'JsonWebTokenError') {
        return next(new ApiError('Token inválido', 401));
      } else {
        return next(new ApiError('Error al verificar token', 401));
      }
    }

    // Verificar que el token tenga el role correcto
    if (decoded.role !== 'admin') {
      return next(new ApiError('Acceso denegado. Permisos de administrador requeridos', 403));
    }

    // Buscar el admin en la base de datos
    const admin = await AdminUser.findById(decoded.userId);
    if (!admin) {
      return next(new ApiError('Admin no encontrado', 401));
    }

    // Verificar que el admin tenga el role correcto
    if (admin.role !== 'admin') {
      return next(new ApiError('Acceso denegado. Permisos de administrador requeridos', 403));
    }

    // Adjuntar el admin al objeto request
    req.admin = admin;
    req.userId = admin._id;
    req.user = {
      id: admin._id,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    logger.error('Error en middleware requireAdmin:', error);
    next(new ApiError('Error interno del servidor', 500));
  }
};

module.exports = requireAdmin;
