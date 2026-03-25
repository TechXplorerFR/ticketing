module.exports = (app) => {
  const users = require("../controllers/user.controller.js");

  app.post("/api/users", users.create);
  app.get("/api/users", users.findAll);
  app.put("/api/users/:id/role", users.updateRole);
};