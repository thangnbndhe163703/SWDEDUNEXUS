const { sequelize, Lesson, LessonAttachment, Course, CourseSme } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { YoutubeTranscript } = require('youtube-transcript');

const include = [
  { model: Course, as: 'course', attributes: ['id', 'title', 'status'] },
  { model: LessonAttachment, as: 'attachments' },
];
async function canManage(smeId, courseId) {
  return CourseSme.findOne({ where: { userId: smeId, courseId } });
}

exports.list = asyncHandler(async (req, res) => {
  const assigned = await CourseSme.findAll({ where: { userId: req.user.id }, attributes: ['courseId'] });
  res.json(await Lesson.findAll({ where: { courseId: assigned.map(item => item.courseId) }, include, order: [['courseId', 'ASC'], ['orderIndex', 'ASC']] }));
});

exports.detail = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByPk(req.params.id, { include });
  if (!lesson || !(await canManage(req.user.id, lesson.courseId))) return res.status(404).json({ message: 'Lesson not found' });
  res.json(lesson);
});

async function saveAttachments(lessonId, attachments, transaction) {
  if (!Array.isArray(attachments)) return;
  await LessonAttachment.destroy({ where: { lessonId }, transaction });
  if (attachments.length) await LessonAttachment.bulkCreate(attachments.map(item => ({ lessonId, name: item.name, url: item.url, mimeType: item.mimeType, sizeBytes: item.sizeBytes })), { transaction });
}

exports.create = asyncHandler(async (req, res) => {
  if (!(await canManage(req.user.id, req.body.courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  const lesson = await sequelize.transaction(async transaction => {
    const created = await Lesson.create(req.body, { transaction });
    await saveAttachments(created.id, req.body.attachments, transaction);
    return created;
  });
  res.status(201).json(await Lesson.findByPk(lesson.id, { include }));
});

exports.update = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByPk(req.params.id);
  if (!lesson || !(await canManage(req.user.id, lesson.courseId))) return res.status(404).json({ message: 'Lesson not found' });
  const courseId = req.body.courseId ?? lesson.courseId;
  if (!(await canManage(req.user.id, courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  await sequelize.transaction(async transaction => {
    await lesson.update(req.body, { transaction });
    await saveAttachments(lesson.id, req.body.attachments, transaction);
  });
  res.json(await Lesson.findByPk(lesson.id, { include }));
});

exports.generate = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'Gemini is not configured' });
  const prompt = `Tạo một lesson bằng tiếng Việt ở định dạng Markdown. Chủ đề: ${req.body.topic || 'chủ đề khóa học'}. Đối tượng: ${req.body.audience || 'sinh viên'}. Mục tiêu: ${req.body.objectives || 'hiểu và vận dụng kiến thức'}. Nội dung cần có mục tiêu học tập, phần giải thích, ví dụ, bài tập ngắn và tóm tắt. Trả JSON.`;
  const schema = { type: 'OBJECT', required: ['title', 'markdownContent', 'durationMinutes'], properties: { title: { type: 'STRING' }, markdownContent: { type: 'STRING' }, durationMinutes: { type: 'INTEGER' } } };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }) });
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ message: data.error?.message || 'Gemini generation failed' });
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) return res.status(502).json({ message: 'Gemini returned no content' });
  res.json(JSON.parse(text));
});

exports.extractYoutube = asyncHandler(async (req, res) => {
  if (!req.body.youtubeUrl) return res.status(400).json({ message: 'YouTube URL is required' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ message: 'Gemini is not configured' });
  let segments;
  try {
    segments = await YoutubeTranscript.fetchTranscript(req.body.youtubeUrl, { lang: req.body.language || 'vi' });
  } catch (_error) {
    try { segments = await YoutubeTranscript.fetchTranscript(req.body.youtubeUrl); }
    catch (error) { return res.status(422).json({ message: `Không lấy được transcript: ${error.message}` }); }
  }
  const transcript = segments.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
  if (!transcript) return res.status(422).json({ message: 'Video không có transcript khả dụng' });
  const prompt = `Chuyển transcript YouTube sau thành lesson summary tiếng Việt ở Markdown. Phải có: tiêu đề, mục tiêu học tập, ý chính theo heading, ví dụ/ghi chú quan trọng, câu hỏi ôn tập và tóm tắt. Mỗi heading phải nằm trên một dòng riêng, có một dòng trống trước và sau heading. Mỗi bullet phải nằm trên dòng riêng. Không viết toàn bộ Markdown trên một dòng. Loại bỏ từ đệm và câu lặp. TRANSCRIPT:\n${transcript.slice(0, 90000)}`;
  const schema = { type: 'OBJECT', required: ['title', 'markdownContent', 'summary'], properties: { title: { type: 'STRING' }, markdownContent: { type: 'STRING' }, summary: { type: 'STRING' } } };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }) });
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ message: data.error?.message || 'Gemini formatting failed' });
  const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  if (!text) return res.status(502).json({ message: 'Gemini returned no content' });
  res.json({ ...JSON.parse(text), youtubeUrl: req.body.youtubeUrl, transcriptLength: transcript.length });
});
