const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const AdminUser = require('../src/models/AdminUser');

describe('Auth Endpoints', () => {
  let adminUser;
  const validCredentials = {
    email: 'test@admin.com',
    password: 'TestPassword123!'
  };

  beforeAll(async () => {
    // Crear un admin de prueba
    adminUser = new AdminUser({
      email: validCredentials.email,
      password: validCredentials.password,
      role: 'admin'
    });
    await adminUser.save();
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await AdminUser.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data).toHaveProperty('admin');
      expect(response.body.data.admin).toHaveProperty('id');
      expect(response.body.data.admin).toHaveProperty('email', validCredentials.email);
      expect(response.body.data.admin).toHaveProperty('role', 'admin');
      expect(response.body.data.admin).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@admin.com',
          password: validCredentials.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validCredentials.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: validCredentials.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validCredentials.email,
          password: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Datos de entrada inválidos');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Obtener token de autenticación
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);
      
      authToken = loginResponse.body.data.accessToken;
    });

    it('should return admin info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('admin');
      expect(response.body.data.admin).toHaveProperty('id');
      expect(response.body.data.admin).toHaveProperty('email', validCredentials.email);
      expect(response.body.data.admin).toHaveProperty('role', 'admin');
      expect(response.body.data.admin).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token de acceso requerido');
    });

    it('should fail with invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidToken')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Formato de token inválido. Debe ser: Bearer <token>');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token inválido');
    });
  });
});
