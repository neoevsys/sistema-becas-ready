require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('📡 Conectado a MongoDB para seed');

    // Obtener credenciales del admin desde variables de entorno
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.error('❌ Variables ADMIN_DEFAULT_EMAIL y ADMIN_DEFAULT_PASSWORD son requeridas');
      process.exit(1);
    }

    // Verificar si el admin ya existe
    const existingAdmin = await AdminUser.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      logger.info(`👤 Admin con email ${adminEmail} ya existe`);
      logger.info('✅ Seed completado - Admin ya existe');
      process.exit(0);
    }

    // Crear el admin por defecto
    const admin = new AdminUser({
      email: adminEmail,
      password: adminPassword, // Se hasheará automáticamente con el pre-save hook
      role: 'admin'
    });

    await admin.save();

    logger.info(`🎉 Admin creado exitosamente:`);
    logger.info(`   📧 Email: ${admin.email}`);
    logger.info(`   🔑 Role: ${admin.role}`);
    logger.info(`   📅 Creado: ${admin.createdAt}`);
    logger.info('✅ Seed completado exitosamente');

  } catch (error) {
    logger.error('❌ Error durante el seed:', error);
    
    if (error.code === 11000) {
      logger.error('El email ya está en uso por otro admin');
    } else if (error.name === 'ValidationError') {
      logger.error('Error de validación:', error.message);
    }
    
    process.exit(1);
  } finally {
    // Cerrar conexión a MongoDB
    await mongoose.disconnect();
    logger.info('📡 Desconectado de MongoDB');
  }
};

// Ejecutar seed si se llama directamente
if (require.main === module) {
  logger.info('🌱 Iniciando seed de admin...');
  seedAdmin();
}

module.exports = seedAdmin;
