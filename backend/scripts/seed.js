require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
    });
    logger.info('🗄️  Conectado a MongoDB para seed');
  } catch (error) {
    logger.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.error('ADMIN_DEFAULT_EMAIL y ADMIN_DEFAULT_PASSWORD son requeridos en .env');
      return;
    }

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      logger.info(`👤 Admin ya existe: ${adminEmail}`);
      return;
    }

    // Crear nuevo admin
    const adminUser = new User({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    logger.info(`🎉 Admin creado exitosamente: ${adminEmail}`);
    
  } catch (error) {
    logger.error('Error creando admin:', error);
  }
};

const seedDatabase = async () => {
  try {
    logger.info('🌱 Iniciando seed de la base de datos...');
    
    await connectDB();
    await createAdminUser();
    
    logger.info('✅ Seed completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    logger.error('Error durante el seed:', error);
    process.exit(1);
  }
};

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, createAdminUser };
