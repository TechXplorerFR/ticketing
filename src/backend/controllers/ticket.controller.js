const db = require("../models");
const Ticket = db.tickets;
const User = db.users;
const Op = db.Sequelize.Op;

const includeAssignee = {
  model: User,
  as: "assignee",
  attributes: ["id", "name", "role"],
};

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

exports.findAll = async (req, res) => {
  const query = (req.query.q || "").trim();
  const status = req.query.status;

  const condition = {};

  if (query) {
    condition[Op.or] = [
      { title: { [Op.like]: `%${query}%` } },
      { description: { [Op.like]: `%${query}%` } },
    ];
  }

  if (status === "open" || status === "closed") {
    condition.status = status;
  }

  try {
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

exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
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

exports.update = async (req, res) => {
  const id = req.params.id;
  const updateData = {};
  const parsedAssigneeId = parseAssigneeId(req.body.assigneeId);

  if (typeof req.body.title === "string") {
    updateData.title = req.body.title.trim();
  }

  if (req.body.description !== undefined) {
    updateData.description = req.body.description;
  }

  if (req.body.requester !== undefined) {
    updateData.requester = req.body.requester;
  }

  if (req.body.status === "open" || req.body.status === "closed") {
    updateData.status = req.body.status;
  }

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
    if (parsedAssigneeId.hasValue && parsedAssigneeId.value !== null) {
      const assignee = await User.findByPk(parsedAssigneeId.value);

      if (!assignee) {
        return res.status(400).send({
          message: "Utilisateur assigne introuvable.",
        });
      }
    }

    const [updatedRows] = await Ticket.update(updateData, {
      where: { id },
    });

    if (updatedRows !== 1) {
      return res.status(404).send({
        message: `Ticket avec id=${id} introuvable.`,
      });
    }

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
