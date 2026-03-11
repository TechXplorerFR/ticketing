const db = require("../models");
const Example = db.examples;
const Op = db.Sequelize.Op;

// Create and Save a new Example
exports.create = (req, res) => {
    // Create an Example object
    const example = {
        type: req.body.type,
        age: req.body.age,
        isOK: req.body.isOK,
        data: req.body.data,
        date_of_death: req.body.date_of_death
    };

    // Save Example in the database
    Example.create(example)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Une erreur s'est produite lors de la création de l'exemple."
            });
        });
};

// Retrieve all Examples from the database
exports.findAll = (req, res) => {
    const type = req.query.type;
    const condition = type ? { type: { [Op.like]: `%${type}%` } } : null;

    Example.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Une erreur s'est produite lors de la récupération des exemples."
            });
        });
};

// Find a single Example with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    Example.findByPk(id)
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `Exemple avec id=${id} introuvable.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `Erreur lors de la récupération de l'exemple avec id=${id}`
            });
        });
};

// Update an Example by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    Example.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Exemple mis à jour avec succès."
                });
            } else {
                res.send({
                    message: `Impossible de mettre à jour l'exemple avec id=${id}. Peut-être que l'exemple est introuvable ou req.body est vide !`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `Erreur lors de la mise à jour de l'exemple avec id=${id}`
            });
        });
};

// Delete an Example with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;

    Example.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Exemple supprimé avec succès !"
                });
            } else {
                res.send({
                    message: `Impossible de supprimer l'exemple avec id=${id}. Peut-être que l'exemple est introuvable !`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: `Impossible de supprimer l'exemple avec id=${id}`
            });
        });
};

// Delete all Examples from the database
exports.deleteAll = (req, res) => {
    Example.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} exemples ont été supprimés avec succès !` });
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Une erreur s'est produite lors de la suppression de tous les exemples."
            });
        });
};