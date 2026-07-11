const sequelize = require('../config/database');

const Role = require('./Role')(sequelize);
const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Course = require('./Course')(sequelize);
const Lesson = require('./Lesson')(sequelize);
const Enrollment = require('./Enrollment')(sequelize);

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });
Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
User.hasMany(Course, { foreignKey: 'instructorId', as: 'teachingCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.belongsToMany(Course, { through: Enrollment, foreignKey: 'userId', otherKey: 'courseId', as: 'enrolledCourses' });
Course.belongsToMany(User, { through: Enrollment, foreignKey: 'courseId', otherKey: 'userId', as: 'students' });
User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'student' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

module.exports = { sequelize, Role, User, Category, Course, Lesson, Enrollment };
