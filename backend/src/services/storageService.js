const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Configuración de tipos de archivos permitidos
const ALLOWED_MIMETYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png'
};

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

// Función para sanitizar nombres de archivo
const sanitizeFilename = (filename) => {
  // Remover caracteres peligrosos y mantener solo alfanuméricos, guiones y puntos
  const name = path.parse(filename).name
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100); // Limitar longitud
  
  const ext = path.parse(filename).ext.toLowerCase();
  
  // Agregar timestamp para evitar colisiones
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString('hex');
  
  return `${name}-${timestamp}-${randomString}${ext}`;
};

// Configuración de multer para almacenamiento local
const createDiskStorage = () => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const uploadDir = path.join(process.cwd(), 'uploads');
        
        // Crear directorio si no existe
        await fs.mkdir(uploadDir, { recursive: true });
        
        cb(null, uploadDir);
      } catch (error) {
        logger.error('Error creando directorio de uploads:', error);
        cb(new ApiError('Error configurando almacenamiento', 500));
      }
    },
    filename: (req, file, cb) => {
      try {
        const sanitizedName = sanitizeFilename(file.originalname);
        cb(null, sanitizedName);
      } catch (error) {
        logger.error('Error sanitizando nombre de archivo:', error);
        cb(new ApiError('Nombre de archivo inválido', 400));
      }
    }
  });
};

// Configuración de límites y filtros
const createMulterConfig = () => {
  const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB) || 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convertir a bytes

  return {
    storage: createDiskStorage(),
    
    limits: {
      fileSize: maxSizeBytes,
      files: 10, // Máximo 10 archivos por request
      fieldSize: 1024 * 1024, // 1MB para campos de texto
    },
    
    fileFilter: (req, file, cb) => {
      // Validar mimetype
      if (!ALLOWED_MIMETYPES[file.mimetype]) {
        const error = new ApiError(
          `Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: PDF, DOC, DOCX, JPG, PNG`, 
          400
        );
        return cb(error, false);
      }

      // Validar extensión del archivo original
      const originalExt = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
        const error = new ApiError(
          `Extensión de archivo no permitida: ${originalExt}. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`, 
          400
        );
        return cb(error, false);
      }

      // Validar que la extensión coincida con el mimetype
      const expectedExt = ALLOWED_MIMETYPES[file.mimetype];
      if (originalExt !== expectedExt && !(originalExt === '.jpeg' && expectedExt === '.jpg')) {
        const error = new ApiError(
          `La extensión ${originalExt} no coincide con el tipo de archivo ${file.mimetype}`, 
          400
        );
        return cb(error, false);
      }

      cb(null, true);
    }
  };
};

// Crear instancia de multer
const createUploadMiddleware = () => {
  const config = createMulterConfig();
  return multer(config);
};

// Servicio principal de almacenamiento
class StorageService {
  constructor() {
    this.storageType = process.env.FILE_STORAGE || 'local';
    this.uploadMiddleware = createUploadMiddleware();
  }

  // Middleware para upload múltiple
  getUploadMiddleware() {
    return this.uploadMiddleware.array('files', 10); // Máximo 10 archivos
  }

  // Procesar archivos subidos y generar metadatos
  async processUploadedFiles(files, kind = 'document') {
    if (!files || files.length === 0) {
      return [];
    }

    const processedFiles = [];

    for (const file of files) {
      try {
        const fileData = {
          kind: kind,
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          sizeBytes: file.size,
          urlOrPath: this.storageType === 'local' 
            ? `/uploads/${file.filename}` 
            : file.path,
          uploadedAt: new Date()
        };

        processedFiles.push(fileData);

        logger.info(`Archivo procesado: ${file.filename} (${file.size} bytes, ${file.mimetype})`);
      } catch (error) {
        logger.error('Error procesando archivo:', error);
        throw new ApiError('Error procesando archivo subido', 500);
      }
    }

    return processedFiles;
  }

  // Método para futuro soporte de S3
  async uploadToS3(files) {
    // TODO: Implementar cuando se necesite S3
    throw new ApiError('S3 storage no implementado aún', 501);
  }

  // Validar archivos antes de procesarlos
  validateFiles(files) {
    if (!files || files.length === 0) {
      throw new ApiError('No se proporcionaron archivos', 400);
    }

    const maxFiles = 10;
    if (files.length > maxFiles) {
      throw new ApiError(`Máximo ${maxFiles} archivos permitidos`, 400);
    }

    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB) || 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        throw new ApiError(
          `Archivo ${file.originalname} excede el tamaño máximo de ${maxSizeMB}MB`, 
          400
        );
      }

      if (!ALLOWED_MIMETYPES[file.mimetype]) {
        throw new ApiError(
          `Tipo de archivo no permitido: ${file.mimetype} en archivo ${file.originalname}`, 
          400
        );
      }
    }

    return true;
  }

  // Obtener información de configuración
  getStorageInfo() {
    return {
      storageType: this.storageType,
      maxSizeMB: parseInt(process.env.MAX_UPLOAD_MB) || 10,
      allowedTypes: Object.keys(ALLOWED_MIMETYPES),
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxFiles: 10
    };
  }
}

// Exportar instancia singleton
const storageService = new StorageService();

module.exports = {
  storageService,
  ALLOWED_MIMETYPES,
  ALLOWED_EXTENSIONS
};
