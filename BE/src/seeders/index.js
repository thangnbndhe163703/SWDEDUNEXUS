const bcrypt = require('bcryptjs');
const { sequelize, Role, User, Category, Course, Lesson, Enrollment, SubscriptionPackage, UserSubscription, CourseModule, ModuleContent, CourseSme, Assignment } = require('../models');

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

async function seedStudentLibrary() {
  const studentRole = await Role.findOne({ where: { name: 'student' } });
  const teacherRole = await Role.findOne({ where: { name: 'teacher' } });
  if (!studentRole || !teacherRole) return;
  const students = await User.findAll({ where: { roleId: studentRole.id } });
  const teacher = await User.findOne({ where: { roleId: teacherRole.id } });
  const category = await Category.findOne();
  if (!teacher || !category || students.length === 0) return;

  const courseData = [
    { title: 'Machine Learning Fundamentals', slug: 'machine-learning-fundamentals', level: 'intermediate', price: 1200000 },
    { title: 'React and TypeScript Mastery', slug: 'react-typescript-mastery', level: 'advanced', price: 990000 },
    { title: 'Digital Marketing Essentials', slug: 'digital-marketing-essentials', level: 'beginner', price: 750000 },
  ];
  const courses = [];
  for (const data of courseData) {
    const [course] = await Course.findOrCreate({
      where: { slug: data.slug },
      defaults: { ...data, categoryId: category.id, instructorId: teacher.id, description: `Test course: ${data.title}`, status: 'published', publishedAt: new Date() },
    });
    courses.push(course);
    if (await Lesson.count({ where: { courseId: course.id } }) === 0) {
      await Lesson.bulkCreate([
        { courseId: course.id, title: `Giới thiệu ${data.title}`, contentType: 'video', contentUrl: 'https://www.youtube.com/watch?v=aircAruvnKk', content: 'Video nhập môn giúp học viên làm quen với nội dung và mục tiêu của khóa học.', durationMinutes: 15, orderIndex: 1, isPreview: true },
        { courseId: course.id, title: 'Kiến thức nền tảng', contentType: 'document', durationMinutes: 30, orderIndex: 2 },
        { courseId: course.id, title: 'Bài kiểm tra tổng hợp', contentType: 'quiz', durationMinutes: 20, orderIndex: 3 },
      ]);
    }
  }
  const packageData = [
    { name: 'Student Pro', description: 'Unlimited learning package for students', price: 599000, durationDays: 365 },
    { name: 'AI Practice', description: 'AI quiz and flashcard practice package', price: 299000, durationDays: 180 },
  ];
  const packages = [];
  for (const data of packageData) {
    const [item] = await SubscriptionPackage.findOrCreate({ where: { name: data.name }, defaults: data });
    packages.push(item);
  }
  for (const student of students) {
    for (let index = 0; index < courses.length; index += 1) {
      await Enrollment.findOrCreate({
        where: { userId: student.id, courseId: courses[index].id },
        defaults: { progress: [68, 35, 100][index], status: index === 2 ? 'completed' : 'active', completedAt: index === 2 ? new Date() : null },
      });
    }
    const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    await UserSubscription.findOrCreate({
      where: { userId: student.id, packageId: packages[0].id },
      defaults: { startedAt: new Date(), expiresAt, status: 'active' },
    });
  }
  console.log('Student Library test data is ready.');
}

async function seedSmeCourses() {
  const smeRole = await Role.findOne({ where: { name: 'sme' } });
  if (!smeRole) return;
  const smes = await User.findAll({ where: { roleId: smeRole.id } });
  const courses = await Course.findAll({ order: [['id', 'ASC']], limit: 2 });
  for (const sme of smes) for (const course of courses) {
    await CourseSme.findOrCreate({ where: { userId: sme.id, courseId: course.id } });
  }
  const contentTypes = ['lesson', 'flashcard', 'assignment', 'question', 'quiz'];
  for (const course of courses) {
    for (let moduleIndex = 1; moduleIndex <= 2; moduleIndex += 1) {
      const [module] = await CourseModule.findOrCreate({
        where: { courseId: course.id, orderIndex: moduleIndex },
        defaults: { title: `Module ${moduleIndex}: ${moduleIndex === 1 ? 'Nền tảng' : 'Thực hành'}`, description: `Nội dung module ${moduleIndex} của ${course.title}`, status: 'published' },
      });
      for (let index = 0; index < contentTypes.length; index += 1) {
        const type = contentTypes[index];
        await ModuleContent.findOrCreate({
          where: { moduleId: module.id, type, orderIndex: index + 1 },
          defaults: { title: `${type[0].toUpperCase()}${type.slice(1)} mẫu`, description: `Dữ liệu test ${type} trong ${module.title}`, status: moduleIndex === 1 ? 'published' : 'draft' },
        });
      }
    }
  }
  for (const sme of smes) for (const course of courses) {
    const module = await CourseModule.findOne({ where: { courseId: course.id }, order: [['orderIndex', 'ASC']] });
    await Assignment.findOrCreate({ where: { smeId: sme.id, courseId: course.id, title: `Bài tập tổng hợp - ${course.title}` }, defaults: {
      moduleId: module?.id, instructions: 'Phân tích kiến thức đã học và xây dựng một sản phẩm minh họa. Trình bày quy trình, kết quả và phần tự đánh giá.',
      rubric: [{ criterion: 'Kiến thức', description: 'Áp dụng chính xác kiến thức khóa học', points: 40 }, { criterion: 'Thực hành', description: 'Sản phẩm hoàn chỉnh và có minh chứng', points: 40 }, { criterion: 'Trình bày', description: 'Bố cục rõ ràng, dễ hiểu', points: 20 }],
      maxScore: 100, status: 'published', dueAt: new Date(Date.now() + 14 * 86400000),
    } });
  }
  console.log('SME course structure test data is ready.');
}

module.exports = { seedDatabase, seedStudentLibrary, seedSmeCourses };
