const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Cargar variables de entorno
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      logger.info(`📝 Modo: ${process.env.NODE_ENV}`);
    });

    // Manejo graceful de cierre del servidor
    const gracefulShutdown = () => {
      logger.info('Cerrando servidor...');
      server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
      });
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    // Manejo de errores no controlados
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Inicializar el servidor
startServer();
