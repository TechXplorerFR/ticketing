module.exports = (app) => {
  const tickets = require("../controllers/ticket.controller.js");

  app.post("/api/tickets", tickets.create);
  app.get("/api/tickets", tickets.findAll);
  app.get("/api/tickets/:id", tickets.findOne);
  app.put("/api/tickets/:id", tickets.update);
  app.delete("/api/tickets/:id", tickets.delete);
};
