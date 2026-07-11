const bcrypt = require('bcryptjs');
const { sequelize, Role, User, Category, Course, Lesson, Enrollment } = require('../models');

async function seedDatabase({ force = false } = {}) {
  if (force) await sequelize.sync({ force: true });
  if (await Role.count() > 0) {
    console.log('Seed skipped: database already contains data.');
    return;
  }

  await sequelize.transaction(async (transaction) => {
    const roles = await Role.bulkCreate([
      { name: 'student', description: 'Learner' },
      { name: 'teacher', description: 'Instructor' },
      { name: 'sme', description: 'Subject matter expert' },
      { name: 'manager', description: 'Business manager' },
      { name: 'admin', description: 'System administrator' },
    ], { transaction });
    const role = Object.fromEntries(roles.map((item) => [item.name, item]));
    const passwordHash = await bcrypt.hash('123456', 10);

    const users = await User.bulkCreate([
      { roleId: role.admin.id, fullName: 'EduNexus Admin', email: 'admin@edunexus.vn', passwordHash },
      { roleId: role.teacher.id, fullName: 'Nguyen Minh Tuan', email: 'teacher@edunexus.vn', passwordHash },
      { roleId: role.sme.id, fullName: 'Le Minh Cuong', email: 'sme@edunexus.vn', passwordHash },
      { roleId: role.student.id, fullName: 'Nguyen Van An', email: 'student@edunexus.vn', passwordHash },
      { roleId: role.manager.id, fullName: 'Hoang Van Em', email: 'manager@edunexus.vn', passwordHash },
    ], { transaction });
    const teacher = users.find((item) => item.email === 'teacher@edunexus.vn');
    const student = users.find((item) => item.email === 'student@edunexus.vn');

    const categories = await Category.bulkCreate([
      { name: 'AI & Data', slug: 'ai-data', description: 'Artificial intelligence and data science' },
      { name: 'Web Development', slug: 'web-development', description: 'Frontend and backend development' },
      { name: 'Marketing', slug: 'marketing', description: 'Digital marketing and strategy' },
      { name: 'Finance', slug: 'finance', description: 'Finance and business analysis' },
    ], { transaction });

    const course = await Course.create({
      categoryId: categories[0].id,
      instructorId: teacher.id,
      title: 'Machine Learning Fundamentals',
      slug: 'machine-learning-fundamentals',
      description: 'Learn the foundations of machine learning from data preparation to model evaluation.',
      level: 'intermediate',
      price: 1200000,
      status: 'published',
      publishedAt: new Date(),
    }, { transaction });

    await Lesson.bulkCreate([
      { courseId: course.id, title: 'Introduction to Machine Learning', contentType: 'video', durationMinutes: 12, orderIndex: 1, isPreview: true },
      { courseId: course.id, title: 'Basic Algorithms', contentType: 'document', durationMinutes: 30, orderIndex: 2 },
      { courseId: course.id, title: 'Chapter 1 Quiz', contentType: 'quiz', durationMinutes: 20, orderIndex: 3 },
    ], { transaction });
    await Enrollment.create({ userId: student.id, courseId: course.id, progress: 68 }, { transaction });
  });

  console.log('Seed data inserted successfully. Demo password: 123456');
}

module.exports = { seedDatabase };
