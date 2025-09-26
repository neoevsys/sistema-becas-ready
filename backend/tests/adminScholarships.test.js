const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Scholarship = require('../src/models/Scholarship');
const AdminUser = require('../src/models/AdminUser');

describe('Admin Scholarships Endpoints', () => {
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    // Crear admin de prueba
    adminUser = new AdminUser({
      email: 'admin@test.com',
      password: 'AdminTest123!',
      role: 'admin'
    });
    await adminUser.save();

    // Obtener token de admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminTest123!'
      });

    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await Scholarship.deleteMany({});
    await AdminUser.deleteMany({});
  });

  beforeEach(async () => {
    await Scholarship.deleteMany({});
  });

  describe('POST /api/admin/scholarships', () => {
    const validScholarshipData = {
      title: 'Beca de Excelencia Académica Test',
      description: 'Descripción detallada de la beca de prueba para estudiantes destacados.',
      benefits: 'Matrícula completa, mensualidad y materiales de estudio.',
      vacancies: 10,
      modality: 'presencial',
      requirements: ['Promedio mínimo 4.5', 'Carta de recomendación', 'Ensayo motivacional'],
      eligibleLevels: ['pregrado', 'posgrado'],
      openAt: new Date('2024-06-01'),
      closeAt: new Date('2024-08-31'),
      contactEmail: 'becas@universidad.edu'
    };

    it('should create scholarship successfully', async () => {
      const response = await request(app)
        .post('/api/admin/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validScholarshipData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Beca creada exitosamente');
      expect(response.body.data.scholarship).toHaveProperty('title', validScholarshipData.title);
      expect(response.body.data.scholarship).toHaveProperty('status', 'draft');
      expect(response.body.data.scholarship).toHaveProperty('slug');
      expect(response.body.data.scholarship.createdBy).toBeDefined();

      // Verificar en BD
      const savedScholarship = await Scholarship.findById(response.body.data.scholarship._id);
      expect(savedScholarship).toBeTruthy();
      expect(savedScholarship.title).toBe(validScholarshipData.title);
    });

    it('should auto-generate slug from title', async () => {
      const response = await request(app)
        .post('/api/admin/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validScholarshipData)
        .expect(201);

      expect(response.body.data.scholarship.slug).toBe('beca-de-excelencia-academica-test');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/scholarships')
        .send(validScholarshipData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        title: 'Solo título'
        // Faltan campos obligatorios
      };

      const response = await request(app)
        .post('/api/admin/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate date logic', async () => {
      const invalidData = {
        ...validScholarshipData,
        openAt: new Date('2024-08-31'),
        closeAt: new Date('2024-06-01') // Fecha de cierre anterior a apertura
      };

      const response = await request(app)
        .post('/api/admin/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const invalidData = {
        ...validScholarshipData,
        contactEmail: 'email-invalido'
      };

      const response = await request(app)
        .post('/api/admin/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/scholarships', () => {
    beforeEach(async () => {
      // Crear becas de prueba con diferentes estados
      const scholarships = [
        {
          title: 'Beca Draft',
          slug: 'beca-draft',
          status: 'draft',
          description: 'Descripción beca draft',
          benefits: 'Beneficios beca draft',
          vacancies: 5,
          modality: 'virtual',
          requirements: ['Requisito 1'],
          eligibleLevels: ['pregrado'],
          openAt: new Date('2024-07-01'),
          closeAt: new Date('2024-09-01'),
          contactEmail: 'draft@test.com',
          createdBy: adminUser._id
        },
        {
          title: 'Beca Published',
          slug: 'beca-published',
          status: 'published',
          description: 'Descripción beca published',
          benefits: 'Beneficios beca published',
          vacancies: 8,
          modality: 'presencial',
          requirements: ['Requisito 1'],
          eligibleLevels: ['posgrado'],
          openAt: new Date('2024-06-01'),
          closeAt: new Date('2024-08-01'),
          contactEmail: 'published@test.com',
          createdBy: adminUser._id
        }
      ];

      await Scholarship.insertMany(scholarships);
    });

    it('should list all scholarships for admin', async () => {
      const response = await request(app)
        .get('/api/admin/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarships).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.filters).toBeDefined();

      // Debe incluir becas de todos los estados (incluso draft)
      const statuses = response.body.data.scholarships.map(s => s.status);
      expect(statuses).toContain('draft');
      expect(statuses).toContain('published');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/admin/scholarships?status=draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarships).toHaveLength(1);
      expect(response.body.data.scholarships[0].status).toBe('draft');
    });

    it('should search by title', async () => {
      const response = await request(app)
        .get('/api/admin/scholarships?q=Published')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarships).toHaveLength(1);
      expect(response.body.data.scholarships[0].title).toContain('Published');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/admin/scholarships?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarships).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalCount).toBe(2);
    });
  });

  describe('PATCH /api/admin/scholarships/:id', () => {
    let scholarship;

    beforeEach(async () => {
      scholarship = new Scholarship({
        title: 'Beca para Actualizar',
        slug: 'beca-para-actualizar',
        status: 'draft',
        description: 'Descripción inicial',
        benefits: 'Beneficios iniciales',
        vacancies: 5,
        modality: 'virtual',
        requirements: ['Requisito inicial'],
        eligibleLevels: ['pregrado'],
        openAt: new Date('2024-07-01'),
        closeAt: new Date('2024-09-01'),
        contactEmail: 'inicial@test.com',
        createdBy: adminUser._id
      });
      await scholarship.save();
    });

    it('should update scholarship successfully', async () => {
      const updateData = {
        title: 'Beca Actualizada',
        description: 'Nueva descripción',
        vacancies: 10
      };

      const response = await request(app)
        .patch(`/api/admin/scholarships/${scholarship._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Beca actualizada exitosamente');
      expect(response.body.data.scholarship.title).toBe('Beca Actualizada');
      expect(response.body.data.scholarship.vacancies).toBe(10);
    });

    it('should validate state transitions - draft to published', async () => {
      const response = await request(app)
        .patch(`/api/admin/scholarships/${scholarship._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'published' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarship.status).toBe('published');
    });

    it('should reject invalid state transitions', async () => {
      const response = await request(app)
        .patch(`/api/admin/scholarships/${scholarship._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'archived' }) // No se puede ir de draft a archived directamente
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Transición de estado inválida');
    });

    it('should reject publishing scholarship with past close date', async () => {
      // Actualizar con fecha de cierre pasada
      await Scholarship.findByIdAndUpdate(scholarship._id, {
        closeAt: new Date('2020-01-01')
      });

      const response = await request(app)
        .patch(`/api/admin/scholarships/${scholarship._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'published' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('fecha de cierre pasada');
    });

    it('should return 404 for non-existent scholarship', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/admin/scholarships/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'No existe' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Beca no encontrada');
    });
  });
});
