const { Op } = require('sequelize');
const { Flashcard, Course, CourseModule, CourseSme, Enrollment } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const include = [
  { model: Course, as: 'course', attributes: ['id', 'title'] },
  { model: CourseModule, as: 'module', attributes: ['id', 'title', 'orderIndex'] },
];
const canManage = (userId, courseId) => CourseSme.findOne({ where: { userId, courseId } });

exports.listForSme = asyncHandler(async (req, res) => {
  const where = { smeId: req.user.id };
  if (req.query.courseId) where.courseId = req.query.courseId;
  res.json(await Flashcard.findAll({ where, include, order: [['updatedAt', 'DESC']] }));
});

exports.listForStudent = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.findAll({ where: { userId: req.user.id, status: { [Op.ne]: 'cancelled' } }, attributes: ['courseId'] });
  const courseIds = enrollments.map(item => item.courseId);
  const where = { courseId: courseIds, status: 'published' };
  if (req.query.courseId) {
    const requestedCourseId = Number(req.query.courseId);
    if (!courseIds.includes(requestedCourseId)) return res.status(403).json({ message: 'Student is not enrolled in this course' });
    where.courseId = requestedCourseId;
  }
  res.json(await Flashcard.findAll({ where, include, order: [['courseId', 'ASC'], ['id', 'ASC']] }));
});

exports.create = asyncHandler(async (req, res) => {
  if (!(await canManage(req.user.id, req.body.courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  const card = await Flashcard.create({ ...req.body, smeId: req.user.id });
  res.status(201).json(await Flashcard.findByPk(card.id, { include }));
});

exports.createMany = asyncHandler(async (req, res) => {
  const { courseId, moduleId = null, cards } = req.body;
  if (!(await canManage(req.user.id, courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  if (!Array.isArray(cards) || !cards.length) return res.status(400).json({ message: 'Cards must be a non-empty array' });
  const created = await Flashcard.bulkCreate(cards.map(card => ({ ...card, courseId, moduleId, smeId: req.user.id })));
  res.status(201).json(await Flashcard.findAll({ where: { id: created.map(card => card.id) }, include }));
});

exports.update = asyncHandler(async (req, res) => {
  const card = await Flashcard.findOne({ where: { id: req.params.id, smeId: req.user.id } });
  if (!card) return res.status(404).json({ message: 'Flashcard not found' });
  const courseId = req.body.courseId ?? card.courseId;
  if (!(await canManage(req.user.id, courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  await card.update(req.body);
  res.json(await Flashcard.findByPk(card.id, { include }));
});

exports.remove = asyncHandler(async (req, res) => {
  const card = await Flashcard.findOne({ where: { id: req.params.id, smeId: req.user.id } });
  if (!card) return res.status(404).json({ message: 'Flashcard not found' });
  await card.destroy();
  res.status(204).end();
});

exports.generate = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'Gemini is not configured' });
  const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 20);
  const prompt = `Tạo ${count} flashcard bằng tiếng Việt về ${req.body.topic || 'chủ đề khóa học'}, độ khó ${req.body.difficulty || 'medium'}. Mỗi thẻ gồm mặt trước ngắn gọn, mặt sau chính xác, gợi ý và tags. Trả JSON.`;
  const cardSchema = { type: 'OBJECT', required: ['front', 'back', 'hint', 'difficulty', 'tags'], properties: { front: { type: 'STRING' }, back: { type: 'STRING' }, hint: { type: 'STRING' }, difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] }, tags: { type: 'ARRAY', items: { type: 'STRING' } } } };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: cardSchema } } }) });
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ message: data.error?.message || 'Gemini generation failed' });
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) return res.status(502).json({ message: 'Gemini returned no content' });
  res.json(JSON.parse(text));
});
