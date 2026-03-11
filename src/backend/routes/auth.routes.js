module.exports = (app) => {
  const auth = require('../controllers/auth.controller.js');
  const { verifyToken, isAdmin } = require('../middlewares/auth.middleware.js');
  const { validateRegister, validateLogin, checkValidation } = require('../middlewares/validation.middleware.js');

  var router = require('express').Router();

  app.use('/api/auth', router);

  // Public
  // Inscription d'un nouvel utilisateur
  router.post('/register', validateRegister, checkValidation, auth.register);

  // Connexion d'un utilisateur
  router.post('/login', validateLogin, checkValidation, auth.login);

  // Routes protégées pour tester le token
  // Retrouver le profil de l'utilisateur connecté
  router.get('/profile', verifyToken, auth.getProfile);

  // Mettre à jour le profil de l'utilisateur connecté
  router.put('/profile', verifyToken, auth.updateProfile);

  // Changer le mot de passe de l'utilisateur connecté
  router.post('/change-password', verifyToken, auth.changePassword);

  // Admin routes
  // Retrouver tous les utilisateurs
  router.get('/users', [verifyToken, isAdmin], auth.getAllUsers);

  // Mettre à jour le rôle d'un utilisateur
  router.put('/users/:id/role', [verifyToken, isAdmin], auth.updateUserRole);

  // Activer/désactiver un compte utilisateur
  router.put('/users/:id/toggle-status', [verifyToken, isAdmin], auth.toggleUserStatus);
};
