require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const { seedDatabase } = require('./src/seeders');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully.');

    if (process.env.DB_SYNC !== 'false') {
      const alter = process.env.NODE_ENV !== 'production' && process.env.DB_ALTER === 'true';
      await sequelize.sync({ alter });
      console.log(`Code-first synchronization completed (alter: ${alter}).`);
    }

    if (process.env.DB_SEED !== 'false') {
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`EduNexus API is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Cannot start server:', error.message);
    process.exit(1);
  }
}

startServer();
