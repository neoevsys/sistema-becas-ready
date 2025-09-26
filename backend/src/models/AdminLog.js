const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  // Admin que realizó la acción
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },

  // Tipo de acción realizada
  action: {
    type: String,
    required: true,
    enum: [
      // Acciones de becas
      'scholarship_created',
      'scholarship_updated',
      'scholarship_status_changed',
      
      // Acciones de postulaciones
      'application_viewed',
      'application_status_changed',
      'applications_exported',
      
      // Acciones de autenticación
      'admin_login',
      'admin_logout',
      
      // Otras acciones
      'data_exported'
    ]
  },

  // Recurso afectado
  resourceType: {
    type: String,
    required: true,
    enum: ['scholarship', 'application', 'admin', 'system']
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Puede ser null para acciones generales
  },

  // Detalles de la acción
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Metadatos de la request
  ipAddress: {
    type: String,
    required: true
  },

  userAgent: {
    type: String,
    required: true
  },

  // Resultado de la acción
  success: {
    type: Boolean,
    required: true,
    default: true
  },

  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ resourceType: 1, resourceId: 1 });
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ success: 1, createdAt: -1 });

// Método estático para crear log de auditoría
adminLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    // No fallar la operación principal si falla el logging
    console.error('Error creando log de auditoría:', error);
    return null;
  }
};

// Método para obtener logs recientes de un admin
adminLogSchema.statics.getRecentByAdmin = async function(adminId, limit = 50) {
  return this.find({ adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'email')
    .lean();
};

// Método para obtener logs de un recurso específico
adminLogSchema.statics.getByResource = async function(resourceType, resourceId, limit = 20) {
  return this.find({ resourceType, resourceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'email')
    .lean();
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
