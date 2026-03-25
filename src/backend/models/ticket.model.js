/**
 * Ticket Model
 * Defines the Ticket table structure in the database.
 * A ticket represents a support/help request with a title, description, status, and assigned user.
 */

module.exports = (sequelize, Sequelize) => {
  const Ticket = sequelize.define("ticket", {
    // Title of the ticket (required)
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    // Detailed description of the ticket (optional)
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    // Status: either 'open' (active) or 'closed' (resolved)
    status: {
      type: Sequelize.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    // Name or identifier of the person requesting the ticket
    requester: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "anonymous",
    },
    // Foreign key reference to the User who is assigned this ticket
    assigneeId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Ticket;
};
