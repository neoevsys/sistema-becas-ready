const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Application = require('../src/models/Application');
const Scholarship = require('../src/models/Scholarship');
const AdminUser = require('../src/models/AdminUser');

describe('Applications Endpoints', () => {
  let adminUser;
  let activeScholarship;
  let closedScholarship;
  let draftScholarship;

  const validApplicationData = {
    // Datos personales
    docType: 'cedula',
    docNumber: '12345678',
    firstName: 'Juan',
    lastName: 'Pérez',
    nationality: 'Colombiano',
    gender: 'masculino',
    birthDate: '1995-05-15',
    maritalStatus: 'soltero',
    birthCity: 'Bogotá',
    residenceCity: 'Medellín',
    email: 'juan.perez@email.com',
    phone: '+57 300 123 4567',
    hasDisability: false,
    isIndigenous: false,

    // Datos académicos
    university: 'Universidad Nacional de Colombia',
    universityType: 'publica',
    major: 'Ingeniería de Sistemas',
    academicStatus: 'estudiante',
    level: 'pregrado',
    campusCity: 'Medellín',
    gpa: 4.2,
    ranking: 5,
    credits: 120,
    entryYear: 2020,
    graduationYear: 2024,

    // Motivación
    sourceInfo: 'sitio_web_universidad',
    motivation: 'Estoy muy interesado en obtener esta beca porque me permitirá continuar mis estudios sin preocupaciones económicas. Mi objetivo es especializarme en inteligencia artificial y contribuir al desarrollo tecnológico del país.',
    links: {
      linkedin: 'https://www.linkedin.com/in/juan-perez',
      portfolio: 'https://juan-perez-dev.com'
    },

    // Consentimientos obligatorios
    acceptRequirements: 'true',
    commitToProcess: 'true',
    acceptPrivacy: 'true'
  };

  beforeAll(async () => {
    // Crear un admin de prueba
    adminUser = new AdminUser({
      email: 'test@admin.com',
      password: 'TestPassword123!',
      role: 'admin'
    });
    await adminUser.save();

    // Crear beca activa (dentro de fechas)
    activeScholarship = new Scholarship({
      title: 'Beca Activa',
      slug: 'beca-activa',
      status: 'published',
      description: 'Beca disponible para postulaciones',
      benefits: 'Matrícula completa',
      vacancies: 10,
      modality: 'presencial',
      requirements: ['Promedio mínimo 4.0'],
      eligibleLevels: ['pregrado'],
      openAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
      closeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días adelante
      contactEmail: 'activa@universidad.edu',
      createdBy: adminUser._id
    });
    await activeScholarship.save();

    // Crear beca cerrada (fuera de fechas)
    closedScholarship = new Scholarship({
      title: 'Beca Cerrada',
      slug: 'beca-cerrada',
      status: 'published',
      description: 'Beca con postulaciones cerradas',
      benefits: 'Apoyo completo',
      vacancies: 5,
      modality: 'virtual',
      requirements: ['Completar formulario'],
      eligibleLevels: ['pregrado'],
      openAt: new Date('2023-01-01'),
      closeAt: new Date('2023-12-31'), // Ya cerrada
      contactEmail: 'cerrada@universidad.edu',
      createdBy: adminUser._id
    });
    await closedScholarship.save();

    // Crear beca draft (no publicada)
    draftScholarship = new Scholarship({
      title: 'Beca Draft',
      slug: 'beca-draft',
      status: 'draft',
      description: 'Beca en borrador',
      benefits: 'Apoyo parcial',
      vacancies: 3,
      modality: 'hibrida',
      requirements: ['En desarrollo'],
      eligibleLevels: ['pregrado'],
      openAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      closeAt: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      contactEmail: 'draft@universidad.edu',
      createdBy: adminUser._id
    });
    await draftScholarship.save();
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await Application.deleteMany({});
    await Scholarship.deleteMany({});
    await AdminUser.deleteMany({});
  });

  beforeEach(async () => {
    // Limpiar aplicaciones antes de cada test
    await Application.deleteMany({});
  });

  describe('POST /api/applications', () => {
    it('should create application successfully', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString()
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Postulación creada exitosamente');
      expect(response.body.data).toHaveProperty('applicationId');
      expect(response.body.data).toHaveProperty('status', 'submitted');
      expect(response.body.data).toHaveProperty('submittedAt');
      expect(response.body.data).toHaveProperty('scholarshipTitle', 'Beca Activa');

      // Verificar que se creó en la base de datos
      const savedApplication = await Application.findById(response.body.data.applicationId);
      expect(savedApplication).toBeTruthy();
      expect(savedApplication.firstName).toBe('Juan');
      expect(savedApplication.lastName).toBe('Pérez');
      expect(savedApplication.status).toBe('submitted');
    });

    it('should capture UTM parameters from query string', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString()
      };

      const response = await request(app)
        .post('/api/applications')
        .query({
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'becas2024',
          utm_term: 'beca excelencia',
          utm_content: 'anuncio_principal'
        })
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verificar UTM en la base de datos
      const savedApplication = await Application.findById(response.body.data.applicationId);
      expect(savedApplication.utm_source).toBe('google');
      expect(savedApplication.utm_medium).toBe('cpc');
      expect(savedApplication.utm_campaign).toBe('becas2024');
      expect(savedApplication.utm_term).toBe('beca excelencia');
      expect(savedApplication.utm_content).toBe('anuncio_principal');
    });

    it('should capture UTM parameters from headers', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        docNumber: '87654321' // Diferente para evitar duplicados
      };

      const response = await request(app)
        .post('/api/applications')
        .set('x-utm-source', 'facebook')
        .set('x-utm-medium', 'social')
        .set('x-utm-campaign', 'becas_fb')
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verificar UTM en la base de datos
      const savedApplication = await Application.findById(response.body.data.applicationId);
      expect(savedApplication.utm_source).toBe('facebook');
      expect(savedApplication.utm_medium).toBe('social');
      expect(savedApplication.utm_campaign).toBe('becas_fb');
    });

    it('should fail if scholarship does not exist', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Beca no encontrada');
    });

    it('should fail if scholarship is not published', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: draftScholarship._id.toString()
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La beca no está disponible para postulaciones');
    });

    it('should fail if applications are closed', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: closedScholarship._id.toString()
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Las postulaciones han cerrado');
    });

    it('should fail on duplicate application', async () => {
      const applicationData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString()
      };

      // Crear primera aplicación
      await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      // Intentar crear segunda aplicación con mismo documento
      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ya existe una postulación con este documento para esta beca');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        scholarshipId: activeScholarship._id.toString(),
        firstName: 'Juan'
        // Faltan campos obligatorios
      };

      const response = await request(app)
        .post('/api/applications')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should validate email format', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        email: 'email-invalido'
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should validate age range', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        birthDate: '2010-01-01' // Menor de 16 años
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should validate GPA range', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        gpa: 6.0 // Fuera del rango 0.0-5.0
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should require disability detail if hasDisability is true', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        hasDisability: true
        // Falta disabilityDetail
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Debe proporcionar detalle de la discapacidad');
    });

    it('should require indigenous detail if isIndigenous is true', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        isIndigenous: true
        // Falta indigenousDetail
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Debe proporcionar detalle de pertenencia indígena');
    });

    it('should validate graduation year after entry year', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        entryYear: 2020,
        graduationYear: 2019 // Anterior al año de ingreso
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('El año de graduación debe ser posterior al año de ingreso');
    });

    it('should require all consent fields', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        acceptRequirements: 'false' // No acepta requisitos
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should validate LinkedIn URL format', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        links: {
          linkedin: 'https://facebook.com/juan' // No es LinkedIn
        }
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should validate motivation length', async () => {
      const invalidData = {
        ...validApplicationData,
        scholarshipId: activeScholarship._id.toString(),
        motivation: 'Muy corta' // Menos de 100 caracteres
      };

      const response = await request(app)
        .post('/api/applications')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });
  });
});
