require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const { seedDatabase, seedStudentLibrary, seedSmeCourses } = require('./src/seeders');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully.');

    if (process.env.DB_SYNC !== 'false') {
      // Do not use `alter: true` on application startup. With MySQL, Sequelize
      // can create another UNIQUE index for the same column on every restart,
      // eventually reaching MySQL's limit of 64 keys per table.
      // Schema changes should be applied through explicit migrations instead.
      await sequelize.sync();
      console.log('Database synchronization completed (create missing tables only).');
    }

    if (process.env.DB_SEED !== 'false') {
      await seedDatabase();
      await seedStudentLibrary();
      await seedSmeCourses();
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
