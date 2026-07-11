const { Course, Category, User, CourseModule, ModuleContent, CourseSme } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

exports.getCourses = asyncHandler(async (req, res) => {
  const assignments = await CourseSme.findAll({ where: { userId: req.user.id }, attributes: ['courseId'] });
  const ids = assignments.map(item => item.courseId);
  const courses = await Course.findAll({ where: { id: ids }, include: [
    { model: Category, as: 'category' },
    { model: User, as: 'instructor', attributes: ['id', 'fullName'] },
    { model: CourseModule, as: 'modules', attributes: ['id'] },
  ], order: [['updatedAt', 'DESC']] });
  res.json(courses);
});

exports.getCourseStructure = asyncHandler(async (req, res) => {
  const assignment = await CourseSme.findOne({ where: { userId: req.user.id, courseId: req.params.courseId } });
  if (!assignment) return res.status(404).json({ message: 'Course is not assigned to this SME' });
  const course = await Course.findByPk(req.params.courseId, { include: [
    { model: Category, as: 'category' },
    { model: User, as: 'instructor', attributes: ['id', 'fullName', 'email'] },
    { model: CourseModule, as: 'modules', include: [{ model: ModuleContent, as: 'contents' }] },
  ], order: [[{ model: CourseModule, as: 'modules' }, 'orderIndex', 'ASC'], [{ model: CourseModule, as: 'modules' }, { model: ModuleContent, as: 'contents' }, 'orderIndex', 'ASC']] });
  res.json(course);
});
