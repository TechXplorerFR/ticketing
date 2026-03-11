// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const db = require('../models');

describe('Example API Routes', () => {
  let createdExampleId;
  let adminToken, userToken, moderatorToken;
  let adminUserId, normalUserId;

  beforeAll(async () => {
    // Sync database
    await db.sequelize.sync({ force: true });

    // Create test users with different roles
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'adminexample',
        email: 'adminexample@test.com',
        password: 'admin123',
        role: 'admin'
      })
      .expect(201);
    
    adminToken = adminResponse.body.accessToken;
    adminUserId = adminResponse.body.user.id;

    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'userexample',
        email: 'userexample@test.com',
        password: 'user123',
        role: 'user'
      })
      .expect(201);
    
    userToken = userResponse.body.accessToken;
    normalUserId = userResponse.body.user.id;

    const moderatorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'moderatorexample',
        email: 'moderatorexample@test.com',
        password: 'mod123',
        role: 'moderator'
      })
      .expect(201);
    
    moderatorToken = moderatorResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up and close database connection
    await db.sequelize.close();
  });

  describe('POST /api/examples', () => {
    it('should create a new example with valid token', async () => {
      const newExample = {
        type: 'test type',
        age: 25,
        isOK: true,
        date_of_death: '2026-01-01'
      };

      const response = await request(app)
        .post('/api/examples')
        .set('x-access-token', userToken)
        .send(newExample)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(newExample.type);
      expect(response.body.age).toBe(newExample.age);
      expect(response.body.isOK).toBe(newExample.isOK);
      
      createdExampleId = response.body.id;
    });

    it('should create an example with minimal data', async () => {
      const response = await request(app)
        .post('/api/examples')
        .set('x-access-token', userToken)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should reject creation without token', async () => {
      const newExample = {
        type: 'test type',
        age: 25
      };

      await request(app)
        .post('/api/examples')
        .send(newExample)
        .expect(403);
    });

    it('should allow admin to create example', async () => {
      const response = await request(app)
        .post('/api/examples')
        .set('x-access-token', adminToken)
        .send({ type: 'admin example' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should allow moderator to create example', async () => {
      const response = await request(app)
        .post('/api/examples')
        .set('x-access-token', moderatorToken)
        .send({ type: 'moderator example' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('GET /api/examples', () => {
    it('should retrieve all examples with valid token', async () => {
      const response = await request(app)
        .get('/api/examples')
        .set('x-access-token', userToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter examples by type', async () => {
      const response = await request(app)
        .get('/api/examples?type=test')
        .set('x-access-token', userToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/examples')
        .expect(403);
    });
  });

  describe('GET /api/examples/:id', () => {
    it('should retrieve a single example by id with valid token', async () => {
      const response = await request(app)
        .get(`/api/examples/${createdExampleId}`)
        .set('x-access-token', userToken)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdExampleId);
      expect(response.body.type).toBe('test type');
    });

    it('should return 404 for non-existent example', async () => {
      const response = await request(app)
        .get('/api/examples/99999')
        .set('x-access-token', userToken)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('introuvable');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get(`/api/examples/${createdExampleId}`)
        .expect(403);
    });
  });

  describe('PUT /api/examples/:id', () => {
    it('should allow moderator to update an example', async () => {
      const updatedData = {
        type: 'updated by moderator',
        age: 30
      };

      const response = await request(app)
        .put(`/api/examples/${createdExampleId}`)
        .set('x-access-token', moderatorToken)
        .send(updatedData)
        .expect(200);

      expect(response.body.message).toContain('mis à jour avec succès');
    });

    it('should allow admin to update an example', async () => {
      const updatedData = {
        type: 'updated by admin',
        age: 35
      };

      const response = await request(app)
        .put(`/api/examples/${createdExampleId}`)
        .set('x-access-token', adminToken)
        .send(updatedData)
        .expect(200);

      expect(response.body.message).toContain('mis à jour avec succès');
    });

    it('should reject normal user from updating an example', async () => {
      const updatedData = {
        type: 'trying to update',
        age: 40
      };

      const response = await request(app)
        .put(`/api/examples/${createdExampleId}`)
        .set('x-access-token', userToken)
        .send(updatedData)
        .expect(403);

      expect(response.body.message).toContain('Moderator');
    });

    it('should handle update of non-existent example', async () => {
      const response = await request(app)
        .put('/api/examples/99999')
        .set('x-access-token', moderatorToken)
        .send({ type: 'test' })
        .expect(200);

      expect(response.body.message).toContain('Impossible de mettre à jour');
    });

    it('should reject update without token', async () => {
      await request(app)
        .put(`/api/examples/${createdExampleId}`)
        .send({ type: 'test' })
        .expect(403);
    });
  });

  describe('DELETE /api/examples/:id', () => {
    it('should allow admin to delete an example', async () => {
      const response = await request(app)
        .delete(`/api/examples/${createdExampleId}`)
        .set('x-access-token', adminToken)
        .expect(200);

      expect(response.body.message).toContain('supprimé avec succès');
    });

    it('should reject moderator from deleting an example', async () => {
      // Create a new example first
      const createResponse = await request(app)
        .post('/api/examples')
        .set('x-access-token', adminToken)
        .send({ type: 'test for deletion' });
      
      const exampleId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/examples/${exampleId}`)
        .set('x-access-token', moderatorToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('should reject normal user from deleting an example', async () => {
      // Create a new example first
      const createResponse = await request(app)
        .post('/api/examples')
        .set('x-access-token', adminToken)
        .send({ type: 'test for deletion' });
      
      const exampleId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/examples/${exampleId}`)
        .set('x-access-token', userToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('should handle deletion of non-existent example', async () => {
      const response = await request(app)
        .delete('/api/examples/99999')
        .set('x-access-token', adminToken)
        .expect(200);

      expect(response.body.message).toContain('Impossible de supprimer');
    });

    it('should reject deletion without token', async () => {
      await request(app)
        .delete('/api/examples/1')
        .expect(403);
    });
  });

  describe('DELETE /api/examples', () => {
    beforeEach(async () => {
      // Create some test data
      await request(app)
        .post('/api/examples')
        .set('x-access-token', adminToken)
        .send({ type: 'test1' });
      await request(app)
        .post('/api/examples')
        .set('x-access-token', adminToken)
        .send({ type: 'test2' });
    });

    it('should allow admin to delete all examples', async () => {
      const response = await request(app)
        .delete('/api/examples')
        .set('x-access-token', adminToken)
        .expect(200);

      expect(response.body.message).toContain('supprimés avec succès');
    });

    it('should reject moderator from deleting all examples', async () => {
      const response = await request(app)
        .delete('/api/examples')
        .set('x-access-token', moderatorToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('should reject normal user from deleting all examples', async () => {
      const response = await request(app)
        .delete('/api/examples')
        .set('x-access-token', userToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('should reject deletion without token', async () => {
      await request(app)
        .delete('/api/examples')
        .expect(403);
    });
  });
});
