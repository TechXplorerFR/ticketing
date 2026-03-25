/**
 * User Routes
 * Defines all API endpoints for user management.
 * Includes Create, Read (all), and Update role operations.
 */

module.exports = (app) => {
  const users = require("../controllers/user.controller.js");

  // Create a new user
  app.post("/api/users", users.create);

  // Get all users
  app.get("/api/users", users.findAll);

  // Update a user's role
  app.put("/api/users/:id/role", users.updateRole);
};