const dbConfig = require("../config/db.config.js");

const { Sequelize } = require("sequelize");
const sequelizeOptions = {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
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

module.exports = db;
