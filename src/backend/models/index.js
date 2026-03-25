/**
 * Database Configuration and Initialization
 * Sets up the Sequelize ORM connection and defines model relationships.
 * Initializes both the Ticket and User models with their associations.
 */

const dbConfig = require("../config/db.config.js");

const { Sequelize } = require("sequelize");

// Configure Sequelize options based on environment and database type
const sequelizeOptions = {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  // Disable query logging in test environment for cleaner output
  logging: process.env.NODE_ENV === "test" ? false : undefined,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
};

// For SQLite database, specify storage location
if (dbConfig.dialect === "sqlite") {
  sequelizeOptions.storage = process.env.SQLITE_STORAGE || ":memory:";
}

// Initialize Sequelize connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, sequelizeOptions);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.tickets = require("./ticket.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);

// Define relationships: A user has many tickets assigned to them
db.users.hasMany(db.tickets, {
  foreignKey: "assigneeId",
  as: "assignedTickets",
});

// Define relationships: A ticket belongs to a user (the assignee)
db.tickets.belongsTo(db.users, {
  foreignKey: "assigneeId",
  as: "assignee",
});

module.exports = db;
