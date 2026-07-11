require('dotenv').config();
const { sequelize } = require('../models');
const { seedDatabase } = require('./index');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await seedDatabase();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
