const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Importar middlewares personalizados
const { errorHandler } = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

// Importar rutas
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const scholarshipsRoutes = require('./routes/scholarships');
const applicationsRoutes = require('./routes/applications');
const uploadsRoutes = require('./routes/uploads');
const adminScholarshipsRoutes = require('./routes/adminScholarships');
const adminApplicationsRoutes = require('./routes/adminApplications');

// Crear aplicación Express
const app = express();

// Configurar CORS con lista blanca
const configureCORS = () => {
  const corsOrigins = process.env.CORS_ORIGINS;
  
  if (!corsOrigins) {
    // Desarrollo: permitir localhost
    return {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      optionsSuccessStatus: 200
    };
  }

  // Producción: usar lista blanca o permitir todo en dev
  if (corsOrigins === '*' && process.env.NODE_ENV === 'development') {
    return {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200
    };
  }

  return {
    origin: corsOrigins.split(',').map(origin => origin.trim()),
    credentials: true,
    optionsSuccessStatus: 200
  };
};

// Middlewares de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Deshabilitar x-powered-by explícitamente
app.disable('x-powered-by');

// CORS con configuración dinámica
app.use(cors(configureCORS()));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por IP
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP',
    message: 'Límite de velocidad excedido. Intente de nuevo más tarde.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting para health check
    return req.path === '/health' || req.path === '/';
  }
});

app.use(globalLimiter);

// Rate limiting específico para login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP
  message: {
    success: false,
    error: 'Demasiados intentos de login',
    message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
    retryAfter: 900 // 15 minutos en segundos
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // No contar requests exitosos
});

// Aplicar rate limiting específico a login
app.use('/api/auth/login', loginLimiter);

// Logging solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Parseo de body con límites seguros
app.use(express.json({ 
  limit: '2mb',
  strict: true,
  type: ['application/json']
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '2mb',
  parameterLimit: 1000
}));

// Sanitización NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request to ${req.path}`);
  }
}));

// Servir archivos estáticos del directorio uploads
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/uploads', uploadsRoutes);

// Rutas de administrador (requieren autenticación)
app.use('/api/admin/scholarships', adminScholarshipsRoutes);
app.use('/api/admin/applications', adminApplicationsRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Sistema de Becas 🎓',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
