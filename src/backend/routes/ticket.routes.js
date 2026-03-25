/**
 * Ticket Routes
 * Defines all API endpoints for ticket management.
 * Includes CRUD operations: Create, Read (all), Read (one), Update, Delete.
 */

module.exports = (app) => {
  const tickets = require("../controllers/ticket.controller.js");

  // Create a new ticket
  app.post("/api/tickets", tickets.create);

  // Get all tickets (with optional search and filter)
  app.get("/api/tickets", tickets.findAll);

  // Get a specific ticket by ID
  app.get("/api/tickets/:id", tickets.findOne);

  // Update a ticket
  app.put("/api/tickets/:id", tickets.update);

  // Delete a ticket
  app.delete("/api/tickets/:id", tickets.delete);
};
