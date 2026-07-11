const { Course, Category, User, Lesson } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const include = [
  { model: Category, as: 'category' },
  { model: User, as: 'instructor', attributes: ['id', 'fullName', 'email', 'avatarUrl'] },
  { model: Lesson, as: 'lessons' },
];

exports.getAll = asyncHandler(async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  res.json(await Course.findAll({ where, include, order: [['id', 'ASC'], [{ model: Lesson, as: 'lessons' }, 'orderIndex', 'ASC']] }));
});

exports.getById = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id, { include });
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json(course);
});

exports.create = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(await Course.findByPk(course.id, { include }));
});

exports.update = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  await course.update(req.body);
  res.json(await Course.findByPk(course.id, { include }));
});

exports.remove = asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  await course.destroy();
  res.status(204).send();
});
