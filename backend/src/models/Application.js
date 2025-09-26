const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Referencia a la beca
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: [true, 'La referencia a la beca es obligatoria']
  },

  // Estado de la postulación
  status: {
    type: String,
    enum: [
      'submitted', 'pre_evaluation', 'eligible', 'not_eligible',
      'invited_exam', 'passed_exam', 'failed_exam', 'interview',
      'selected', 'waitlist', 'rejected', 'awarded'
    ],
    default: 'submitted',
    required: true
  },

  // Datos personales
  docType: {
    type: String,
    required: [true, 'El tipo de documento es obligatorio'],
    enum: ['cedula', 'pasaporte', 'cedula_extranjeria', 'tarjeta_identidad'],
    trim: true
  },
  docNumber: {
    type: String,
    required: [true, 'El número de documento es obligatorio'],
    trim: true,
    maxlength: [20, 'El número de documento no puede exceder 20 caracteres']
  },
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  nationality: {
    type: String,
    required: [true, 'La nacionalidad es obligatoria'],
    trim: true
  },
  gender: {
    type: String,
    required: [true, 'El género es obligatorio'],
    enum: ['masculino', 'femenino', 'otro', 'prefiero_no_decir']
  },
  birthDate: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria'],
    validate: {
      validator: function(value) {
        const now = new Date();
        const minAge = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
        const maxAge = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate());
        return value >= minAge && value <= maxAge;
      },
      message: 'La edad debe estar entre 16 y 100 años'
    }
  },
  maritalStatus: {
    type: String,
    required: [true, 'El estado civil es obligatorio'],
    enum: ['soltero', 'casado', 'union_libre', 'separado', 'divorciado', 'viudo']
  },
  birthCity: {
    type: String,
    required: [true, 'La ciudad de nacimiento es obligatoria'],
    trim: true
  },
  residenceCity: {
    type: String,
    required: [true, 'La ciudad de residencia es obligatoria'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Número de teléfono inválido']
  },
  hasDisability: {
    type: Boolean,
    required: true,
    default: false
  },
  disabilityDetail: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        return !this.hasDisability || (value && value.trim().length > 0);
      },
      message: 'El detalle de la discapacidad es obligatorio si se indica que tiene discapacidad'
    }
  },
  isIndigenous: {
    type: Boolean,
    required: true,
    default: false
  },
  indigenousDetail: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        return !this.isIndigenous || (value && value.trim().length > 0);
      },
      message: 'El detalle indígena es obligatorio si se indica pertenencia a comunidad indígena'
    }
  },

  // Datos académicos
  university: {
    type: String,
    required: [true, 'La universidad es obligatoria'],
    trim: true
  },
  universityType: {
    type: String,
    required: [true, 'El tipo de universidad es obligatorio'],
    enum: ['publica', 'privada', 'internacional']
  },
  major: {
    type: String,
    required: [true, 'La carrera es obligatoria'],
    trim: true
  },
  academicStatus: {
    type: String,
    required: [true, 'El estado académico es obligatorio'],
    enum: ['estudiante', 'graduado', 'egresado', 'cursando']
  },
  level: {
    type: String,
    required: [true, 'El nivel académico es obligatorio'],
    enum: ['pregrado', 'posgrado', 'maestria', 'doctorado', 'tecnico', 'diplomado']
  },
  campusCity: {
    type: String,
    required: [true, 'La ciudad del campus es obligatoria'],
    trim: true
  },
  gpa: {
    type: Number,
    required: [true, 'El promedio académico es obligatorio'],
    min: [0.0, 'El promedio debe ser mayor a 0'],
    max: [5.0, 'El promedio no puede ser mayor a 5.0']
  },
  ranking: {
    type: Number,
    min: [1, 'El ranking debe ser mayor a 0']
  },
  credits: {
    type: Number,
    required: [true, 'Los créditos son obligatorios'],
    min: [0, 'Los créditos no pueden ser negativos']
  },
  entryYear: {
    type: Number,
    required: [true, 'El año de ingreso es obligatorio'],
    min: [1950, 'Año de ingreso inválido'],
    max: [new Date().getFullYear(), 'El año de ingreso no puede ser futuro']
  },
  graduationYear: {
    type: Number,
    validate: {
      validator: function(value) {
        return !value || (value >= this.entryYear && value <= new Date().getFullYear() + 10);
      },
      message: 'El año de graduación debe ser posterior al año de ingreso y no muy futuro'
    }
  },

  // Motivación y enlaces
  sourceInfo: {
    type: String,
    required: [true, 'La fuente de información es obligatoria'],
    trim: true,
    enum: [
      'redes_sociales', 'sitio_web_universidad', 'recomendacion_amigo',
      'email_institucional', 'periodico', 'evento', 'otro'
    ]
  },
  motivation: {
    type: String,
    required: [true, 'La motivación es obligatoria'],
    trim: true,
    minlength: [100, 'La motivación debe tener al menos 100 caracteres'],
    maxlength: [2000, 'La motivación no puede exceder 2000 caracteres']
  },
  links: {
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*/, 'URL de LinkedIn inválida']
    },
    portfolio: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'URL de portfolio inválida']
    }
  },

  // Archivos adjuntos
  files: [{
    kind: {
      type: String,
      required: true,
      trim: true
    },
    filename: {
      type: String,
      required: true,
      trim: true
    },
    mimetype: {
      type: String,
      required: true,
      enum: [
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/jpg', 'image/png'
      ]
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: [1, 'El archivo no puede estar vacío'],
      max: [52428800, 'El archivo no puede exceder 50MB'] // 50MB en bytes
    },
    urlOrPath: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Consentimientos
  acceptRequirements: {
    type: Boolean,
    required: [true, 'Debe aceptar los requisitos'],
    validate: {
      validator: function(value) {
        return value === true;
      },
      message: 'Debe aceptar los requisitos para continuar'
    }
  },
  commitToProcess: {
    type: Boolean,
    required: [true, 'Debe comprometerse con el proceso'],
    validate: {
      validator: function(value) {
        return value === true;
      },
      message: 'Debe comprometerse con el proceso para continuar'
    }
  },
  acceptPrivacy: {
    type: Boolean,
    required: [true, 'Debe aceptar la política de privacidad'],
    validate: {
      validator: function(value) {
        return value === true;
      },
      message: 'Debe aceptar la política de privacidad para continuar'
    }
  },

  // UTM tracking (opcional)
  utm_source: {
    type: String,
    trim: true
  },
  utm_medium: {
    type: String,
    trim: true
  },
  utm_campaign: {
    type: String,
    trim: true
  },
  utm_term: {
    type: String,
    trim: true
  },
  utm_content: {
    type: String,
    trim: true
  },

  // Metadatos de auditoria
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
applicationSchema.index({ scholarshipId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ email: 1 });

// Índice único compuesto para prevenir duplicados (antifraude)
applicationSchema.index(
  { scholarshipId: 1, docType: 1, docNumber: 1 }, 
  { unique: true }
);

// Virtual para obtener el nombre completo
applicationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual para calcular edad
applicationSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  
  const now = new Date();
  const birth = new Date(this.birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
});

// Método para obtener datos públicos (sin información sensible)
applicationSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    scholarshipId: this.scholarshipId,
    status: this.status,
    submittedAt: this.submittedAt,
    fullName: this.fullName
  };
};

// Método para verificar si puede ser editada
applicationSchema.methods.canBeEdited = function() {
  return ['submitted', 'pre_evaluation'].includes(this.status);
};

module.exports = mongoose.model('Application', applicationSchema);
