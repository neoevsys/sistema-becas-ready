const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  // Identidad
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  slug: {
    type: String,
    required: [true, 'El slug es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug debe contener solo letras minúsculas, números y guiones']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft',
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },

  // Contenido
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  benefits: {
    type: String,
    required: [true, 'Los beneficios son obligatorios'],
    trim: true
  },
  vacancies: {
    type: Number,
    required: [true, 'El número de vacantes es obligatorio'],
    min: [1, 'Debe haber al menos 1 vacante'],
    max: [10000, 'Número de vacantes no válido']
  },

  // Elegibilidad
  modality: {
    type: String,
    required: [true, 'La modalidad es obligatoria'],
    enum: ['presencial', 'virtual', 'hibrida'],
    trim: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  eligibleLevels: [{
    type: String,
    enum: ['pregrado', 'posgrado', 'maestria', 'doctorado', 'tecnico', 'diplomado'],
    trim: true
  }],
  eligibleCareers: [{
    type: String,
    trim: true
  }],
  eligibleNationalities: [{
    type: String,
    trim: true
  }],

  // Fechas
  openAt: {
    type: Date,
    required: [true, 'La fecha de apertura es obligatoria']
  },
  closeAt: {
    type: Date,
    required: [true, 'La fecha de cierre es obligatoria'],
    validate: {
      validator: function(value) {
        return value > this.openAt;
      },
      message: 'La fecha de cierre debe ser posterior a la fecha de apertura'
    }
  },
  examAt: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.closeAt;
      },
      message: 'La fecha del examen debe ser posterior a la fecha de cierre'
    }
  },
  resultsAt: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || (this.examAt ? value > this.examAt : value > this.closeAt);
      },
      message: 'La fecha de resultados debe ser posterior a la fecha del examen o cierre'
    }
  },

  // Documentos requeridos
  requiredDocs: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    required: {
      type: Boolean,
      default: true
    },
    formats: [{
      type: String,
      enum: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      lowercase: true
    }],
    maxMB: {
      type: Number,
      default: 5,
      min: [0.1, 'El tamaño mínimo es 0.1 MB'],
      max: [50, 'El tamaño máximo es 50 MB']
    }
  }],

  // Contacto y legales
  contactEmail: {
    type: String,
    required: [true, 'El email de contacto es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email de contacto inválido']
  },
  termsUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'URL de términos inválida']
  },

  // Analytics
  captureUTM: {
    type: Boolean,
    default: true
  },

  // Metadatos
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
scholarshipSchema.index({ slug: 1 });
scholarshipSchema.index({ status: 1 });
scholarshipSchema.index({ featured: -1 });
scholarshipSchema.index({ openAt: 1, closeAt: 1 });
scholarshipSchema.index({ title: 'text', description: 'text' });
scholarshipSchema.index({ createdAt: -1 });

// Índice compuesto para consultas frecuentes
scholarshipSchema.index({ status: 1, featured: -1, openAt: 1 });

// Virtual para verificar si la beca está activa
scholarshipSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         this.openAt <= now && 
         this.closeAt >= now;
});

// Virtual para verificar si la beca está vigente para postular
scholarshipSchema.virtual('canApply').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         this.openAt <= now && 
         this.closeAt >= now;
});

// Virtual para contar días restantes
scholarshipSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'published') return null;
  
  const now = new Date();
  const closeDate = new Date(this.closeAt);
  
  if (now > closeDate) return 0;
  
  const diffTime = closeDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Método para obtener datos públicos
scholarshipSchema.methods.toPublicJSON = function() {
  const scholarship = this.toObject();
  
  // Excluir campos internos
  delete scholarship.createdBy;
  delete scholarship.updatedBy;
  delete scholarship.__v;
  
  return scholarship;
};

// Hook pre-save para generar slug automáticamente si no existe
scholarshipSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .trim();
  }
  next();
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);
