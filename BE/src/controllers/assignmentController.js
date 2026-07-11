const { Assignment, Course, CourseModule, CourseSme } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

async function ensureAssigned(smeId, courseId) {
  return CourseSme.findOne({ where: { userId: smeId, courseId } });
}
const include = [
  { model: Course, as: 'course', attributes: ['id', 'title', 'status'] },
  { model: CourseModule, as: 'module', attributes: ['id', 'title', 'orderIndex'] },
];

exports.list = asyncHandler(async (req, res) => {
  res.json(await Assignment.findAll({ where: { smeId: req.user.id }, include, order: [['updatedAt', 'DESC']] }));
});

exports.detail = asyncHandler(async (req, res) => {
  const item = await Assignment.findOne({ where: { id: req.params.id, smeId: req.user.id }, include });
  if (!item) return res.status(404).json({ message: 'Assignment not found' });
  res.json(item);
});

exports.create = asyncHandler(async (req, res) => {
  if (!(await ensureAssigned(req.user.id, req.body.courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  const item = await Assignment.create({ ...req.body, smeId: req.user.id });
  res.status(201).json(await Assignment.findByPk(item.id, { include }));
});

exports.update = asyncHandler(async (req, res) => {
  const item = await Assignment.findOne({ where: { id: req.params.id, smeId: req.user.id } });
  if (!item) return res.status(404).json({ message: 'Assignment not found' });
  const courseId = req.body.courseId ?? item.courseId;
  if (!(await ensureAssigned(req.user.id, courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  await item.update(req.body);
  res.json(await Assignment.findByPk(item.id, { include }));
});

exports.generate = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'Gemini is not configured' });
  const prompt = `Bạn là chuyên gia thiết kế bài tập đại học. Hãy tạo assignment bằng tiếng Việt cho chủ đề: ${req.body.topic || 'chủ đề khóa học'}. Trình độ: ${req.body.level || 'trung cấp'}. Yêu cầu bổ sung: ${req.body.requirements || 'không có'}. Rubric phải có tổng điểm đúng 100. Trả JSON.`;
  const schema = { type: 'OBJECT', required: ['title', 'instructions', 'rubric'], properties: {
    title: { type: 'STRING' }, instructions: { type: 'STRING' },
    rubric: { type: 'ARRAY', items: { type: 'OBJECT', required: ['criterion', 'description', 'points'], properties: { criterion: { type: 'STRING' }, description: { type: 'STRING' }, points: { type: 'INTEGER' } } } },
  } };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }),
  });
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ message: data.error?.message || 'Gemini generation failed' });
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) return res.status(502).json({ message: 'Gemini returned no content' });
  res.json(JSON.parse(text));
});
