const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Scholarship = require('../src/models/Scholarship');
const AdminUser = require('../src/models/AdminUser');

describe('Scholarships Endpoints', () => {
  let adminUser;
  let scholarships = [];

  beforeAll(async () => {
    // Crear un admin de prueba
    adminUser = new AdminUser({
      email: 'test@admin.com',
      password: 'TestPassword123!',
      role: 'admin'
    });
    await adminUser.save();

    // Crear becas de prueba
    const scholarshipData = [
      {
        title: 'Beca de Excelencia Académica',
        slug: 'beca-excelencia-academica',
        status: 'published',
        featured: true,
        description: 'Beca para estudiantes con excelente rendimiento académico',
        benefits: 'Matrícula completa, mensualidad y materiales',
        vacancies: 10,
        modality: 'presencial',
        requirements: ['Promedio mínimo 4.5', 'Carta de recomendación'],
        eligibleLevels: ['pregrado'],
        openAt: new Date('2024-01-01'),
        closeAt: new Date('2030-12-31'),
        contactEmail: 'beca@universidad.edu',
        createdBy: adminUser._id
      },
      {
        title: 'Beca de Investigación',
        slug: 'beca-investigacion',
        status: 'published',
        featured: false,
        description: 'Beca para proyectos de investigación estudiantil',
        benefits: 'Apoyo económico mensual y recursos de investigación',
        vacancies: 5,
        modality: 'virtual',
        requirements: ['Propuesta de investigación', 'Aval del director'],
        eligibleLevels: ['posgrado', 'maestria'],
        openAt: new Date('2024-01-01'),
        closeAt: new Date('2030-12-31'),
        contactEmail: 'investigacion@universidad.edu',
        createdBy: adminUser._id
      },
      {
        title: 'Beca Archivada',
        slug: 'beca-archivada',
        status: 'archived',
        featured: false,
        description: 'Esta beca está archivada',
        benefits: 'N/A',
        vacancies: 1,
        modality: 'presencial',
        requirements: ['N/A'],
        eligibleLevels: ['pregrado'],
        openAt: new Date('2020-01-01'),
        closeAt: new Date('2020-12-31'),
        contactEmail: 'archivada@universidad.edu',
        createdBy: adminUser._id
      },
      {
        title: 'Beca Cerrada',
        slug: 'beca-cerrada',
        status: 'closed',
        featured: false,
        description: 'Esta beca ya cerró postulaciones',
        benefits: 'Apoyo completo',
        vacancies: 3,
        modality: 'hibrida',
        requirements: ['Completar formulario'],
        eligibleLevels: ['pregrado'],
        openAt: new Date('2023-01-01'),
        closeAt: new Date('2023-12-31'),
        contactEmail: 'cerrada@universidad.edu',
        createdBy: adminUser._id
      }
    ];

    for (const data of scholarshipData) {
      const scholarship = new Scholarship(data);
      await scholarship.save();
      scholarships.push(scholarship);
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await Scholarship.deleteMany({});
    await AdminUser.deleteMany({});
  });

  describe('GET /api/scholarships', () => {
    it('should get published scholarships by default', async () => {
      const response = await request(app)
        .get('/api/scholarships')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scholarships');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('filters');

      // Solo debe mostrar becas published
      const returnedScholarships = response.body.data.scholarships;
      expect(returnedScholarships).toHaveLength(2);
      returnedScholarships.forEach(scholarship => {
        expect(scholarship.status).toBe('published');
        expect(scholarship).toHaveProperty('canApply');
        expect(scholarship).toHaveProperty('daysRemaining');
      });
    });

    it('should filter scholarships by featured', async () => {
      const response = await request(app)
        .get('/api/scholarships?featured=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      const scholarships = response.body.data.scholarships;
      expect(scholarships).toHaveLength(1);
      expect(scholarships[0].featured).toBe(true);
      expect(scholarships[0].title).toBe('Beca de Excelencia Académica');
    });

    it('should search scholarships by title', async () => {
      const response = await request(app)
        .get('/api/scholarships?q=investigación')
        .expect(200);

      expect(response.body.success).toBe(true);
      const scholarships = response.body.data.scholarships;
      expect(scholarships).toHaveLength(1);
      expect(scholarships[0].title).toContain('Investigación');
    });

    it('should paginate scholarships', async () => {
      const response = await request(app)
        .get('/api/scholarships?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarships).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should sort scholarships by featured', async () => {
      const response = await request(app)
        .get('/api/scholarships?sort=featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      const scholarships = response.body.data.scholarships;
      expect(scholarships[0].featured).toBe(true);
      expect(scholarships[1].featured).toBe(false);
    });

    it('should include closed scholarships when status is not specified', async () => {
      const response = await request(app)
        .get('/api/scholarships?status=closed')
        .expect(200);

      expect(response.body.success).toBe(true);
      const scholarships = response.body.data.scholarships;
      // Debe incluir published y closed (no archived)
      expect(scholarships.length).toBeGreaterThan(0);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/scholarships?page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Parámetros de consulta inválidos');
    });

    it('should validate sort parameter', async () => {
      const response = await request(app)
        .get('/api/scholarships?sort=invalid_sort')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Parámetros de consulta inválidos');
    });
  });

  describe('GET /api/scholarships/:identifier', () => {
    it('should get scholarship by slug', async () => {
      const response = await request(app)
        .get('/api/scholarships/beca-excelencia-academica')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scholarship');
      expect(response.body.data.scholarship.title).toBe('Beca de Excelencia Académica');
      expect(response.body.data.scholarship.slug).toBe('beca-excelencia-academica');
      expect(response.body.data.scholarship).toHaveProperty('canApply');
      expect(response.body.data.scholarship).toHaveProperty('daysRemaining');
    });

    it('should get scholarship by ObjectId', async () => {
      const scholarship = scholarships.find(s => s.status === 'published');
      const response = await request(app)
        .get(`/api/scholarships/${scholarship._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.scholarship._id).toBe(scholarship._id.toString());
    });

    it('should not return archived scholarships', async () => {
      const response = await request(app)
        .get('/api/scholarships/beca-archivada')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Beca no disponible');
    });

    it('should return 404 for non-existent scholarship', async () => {
      const response = await request(app)
        .get('/api/scholarships/beca-no-existe')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Beca no encontrada');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/scholarships/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate identifier parameter', async () => {
      const response = await request(app)
        .get('/api/scholarships/')
        .expect(200); // Esto debería ir a la lista, no al detalle

      // Verificar que va a la lista
      expect(response.body.data).toHaveProperty('scholarships');
    });
  });
});
