/**
 * Ticket Controller
 * Handles all business logic for ticket operations (CRUD).
 * Manages validation, error handling, and database interactions.
 */

const db = require("../models");
const Ticket = db.tickets;
const User = db.users;
const Op = db.Sequelize.Op;

// Configuration for eager loading the assignee user relationship
const includeAssignee = {
  model: User,
  as: "assignee",
  attributes: ["id", "name", "role"],
};

/**
 * Helper function to validate and parse assignee ID
 * @param {*} value - The assignee ID to validate
 * @returns {Object} Object with validation result: { hasValue, value?, error? }
 */
const parseAssigneeId = (value) => {
  if (value === undefined) {
    return { hasValue: false };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  const numericId = Number(value);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return { error: "L'identifiant d'assignation est invalide." };
  }

  return { hasValue: true, value: numericId };
};

/**
 * Create a new ticket
 * POST /api/tickets
 * @param {Object} req - Express request object with body { title, description?, requester?, status?, assigneeId? }
 * @param {Object} res - Express response object
 * @returns {Object} Created ticket with 201 status or error with 400/500 status
 */
exports.create = async (req, res) => {
  const title = (req.body.title || "").trim();
  const parsedAssigneeId = parseAssigneeId(req.body.assigneeId);

  if (!title) {
    return res.status(400).send({
      message: "Le titre est requis.",
    });
  }

  if (parsedAssigneeId.error || parsedAssigneeId.value === null) {
    return res.status(400).send({
      message: parsedAssigneeId.error || "L'assignation ne peut pas etre nulle lors de la creation.",
    });
  }

  try {
    if (parsedAssigneeId.hasValue) {
      const assignee = await User.findByPk(parsedAssigneeId.value);

      if (!assignee) {
        return res.status(400).send({
          message: "Utilisateur assigne introuvable.",
        });
      }
    }

    const createdTicket = await Ticket.create({
      title,
      description: req.body.description || null,
      requester: req.body.requester || "anonymous",
      status: req.body.status === "closed" ? "closed" : "open",
      assigneeId: parsedAssigneeId.hasValue ? parsedAssigneeId.value : null,
    });

    const ticket = await Ticket.findByPk(createdTicket.id, {
      include: [includeAssignee],
    });

    res.status(201).send(ticket);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur s'est produite lors de la creation du ticket.",
    });
  }
};

/**
 * Get all tickets with optional search and filter
 * GET /api/tickets?q=search_term&status=open|closed
 * @param {Object} req - Express request object with query params: { q?, status? }
 * @param {Object} res - Express response object
 * @returns {Array} Array of tickets with 200 status or error with 500 status
 */
exports.findAll = async (req, res) => {
  const query = (req.query.q || "").trim();
  const status = req.query.status;

  // Build dynamic where clause based on search and filter parameters
  const condition = {};

  // Search in title and description if query provided
  if (query) {
    condition[Op.or] = [
      { title: { [Op.like]: `%${query}%` } },
      { description: { [Op.like]: `%${query}%` } },
    ];
  }

  // Filter by status if valid status provided
  if (status === "open" || status === "closed") {
    condition.status = status;
  }

  try {
    // Fetch all matching tickets sorted by creation date (newest first)
    const tickets = await Ticket.findAll({
      where: condition,
      order: [["createdAt", "DESC"]],
      include: [includeAssignee],
    });

    res.status(200).send(tickets);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur s'est produite lors de la recuperation des tickets.",
    });
  }
};

/**
 * Get a specific ticket by ID
 * GET /api/tickets/:id
 * @param {Object} req - Express request object with params: { id }
 * @param {Object} res - Express response object
 * @returns {Object} Ticket object with 200 status or error with 404/500 status
 */
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    // Find ticket by primary key and include related assignee
    const fullTicket = await Ticket.findByPk(id, {
      include: [includeAssignee],
    });

    if (!fullTicket) {
      return res.status(404).send({
        message: `Ticket avec id=${id} introuvable.`,
      });
    }

    res.status(200).send(fullTicket);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Erreur lors de la recuperation du ticket avec id=${id}.`,
    });
  }
};

/**
 * Update an existing ticket
 * PUT /api/tickets/:id
 * @param {Object} req - Express request object with params: { id } and body: { title?, description?, requester?, status?, assigneeId? }
 * @param {Object} res - Express response object
 * @returns {Object} Updated ticket with 200 status or error with 400/404/500 status
 */
exports.update = async (req, res) => {
  const id = req.params.id;
  const updateData = {};
  const parsedAssigneeId = parseAssigneeId(req.body.assigneeId);

  // Build update data object only from valid fields provided in request
  if (typeof req.body.title === "string") {
    updateData.title = req.body.title.trim();
  }

  if (req.body.description !== undefined) {
    updateData.description = req.body.description;
  }

  if (req.body.requester !== undefined) {
    updateData.requester = req.body.requester;
  }

  // Only allow status to be "open" or "closed"
  if (req.body.status === "open" || req.body.status === "closed") {
    updateData.status = req.body.status;
  }

  // Check for assignee ID parsing errors
  if (parsedAssigneeId.error) {
    return res.status(400).send({
      message: parsedAssigneeId.error,
    });
  }

  if (parsedAssigneeId.hasValue) {
    updateData.assigneeId = parsedAssigneeId.value;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).send({
      message: "Aucune donnee valide a mettre a jour.",
    });
  }

  if (updateData.title === "") {
    return res.status(400).send({
      message: "Le titre ne peut pas etre vide.",
    });
  }

  try {
    // Verify that the assignee user exists in database before updating
    if (parsedAssigneeId.hasValue && parsedAssigneeId.value !== null) {
      const assignee = await User.findByPk(parsedAssigneeId.value);

      if (!assignee) {
        return res.status(400).send({
          message: "Utilisateur assigne introuvable.",
        });
      }
    }

    // Update ticket in database
    const [updatedRows] = await Ticket.update(updateData, {
      where: { id },
    });

    // Check if ticket was found and updated
    if (updatedRows !== 1) {
      return res.status(404).send({
        message: `Ticket avec id=${id} introuvable.`,
      });
    }

    // Fetch and return updated ticket with assignee relationship
    const updatedTicket = await Ticket.findByPk(id, {
      include: [includeAssignee],
    });
    res.status(200).send(updatedTicket);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Erreur lors de la mise a jour du ticket avec id=${id}.`,
    });
  }
};

/**
 * Delete a ticket
 * DELETE /api/tickets/:id
 * @param {Object} req - Express request object with params: { id }
 * @param {Object} res - Express response object
 * @returns {Object} Success message with 200 status or error with 404/500 status
 */
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const deletedRows = await Ticket.destroy({
      where: { id },
    });

    if (deletedRows !== 1) {
      return res.status(404).send({
        message: `Ticket avec id=${id} introuvable.`,
      });
    }

    res.status(200).send({
      message: "Ticket supprime avec succes.",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || `Erreur lors de la suppression du ticket avec id=${id}.`,
    });
  }
};
