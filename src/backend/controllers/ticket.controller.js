const db = require("../models");
const Ticket = db.tickets;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  const title = (req.body.title || "").trim();

  if (!title) {
    return res.status(400).send({
      message: "Le titre est requis.",
    });
  }

  try {
    const ticket = await Ticket.create({
      title,
      description: req.body.description || null,
      requester: req.body.requester || "anonymous",
      status: req.body.status === "closed" ? "closed" : "open",
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
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).send({
        message: `Ticket avec id=${id} introuvable.`,
      });
    }

    res.status(200).send(ticket);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Erreur lors de la recuperation du ticket avec id=${id}.`,
    });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const updateData = {};

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
    const [updatedRows] = await Ticket.update(updateData, {
      where: { id },
    });

    if (updatedRows !== 1) {
      return res.status(404).send({
        message: `Ticket avec id=${id} introuvable.`,
      });
    }

    const updatedTicket = await Ticket.findByPk(id);
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
