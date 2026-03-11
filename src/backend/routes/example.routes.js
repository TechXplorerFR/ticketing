module.exports = (app) => {
  const examples = require("../controllers/example.controller.js");
  const { verifyToken, isAdmin, isModerator } = require("../middlewares/auth.middleware.js");

  var router = require("express").Router();

  app.use("/api/examples", router);

  // Creer un nouvel exemple
  router.post("/", verifyToken, examples.create);

  // Retrouver tous les exemples
  router.get("/", verifyToken, examples.findAll);

  // Retrouver un exemple
  router.get("/:id", verifyToken, examples.findOne);

  // Mettre a jour un exemple (admin/modo)
  router.put("/:id", [verifyToken, isModerator], examples.update);

  // Supprimer un exemple (admin)
  router.delete("/:id", [verifyToken, isAdmin], examples.delete);

  // Supprimer tous les exemples (admin)
  router.delete("/", [verifyToken, isAdmin], examples.deleteAll);
};
