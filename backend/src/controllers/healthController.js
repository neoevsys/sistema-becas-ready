const mongoose = require('mongoose');
const packageJson = require('../../package.json');

// Obtener información de salud del sistema
const getHealth = async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    environment: process.env.NODE_ENV,
    database: {
      status: 'unknown',
      connection: null
    },
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100
    }
  };

  try {
    // Verificar estado de la base de datos
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'desconectado',
      1: 'conectado',
      2: 'conectando',
      3: 'desconectando'
    };

    healthCheck.database.status = dbStates[dbState] || 'desconocido';
    healthCheck.database.connection = mongoose.connection.host;

    // Si la base de datos está desconectada, devolver error 503
    if (dbState !== 1) {
      return res.status(503).json({
        success: false,
        ...healthCheck,
        message: 'Servicio no disponible - Base de datos desconectada'
      });
    }

    // Todo está bien
    res.status(200).json({
      success: true,
      ...healthCheck
    });

  } catch (error) {
    healthCheck.database.status = 'error';
    healthCheck.message = 'Error en verificación de salud';
    
    res.status(503).json({
      success: false,
      ...healthCheck,
      error: error.message
    });
  }
};

module.exports = {
  getHealth
};
