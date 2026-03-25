/**
 * User Controller
 * Handles all business logic for user operations (create, read, update roles).
 * Manages validation, role management, and database interactions.
 */

const db = require("../models");

const User = db.users;

// Enum of valid user roles in the system
const VALID_ROLES = ["viewer", "agent", "admin"];

/**
 * Helper function to validate user role
 * @param {string} role - The role to validate
 * @returns {boolean} True if role is valid
 */
const isValidRole = (role) => VALID_ROLES.includes(role);

/**
 * Create a new user
 * POST /api/users
 * @param {Object} req - Express request object with body { name, role? }
 * @param {Object} res - Express response object
 * @returns {Object} Created user with 201 status or error with 400/500 status
 */
exports.create = async (req, res) => {
  // Validate and trim name
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const role = req.body.role || "viewer";

  if (!name) {
    return res.status(400).send({
      message: "Le nom utilisateur est requis.",
    });
  }

  if (!isValidRole(role)) {
    return res.status(400).send({
      message: "Role utilisateur invalide.",
    });
  }

  try {
    // Create user in database
    const user = await User.create({
      name,
      role,
    });

    res.status(201).send(user);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur s'est produite lors de la creation de l'utilisateur.",
    });
  }
};

/**
 * Get all users
 * GET /api/users
 * @param {Object} _req - Express request object (unused)
 * @param {Object} res - Express response object
 * @returns {Array} Array of all users with 200 status or error with 500 status
 */
exports.findAll = async (_req, res) => {
  try {
    // Fetch all users sorted by creation date (newest first)
    const users = await User.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur s'est produite lors de la recuperation des utilisateurs.",
    });
  }
};

/**
 * Update a user's role
 * PUT /api/users/:id/role
 * @param {Object} req - Express request object with params: { id } and body: { role }
 * @param {Object} res - Express response object
 * @returns {Object} Updated user with 200 status or error with 400/404/500 status
 */
exports.updateRole = async (req, res) => {
  const id = req.params.id;
  const role = req.body.role;

  // Validate the new role
  if (!isValidRole(role)) {
    return res.status(400).send({
      message: "Role utilisateur invalide.",
    });
  }

  try {
    // Update user role in database
    const [updatedRows] = await User.update(
      { role },
      {
        where: { id },
      }
    );

    // Check if user was found and updated
    if (updatedRows !== 1) {
      return res.status(404).send({
        message: `Utilisateur avec id=${id} introuvable.`,
      });
    }

    // Fetch and return updated user
    const updatedUser = await User.findByPk(id);
    res.status(200).send(updatedUser);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Erreur lors de la mise a jour du role pour l'utilisateur avec id=${id}.`,
    });
  }
};