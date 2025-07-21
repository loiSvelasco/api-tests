const sequelize = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    await sequelize.authenticate();
    next();
  } catch (error) {
    console.error('Database not reachable:', error.message);
    res.status(503).json({ error: 'DB connection failed' });
  }
};