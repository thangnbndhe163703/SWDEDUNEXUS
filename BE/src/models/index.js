const sequelize = require('../config/database');

const Role = require('./Role')(sequelize);
const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Course = require('./Course')(sequelize);
const Lesson = require('./Lesson')(sequelize);
const Enrollment = require('./Enrollment')(sequelize);
const SubscriptionPackage = require('./SubscriptionPackage')(sequelize);
const UserSubscription = require('./UserSubscription')(sequelize);
const CourseModule = require('./CourseModule')(sequelize);
const ModuleContent = require('./ModuleContent')(sequelize);
const CourseSme = require('./CourseSme')(sequelize);
const Assignment = require('./Assignment')(sequelize);
const AssignmentSubmission = require('./AssignmentSubmission')(sequelize);
const LessonAttachment = require('./LessonAttachment')(sequelize);
const Question = require('./Question')(sequelize);
const Flashcard = require('./Flashcard')(sequelize);
const FlashcardProgress = require('./FlashcardProgress')(sequelize);

Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });
Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
User.hasMany(Course, { foreignKey: 'instructorId', as: 'teachingCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Lesson.hasMany(LessonAttachment, { foreignKey: 'lessonId', as: 'attachments', onDelete: 'CASCADE' });
LessonAttachment.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
Course.hasMany(Question, { foreignKey: 'courseId', as: 'questions' });
Question.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CourseModule.hasMany(Question, { foreignKey: 'moduleId', as: 'questions' });
Question.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });
User.hasMany(Question, { foreignKey: 'smeId', as: 'authoredQuestions' });
Question.belongsTo(User, { foreignKey: 'smeId', as: 'sme' });
Course.hasMany(Flashcard, { foreignKey: 'courseId', as: 'flashcards' });
Flashcard.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CourseModule.hasMany(Flashcard, { foreignKey: 'moduleId', as: 'flashcards' });
Flashcard.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });
User.hasMany(Flashcard, { foreignKey: 'smeId', as: 'authoredFlashcards' });
Flashcard.belongsTo(User, { foreignKey: 'smeId', as: 'sme' });
User.hasMany(FlashcardProgress, { foreignKey: 'studentId', as: 'flashcardProgress' });
FlashcardProgress.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Flashcard.hasMany(FlashcardProgress, { foreignKey: 'flashcardId', as: 'studentProgress', onDelete: 'CASCADE' });
FlashcardProgress.belongsTo(Flashcard, { foreignKey: 'flashcardId', as: 'flashcard' });

User.belongsToMany(Course, { through: Enrollment, foreignKey: 'userId', otherKey: 'courseId', as: 'enrolledCourses' });
Course.belongsToMany(User, { through: Enrollment, foreignKey: 'courseId', otherKey: 'userId', as: 'students' });
User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'student' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(UserSubscription, { foreignKey: 'userId', as: 'subscriptions' });
UserSubscription.belongsTo(User, { foreignKey: 'userId', as: 'student' });
SubscriptionPackage.hasMany(UserSubscription, { foreignKey: 'packageId', as: 'subscriptions' });
UserSubscription.belongsTo(SubscriptionPackage, { foreignKey: 'packageId', as: 'package' });

Course.belongsToMany(User, { through: CourseSme, foreignKey: 'courseId', otherKey: 'userId', as: 'smes' });
User.belongsToMany(Course, { through: CourseSme, foreignKey: 'userId', otherKey: 'courseId', as: 'assignedCourses' });
Course.hasMany(CourseModule, { foreignKey: 'courseId', as: 'modules', onDelete: 'CASCADE' });
CourseModule.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CourseModule.hasMany(ModuleContent, { foreignKey: 'moduleId', as: 'contents', onDelete: 'CASCADE' });
ModuleContent.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });
Course.hasMany(Assignment, { foreignKey: 'courseId', as: 'assignments' });
Assignment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CourseModule.hasMany(Assignment, { foreignKey: 'moduleId', as: 'assignments' });
Assignment.belongsTo(CourseModule, { foreignKey: 'moduleId', as: 'module' });
User.hasMany(Assignment, { foreignKey: 'smeId', as: 'authoredAssignments' });
Assignment.belongsTo(User, { foreignKey: 'smeId', as: 'sme' });
Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignmentId', as: 'submissions' });
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
User.hasMany(AssignmentSubmission, { foreignKey: 'studentId', as: 'assignmentSubmissions' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

module.exports = { sequelize, Role, User, Category, Course, Lesson, Enrollment, SubscriptionPackage, UserSubscription, CourseModule, ModuleContent, CourseSme, Assignment, AssignmentSubmission, LessonAttachment, Question, Flashcard, FlashcardProgress };
