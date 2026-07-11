const { Enrollment, Course, Category, User, Lesson, UserSubscription, SubscriptionPackage } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

exports.getLibrary = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.findAll({
    where: { userId: req.user.id },
    include: [{ model: Course, as: 'course', include: [
      { model: Category, as: 'category' },
      { model: User, as: 'instructor', attributes: ['id', 'fullName', 'avatarUrl'] },
      { model: Lesson, as: 'lessons', attributes: ['id'] },
    ] }],
    order: [['enrolledAt', 'DESC']],
  });
  const subscriptions = await UserSubscription.findAll({
    where: { userId: req.user.id },
    include: [{ model: SubscriptionPackage, as: 'package' }],
    order: [['startedAt', 'DESC']],
  });
  const progressValues = enrollments.map(item => Number(item.progress));
  res.json({
    stats: {
      totalCourses: enrollments.length,
      activeCourses: enrollments.filter(item => item.status === 'active').length,
      completedCourses: enrollments.filter(item => item.status === 'completed').length,
      averageProgress: progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0,
      activePackages: subscriptions.filter(item => item.status === 'active' && new Date(item.expiresAt) > new Date()).length,
    },
    enrollments,
    subscriptions,
  });
});

exports.getCourseDetail = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    where: { userId: req.user.id, courseId: req.params.courseId },
    include: [{ model: Course, as: 'course', include: [
      { model: Category, as: 'category' },
      { model: User, as: 'instructor', attributes: ['id', 'fullName', 'email', 'avatarUrl'] },
      { model: Lesson, as: 'lessons' },
    ] }],
    order: [[{ model: Course, as: 'course' }, { model: Lesson, as: 'lessons' }, 'orderIndex', 'ASC']],
  });
  if (!enrollment) return res.status(404).json({ message: 'Course is not registered by this student' });
  res.json(enrollment);
});
