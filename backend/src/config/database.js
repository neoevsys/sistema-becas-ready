const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/becasdb';
    const conn = await mongoose.connect(mongoUri, {
      // Opciones de configuración para MongoDB
      maxPoolSize: 10, // Máximo número de conexiones en el pool
      serverSelectionTimeoutMS: 30000, // 30 segundos para seleccionar servidor
      connectTimeoutMS: 30000, // 30 segundos para conectar
      socketTimeoutMS: 45000, // Tiempo de espera para operaciones
    });

    logger.info(`🗄️  MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners para la conexión
    mongoose.connection.on('error', (err) => {
      logger.error('Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado');
    });

  } catch (error) {
    logger.error('Error al conectar a MongoDB:', error);
    console.log('Error completo:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
