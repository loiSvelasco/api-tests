require('dotenv').config();
const { Sequelize } = require('sequelize');

// Load environment variables from .env.development if in development mode
// This allows for different configurations based on the environment
if (process.env.NODE_ENV === "development") {
  const result = require("dotenv").config({ path: ".env.development" });

  process.env = {
    ...process.env,
    ...result.parsed,
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  }
);

module.exports = sequelize;