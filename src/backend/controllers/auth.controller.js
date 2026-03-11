const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.users;

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { 
      expiresIn: process.env.JWT_EXPIRATION || '24h'
    }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    // Create user
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'user'
    };

    // Save User in the database
    const data = await User.create(user);

    // Generate token
    const token = generateToken(data);

    res.status(201).send({
      message: 'Utilisateur enregistré avec succès !',
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      },
      accessToken: token
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Une erreur s\'est produite lors de l\'enregistrement de l\'utilisateur.'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return res.status(404).send({
        message: 'Utilisateur introuvable !'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).send({
        message: 'Le compte est inactif !'
      });
    }

    // Validate password
    const isPasswordValid = await user.validPassword(password);

    if (!isPasswordValid) {
      return res.status(401).send({
        message: 'Mot de passe invalide !'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.send({
      message: 'Connexion réussie !',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken: token
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Une erreur s\'est produite lors de la connexion.'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).send({
        message: 'Utilisateur introuvable !'
      });
    }

    res.send(user);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erreur lors de la récupération du profil utilisateur.'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const id = req.userId;
    
    // Don't allow updating role through this endpoint
    const { role, ...updateData } = req.body;

    const [num] = await User.update(updateData, {
      where: { id: id }
    });

    if (num === 1) {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      res.send({
        message: 'Profil mis à jour avec succès !',
        user: user
      });
    } else {
      res.status(404).send({
        message: `Impossible de mettre à jour le profil utilisateur. Utilisateur introuvable ou aucune modification effectuée.`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erreur lors de la mise à jour du profil utilisateur.'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).send({
        message: 'Le mot de passe actuel et le nouveau mot de passe sont requis !'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères !'
      });
    }

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).send({
        message: 'Utilisateur introuvable !'
      });
    }

    // Validate current password
    const isPasswordValid = await user.validPassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).send({
        message: 'Le mot de passe actuel est incorrect !'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.send({
      message: 'Mot de passe modifié avec succès !'
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erreur lors du changement de mot de passe.'
    });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.send(users);
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erreur lors de la récupération des utilisateurs.'
    });
  }
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const id = req.params.id;
    const { role } = req.body;

    if (!role || !['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).send({
        message: 'Rôle invalide !'
      });
    }

    const [num] = await User.update({ role }, {
      where: { id: id }
    });

    if (num === 1) {
      res.send({
        message: 'Rôle de l\'utilisateur mis à jour avec succès !'
      });
    } else {
      res.status(404).send({
        message: `Impossible de mettre à jour l\'utilisateur. Utilisateur avec id=${id} introuvable !`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erreur lors de la mise à jour du rôle de l\'utilisateur.'
    });
  }
};

// Admin: Deactivate/Activate user
exports.toggleUserStatus = async (req, res) => {
  try {
    const id = req.params.id;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).send({
        message: `Utilisateur avec id=${id} introuvable !`
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.send({
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès !`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || 'Erreur lors du changement de statut de l\'utilisateur.'
    });
  }
};
