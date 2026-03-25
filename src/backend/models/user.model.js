/**
 * User Model
 * Defines the User table structure in the database.
 * A user can have one of three roles: viewer, agent, or admin.
 */

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    // User's name or username (required)
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    // User's role: viewer (read-only), agent (can manage tickets), or admin (full access)
    role: {
      type: Sequelize.ENUM("viewer", "agent", "admin"),
      allowNull: false,
      defaultValue: "viewer",
    },
  });

  return User;
};