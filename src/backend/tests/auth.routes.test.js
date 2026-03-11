// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const db = require('../models');

describe('Routes API Auth - Tests d\'authentification et de rôles', () => {
  let adminToken, userToken, moderatorToken;
  let adminUser, normalUser, moderatorUser;

  beforeAll(async () => {
    // Sync database
    await db.sequelize.sync({ force: true });

    // Create test users with different roles
    // Admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });
    adminToken = adminResponse.body.accessToken;
    adminUser = adminResponse.body.user;

    // Normal user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user',
        email: 'user@test.com',
        password: 'user123',
        role: 'user'
      });
    userToken = userResponse.body.accessToken;
    normalUser = userResponse.body.user;

    // Moderator user
    const moderatorResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'moderator',
        email: 'moderator@test.com',
        password: 'mod123',
        role: 'moderator'
      });
    moderatorToken = moderatorResponse.body.accessToken;
    moderatorUser = moderatorResponse.body.user;
  });

  afterAll(async () => {
    // Clean up and close database connection
    await db.sequelize.close();
  });

  // ========== Tests d'authentification ==========
  describe('POST /api/auth/register', () => {
    it('devrait enregistrer un nouvel utilisateur avec le rôle par défaut "user"', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.username).toBe('newuser');
    });

    it('devrait rejeter l\'inscription avec un email en double', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'user@test.com', // Already exists
          password: 'password123'
        })
        .expect(400);
    });

    it('devrait rejeter l\'inscription avec un email invalide', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'invalidEmail',
          email: 'notanemail',
          password: 'password123'
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('devrait se connecter avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('user@test.com');
      expect(response.body.user.role).toBe('user');
    });

    it('devrait rejeter la connexion avec un mot de passe invalide', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('devrait rejeter la connexion avec un email inexistant', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
        .expect(404);
    });

    it('devrait rejeter la connexion avec des identifiants manquants', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com'
        })
        .expect(400);
    });
  });

  // ========== Tests des routes protégées ==========
  describe('GET /api/auth/profile', () => {
    it('devrait obtenir le profil avec un token valide', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', userToken)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('user@test.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('devrait rejeter la requête sans token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(403);
    });

    it('devrait rejeter la requête avec un token invalide', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', 'invalid-token')
        .expect(401);
    });

    it('devrait fonctionner avec le format de token Bearer', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe('user@test.com');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('devrait mettre à jour le profil avec un token valide', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('x-access-token', userToken)
        .send({
          username: 'updateduser'
        })
        .expect(200);

      expect(response.body.message).toContain('mis à jour avec succès');
      expect(response.body.user.username).toBe('updateduser');
    });

    it('ne devrait pas permettre le changement de rôle via la mise à jour du profil', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('x-access-token', userToken)
        .send({
          username: 'user',
          role: 'admin' // Trying to escalate privileges
        })
        .expect(200);

      // Verify role hasn't changed
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', userToken)
        .expect(200);

      expect(profileResponse.body.role).toBe('user');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('devrait changer le mot de passe avec le mot de passe actuel correct', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('x-access-token', userToken)
        .send({
          currentPassword: 'user123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('modifié avec succès');

      // Verify old password no longer works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'user123'
        })
        .expect(401);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'newpassword123'
        })
        .expect(200);

      // Update token for future tests
      userToken = loginResponse.body.accessToken;
    });

    it('devrait rejeter le changement de mot de passe avec un mot de passe actuel erroné', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('x-access-token', userToken)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);
    });

    it('devrait rejeter le changement de mot de passe avec un nouveau mot de passe trop court', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('x-access-token', userToken)
        .send({
          currentPassword: 'newpassword123',
          newPassword: '123'
        })
        .expect(400);
    });
  });

  // ========== Tests de contrôle d'accès basé sur les rôles ==========
  describe('Routes Admin - GET /api/auth/users', () => {
    it('devrait permettre à l\'admin d\'obtenir tous les utilisateurs', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('x-access-token', adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Verify passwords are excluded
      response.body.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('devrait empêcher un utilisateur normal d\'obtenir tous les utilisateurs', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('x-access-token', userToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('devrait empêcher un modérateur d\'obtenir tous les utilisateurs', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('x-access-token', moderatorToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('devrait rejeter la requête sans token', async () => {
      await request(app)
        .get('/api/auth/users')
        .expect(403);
    });
  });

  describe('Routes Admin - PUT /api/auth/users/:id/role', () => {
    it('devrait permettre à l\'admin de mettre à jour le rôle d\'un utilisateur', async () => {
      const response = await request(app)
        .put(`/api/auth/users/${normalUser.id}/role`)
        .set('x-access-token', adminToken)
        .send({
          role: 'moderator'
        })
        .expect(200);

      expect(response.body.message).toContain('mis à jour avec succès');

      // Verify role was updated
      const usersResponse = await request(app)
        .get('/api/auth/users')
        .set('x-access-token', adminToken)
        .expect(200);

      const updatedUser = usersResponse.body.find(u => u.id === normalUser.id);
      expect(updatedUser.role).toBe('moderator');

      // Restore original role
      await request(app)
        .put(`/api/auth/users/${normalUser.id}/role`)
        .set('x-access-token', adminToken)
        .send({ role: 'user' });
    });

    it('devrait empêcher un utilisateur normal de mettre à jour les rôles', async () => {
      const response = await request(app)
        .put(`/api/auth/users/${normalUser.id}/role`)
        .set('x-access-token', userToken)
        .send({
          role: 'admin'
        })
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('devrait rejeter un rôle invalide', async () => {
      await request(app)
        .put(`/api/auth/users/${normalUser.id}/role`)
        .set('x-access-token', adminToken)
        .send({
          role: 'superadmin'
        })
        .expect(400);
    });

    it('devrait gérer un utilisateur inexistant', async () => {
      await request(app)
        .put('/api/auth/users/99999/role')
        .set('x-access-token', adminToken)
        .send({
          role: 'user'
        })
        .expect(404);
    });
  });

  describe('Routes Admin - PUT /api/auth/users/:id/toggle-status', () => {
    it('devrait permettre à l\'admin de désactiver un compte utilisateur', async () => {
      const response = await request(app)
        .put(`/api/auth/users/${normalUser.id}/toggle-status`)
        .set('x-access-token', adminToken)
        .expect(200);

      expect(response.body.message).toContain('désactivé');
      expect(response.body.isActive).toBe(false);

      // Verify user cannot login when inactive
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'newpassword123'
        })
        .expect(401);
    });

    it('devrait permettre à l\'admin de réactiver un compte utilisateur', async () => {
      const response = await request(app)
        .put(`/api/auth/users/${normalUser.id}/toggle-status`)
        .set('x-access-token', adminToken)
        .expect(200);

      expect(response.body.message).toContain('activé');
      expect(response.body.isActive).toBe(true);

      // Verify user can login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('devrait empêcher un utilisateur normal de basculer le statut d\'un utilisateur', async () => {
      const response = await request(app)
        .put(`/api/auth/users/${adminUser.id}/toggle-status`)
        .set('x-access-token', userToken)
        .expect(403);

      expect(response.body.message).toContain('Admin');
    });

    it('devrait gérer un utilisateur inexistant', async () => {
      await request(app)
        .put('/api/auth/users/99999/toggle-status')
        .set('x-access-token', adminToken)
        .expect(404);
    });
  });

  // ========== Tests de vérification des rôles ==========
  describe('Vérification des rôles', () => {
    it('devrait vérifier que le rôle admin a accès aux routes admin', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('x-access-token', adminToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait vérifier que le rôle user ne peut pas accéder aux routes admin', async () => {
      await request(app)
        .get('/api/auth/users')
        .set('x-access-token', userToken)
        .expect(403);
    });

    it('devrait vérifier que le rôle moderator ne peut pas accéder aux routes réservées aux admins', async () => {
      await request(app)
        .get('/api/auth/users')
        .set('x-access-token', moderatorToken)
        .expect(403);
    });

    it('devrait vérifier que tous les rôles peuvent accéder à leur propre profil', async () => {
      // Admin
      await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', adminToken)
        .expect(200);

      // User
      await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', userToken)
        .expect(200);

      // Moderator
      await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', moderatorToken)
        .expect(200);
    });

    it('devrait retourner les informations de rôle correctes dans le token', async () => {
      const adminProfile = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', adminToken)
        .expect(200);

      expect(adminProfile.body.role).toBe('admin');

      const userProfile = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', userToken)
        .expect(200);

      expect(userProfile.body.role).toBe('user');

      const moderatorProfile = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', moderatorToken)
        .expect(200);

      expect(moderatorProfile.body.role).toBe('moderator');
    });
  });

  // ========== Cas limites et sécurité ==========
  describe('Cas limites et sécurité', () => {
    it('ne devrait pas exposer le mot de passe dans aucune réponse', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', adminToken)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');

      const usersResponse = await request(app)
        .get('/api/auth/users')
        .set('x-access-token', adminToken)
        .expect(200);

      usersResponse.body.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('devrait rejeter les tokens expirés ou mal formés', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', 'malformed.token.here')
        .expect(401);
    });

    it('devrait gérer les requêtes concurrentes avec le même token', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/auth/profile')
          .set('x-access-token', userToken)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.email).toBe('user@test.com');
      });
    });
  });
});
