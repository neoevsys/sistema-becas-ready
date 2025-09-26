const { ApiError } = require('./errorHandler');

// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  const error = new ApiError(`Ruta ${req.originalUrl} no encontrada`, 404);
  next(error);
};

module.exports = notFound;
