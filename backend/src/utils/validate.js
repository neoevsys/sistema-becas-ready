const { validationResult } = require('express-validator');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Helper para manejo centralizado de errores de validación
 * Middleware que verifica los errores de express-validator y los transforma
 * en respuestas consistentes usando ApiError
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  // Transformar errores de express-validator a formato consistente
  const formattedErrors = errors.array().map(error => ({
    field: error.param || error.path,
    message: error.msg,
    value: error.value,
    location: error.location
  }));

  // Crear mensaje de error principal
  const primaryError = formattedErrors[0];
  const errorMessage = formattedErrors.length === 1 
    ? `Error en campo '${primaryError.field}': ${primaryError.message}`
    : `Errores de validación en ${formattedErrors.length} campos`;

  // Lanzar ApiError con detalles
  const apiError = new ApiError(errorMessage, 422, formattedErrors);
  next(apiError);
};

/**
 * Helper para validar IDs de MongoDB
 * @param {string} field - Nombre del campo a validar
 * @param {boolean} optional - Si el campo es opcional
 * @returns {ValidationChain}
 */
const validateMongoId = (field = 'id', optional = false) => {
  const { param, body, query } = require('express-validator');
  
  const validator = field === 'id' ? param(field) : 
                   field.startsWith('query.') ? query(field.replace('query.', '')) :
                   body(field);

  if (optional) {
    return validator
      .optional()
      .isMongoId()
      .withMessage(`${field} debe ser un ID válido de MongoDB`);
  }

  return validator
    .isMongoId()
    .withMessage(`${field} debe ser un ID válido de MongoDB`);
};

/**
 * Helper para validar emails
 * @param {string} field - Nombre del campo (default: 'email')
 * @param {boolean} optional - Si el campo es opcional
 * @returns {ValidationChain}
 */
const validateEmail = (field = 'email', optional = false) => {
  const { body } = require('express-validator');
  
  const validator = body(field);

  if (optional) {
    return validator
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage(`${field} debe ser un email válido`);
  }

  return validator
    .isEmail()
    .normalizeEmail()
    .withMessage(`${field} debe ser un email válido`);
};

/**
 * Helper para validar strings con longitud
 * @param {string} field - Nombre del campo
 * @param {Object} options - Opciones de validación
 * @returns {ValidationChain}
 */
const validateString = (field, options = {}) => {
  const { body } = require('express-validator');
  const {
    min = 1,
    max = 255,
    optional = false,
    trim = true,
    pattern = null,
    patternMessage = null
  } = options;

  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  if (trim) {
    validator = validator.trim();
  }

  validator = validator
    .isLength({ min, max })
    .withMessage(`${field} debe tener entre ${min} y ${max} caracteres`);

  if (pattern) {
    validator = validator
      .matches(pattern)
      .withMessage(patternMessage || `${field} tiene formato inválido`);
  }

  return validator;
};

/**
 * Helper para validar números
 * @param {string} field - Nombre del campo
 * @param {Object} options - Opciones de validación
 * @returns {ValidationChain}
 */
const validateNumber = (field, options = {}) => {
  const { body } = require('express-validator');
  const {
    min = null,
    max = null,
    optional = false,
    isInt = false
  } = options;

  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  if (isInt) {
    const intOptions = {};
    if (min !== null) intOptions.min = min;
    if (max !== null) intOptions.max = max;
    
    validator = validator
      .isInt(intOptions)
      .withMessage(`${field} debe ser un número entero${min !== null ? ` mayor o igual a ${min}` : ''}${max !== null ? ` y menor o igual a ${max}` : ''}`);
  } else {
    const floatOptions = {};
    if (min !== null) floatOptions.min = min;
    if (max !== null) floatOptions.max = max;
    
    validator = validator
      .isFloat(floatOptions)
      .withMessage(`${field} debe ser un número${min !== null ? ` mayor o igual a ${min}` : ''}${max !== null ? ` y menor o igual a ${max}` : ''}`);
  }

  return validator;
};

/**
 * Helper para validar fechas
 * @param {string} field - Nombre del campo
 * @param {Object} options - Opciones de validación
 * @returns {ValidationChain}
 */
const validateDate = (field, options = {}) => {
  const { body } = require('express-validator');
  const {
    optional = false,
    format = 'ISO8601',
    after = null,
    before = null
  } = options;

  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  if (format === 'ISO8601') {
    validator = validator
      .isISO8601()
      .toDate()
      .withMessage(`${field} debe ser una fecha válida en formato ISO8601`);
  }

  if (after) {
    validator = validator
      .custom((value) => {
        const afterDate = typeof after === 'function' ? after() : new Date(after);
        return new Date(value) > afterDate;
      })
      .withMessage(`${field} debe ser posterior a ${after}`);
  }

  if (before) {
    validator = validator
      .custom((value) => {
        const beforeDate = typeof before === 'function' ? before() : new Date(before);
        return new Date(value) < beforeDate;
      })
      .withMessage(`${field} debe ser anterior a ${before}`);
  }

  return validator;
};

/**
 * Helper para validar arrays
 * @param {string} field - Nombre del campo
 * @param {Object} options - Opciones de validación
 * @returns {ValidationChain}
 */
const validateArray = (field, options = {}) => {
  const { body } = require('express-validator');
  const {
    min = 1,
    max = null,
    optional = false,
    allowedValues = null
  } = options;

  let validator = body(field);

  if (optional) {
    validator = validator.optional();
  }

  const arrayOptions = { min };
  if (max) arrayOptions.max = max;

  validator = validator
    .isArray(arrayOptions)
    .withMessage(`${field} debe ser un array${min > 0 ? ` con al menos ${min} elemento${min > 1 ? 's' : ''}` : ''}${max ? ` y máximo ${max}` : ''}`);

  if (allowedValues) {
    validator = validator
      .custom((arr) => {
        return arr.every(item => allowedValues.includes(item));
      })
      .withMessage(`${field} contiene valores no permitidos. Valores permitidos: ${allowedValues.join(', ')}`);
  }

  return validator;
};

/**
 * Crear conjunto de validaciones comunes para paginación
 * @returns {Array} Array de validaciones
 */
const paginationValidation = () => {
  const { query } = require('express-validator');
  
  return [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('La página debe ser un número entre 1 y 1000'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100')
  ];
};

/**
 * Crear conjunto de validaciones comunes para búsqueda
 * @returns {Array} Array de validaciones  
 */
const searchValidation = () => {
  const { query } = require('express-validator');
  
  return [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La búsqueda debe tener entre 2 y 100 caracteres')
  ];
};

module.exports = {
  validateRequest,
  validateMongoId,
  validateEmail,
  validateString,
  validateNumber,
  validateDate,
  validateArray,
  paginationValidation,
  searchValidation
};
