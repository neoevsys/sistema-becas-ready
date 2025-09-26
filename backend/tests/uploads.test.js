const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');

describe('Uploads Endpoints', () => {
  const testFilesDir = path.join(__dirname, 'fixtures');
  let testPdfPath, testImagePath, testLargeFilePath, testInvalidFilePath;

  beforeAll(async () => {
    // Crear directorio de fixtures si no existe
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Crear archivo PDF de prueba
    testPdfPath = path.join(testFilesDir, 'test-document.pdf');
    fs.writeFileSync(testPdfPath, Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n181\n%%EOF'));

    // Crear imagen de prueba (PNG válida mínima)
    testImagePath = path.join(testFilesDir, 'test-image.png');
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk size
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, // Compressed data
      0x02, 0x00, 0x01, 0x00, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk size
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);

    // Crear archivo grande (superior al límite)
    testLargeFilePath = path.join(testFilesDir, 'large-file.pdf');
    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB) || 10;
    const largeBuffer = Buffer.alloc((maxSizeMB + 1) * 1024 * 1024, 'a'); // 1MB más que el límite
    fs.writeFileSync(testLargeFilePath, largeBuffer);

    // Crear archivo con extensión no permitida
    testInvalidFilePath = path.join(testFilesDir, 'malicious-file.exe');
    fs.writeFileSync(testInvalidFilePath, 'fake executable content');
  });

  afterAll(async () => {
    // Limpiar archivos de prueba
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }

    // Limpiar directorio de uploads
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
  });

  describe('POST /api/uploads', () => {
    it('should upload single file successfully', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('files', testPdfPath)
        .field('kind', 'academic_docs')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('1 archivo(s) subido(s) exitosamente');
      expect(response.body.data).toHaveProperty('files');
      expect(response.body.data.files).toHaveLength(1);

      const uploadedFile = response.body.data.files[0];
      expect(uploadedFile).toHaveProperty('kind', 'academic_docs');
      expect(uploadedFile).toHaveProperty('filename');
      expect(uploadedFile).toHaveProperty('originalname', 'test-document.pdf');
      expect(uploadedFile).toHaveProperty('mimetype', 'application/pdf');
      expect(uploadedFile).toHaveProperty('sizeBytes');
      expect(uploadedFile).toHaveProperty('urlOrPath');
      expect(uploadedFile.urlOrPath).toMatch(/^\/uploads\//);

      expect(response.body.data).toHaveProperty('uploadedAt');
      expect(response.body.data).toHaveProperty('storageInfo');
    });

    it('should upload multiple files successfully', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('files', testPdfPath)
        .attach('files', testImagePath)
        .field('kind', 'mixed_docs')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 archivo(s) subido(s) exitosamente');
      expect(response.body.data.files).toHaveLength(2);

      const pdfFile = response.body.data.files.find(f => f.mimetype === 'application/pdf');
      const pngFile = response.body.data.files.find(f => f.mimetype === 'image/png');

      expect(pdfFile).toBeTruthy();
      expect(pdfFile.kind).toBe('mixed_docs');
      expect(pngFile).toBeTruthy();
      expect(pngFile.kind).toBe('mixed_docs');
    });

    it('should upload with default kind when not specified', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('files', testPdfPath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.files[0].kind).toBe('document');
    });

    it('should fail when no files provided', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .field('kind', 'test')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No se proporcionaron archivos para subir');
    });

    it('should fail with file too large', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('files', testLargeFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('excede el tamaño máximo');
    });

    it('should fail with unsupported file type', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('files', testInvalidFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('no permitida');
    });

    it('should sanitize filename', async () => {
      // Crear archivo con nombre problemático
      const badNamePath = path.join(testFilesDir, 'bad name!@#$%^&*()file.pdf');
      fs.copyFileSync(testPdfPath, badNamePath);

      const response = await request(app)
        .post('/api/uploads')
        .attach('files', badNamePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      const uploadedFile = response.body.data.files[0];
      
      // El filename debe estar sanitizado
      expect(uploadedFile.filename).toMatch(/^bad-name-file-\d+-[a-f0-9]+\.pdf$/);
      expect(uploadedFile.originalname).toBe('bad name!@#$%^&*()file.pdf');

      // Limpiar
      fs.unlinkSync(badNamePath);
    });

    it('should validate kind parameter', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('files', testPdfPath)
        .field('kind', 'invalid@kind!')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should handle wrong field name', async () => {
      const response = await request(app)
        .post('/api/uploads')
        .attach('wrongField', testPdfPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Campo de archivo no esperado');
    });

    it('should limit number of files', async () => {
      const request_builder = request(app).post('/api/uploads');
      
      // Adjuntar 12 archivos (más del límite de 10)
      for (let i = 0; i < 12; i++) {
        request_builder.attach('files', testPdfPath);
      }

      const response = await request_builder.expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Máximo 10 archivos permitidos');
    });
  });

  describe('GET /api/uploads/info', () => {
    it('should return upload configuration info', async () => {
      const response = await request(app)
        .get('/api/uploads/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('storageType');
      expect(response.body.data).toHaveProperty('maxSizeMB');
      expect(response.body.data).toHaveProperty('allowedTypes');
      expect(response.body.data).toHaveProperty('allowedExtensions');
      expect(response.body.data).toHaveProperty('maxFiles', 10);
      expect(response.body.data).toHaveProperty('endpoint', '/api/uploads');
      expect(response.body.data).toHaveProperty('fieldName', 'files');
      expect(response.body.data).toHaveProperty('supportedFormats');
      expect(response.body.data).toHaveProperty('usage');

      // Verificar formatos soportados
      expect(response.body.data.supportedFormats.documents).toContain('PDF');
      expect(response.body.data.supportedFormats.images).toContain('JPG');
    });
  });
});
