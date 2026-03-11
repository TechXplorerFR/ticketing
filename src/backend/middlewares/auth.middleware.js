const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.users;

// Middleware pour vérifier le token JWT et extraire les informations de l'utilisateur
const verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    
    if (!token) {
      return res.status(403).send({
        message: 'No token provided!'
      });
    }

    // Supprimer le préfixe "Bearer " si présent
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET || 'your-secret-key');
    
    // Retrouver l'utilisateur dans la base de données
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).send({
        message: 'User not found!'
      });
    }

    if (!user.isActive) {
      return res.status(401).send({
        message: 'Account is inactive!'
      });
    }

    // Attacher les informations de l'utilisateur à la requête
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).send({
      message: 'Unauthorized! Invalid token.',
      error: error.message
    });
  }
};

// Verifier que l'utilisateur est admin
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).send({
      message: 'Require Admin Role!'
    });
  }
  next();
};

// Veirifier si l'utilisqteur est admin ou modo
const isModerator = (req, res, next) => {
  if (req.userRole !== 'moderator' && req.userRole !== 'admin') {
    return res.status(403).send({
      message: 'Require Moderator or Admin Role!'
    });
  }
  next();
};

// Verifier si l'utulisateur a un role utilise
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).send({
        message: `Require one of the following roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  hasRole
};

module.exports = authJwt;
