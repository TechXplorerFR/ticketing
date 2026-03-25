const dbConfig = require("../config/db.config.js");

const { Sequelize } = require("sequelize");
const sequelizeOptions = {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: process.env.NODE_ENV === "test" ? false : undefined,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
};

if (dbConfig.dialect === "sqlite") {
  sequelizeOptions.storage = process.env.SQLITE_STORAGE || ":memory:";
}

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, sequelizeOptions);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.tickets = require("./ticket.model.js")(sequelize, Sequelize);
db.users = require("./user.model.js")(sequelize, Sequelize);

db.users.hasMany(db.tickets, {
  foreignKey: "assigneeId",
  as: "assignedTickets",
});

db.tickets.belongsTo(db.users, {
  foreignKey: "assigneeId",
  as: "assignee",
});

module.exports = db;
