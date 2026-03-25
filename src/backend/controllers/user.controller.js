const db = require("../models");

const User = db.users;

const VALID_ROLES = ["viewer", "agent", "admin"];

const isValidRole = (role) => VALID_ROLES.includes(role);

exports.create = async (req, res) => {
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

exports.findAll = async (_req, res) => {
  try {
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

exports.updateRole = async (req, res) => {
  const id = req.params.id;
  const role = req.body.role;

  if (!isValidRole(role)) {
    return res.status(400).send({
      message: "Role utilisateur invalide.",
    });
  }

  try {
    const [updatedRows] = await User.update(
      { role },
      {
        where: { id },
      }
    );

    if (updatedRows !== 1) {
      return res.status(404).send({
        message: `Utilisateur avec id=${id} introuvable.`,
      });
    }

    const updatedUser = await User.findByPk(id);
    res.status(200).send(updatedUser);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Erreur lors de la mise a jour du role pour l'utilisateur avec id=${id}.`,
    });
  }
};