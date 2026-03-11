module.exports = {
  HOST: process.env.HOST || "127.0.0.1",
  USER: process.env.USER || "root",
  PASSWORD: process.env.PASSWORD || "root",
  DB: process.env.DB || "test",
  dialect: process.env.dialect || "mysql",
  pool: {
    max: parseInt(process.env.MAX_POOL) || 5,
    min: parseInt(process.env.MIN_POOL) || 0,
    acquire: parseInt(process.env.ACQUIRE) || 30000,
    idle: parseInt(process.env.IDLE) || 10000
  }
};