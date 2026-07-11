const { Question, Course, CourseModule, CourseSme } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const include = [{ model: Course, as: 'course', attributes: ['id', 'title'] }, { model: CourseModule, as: 'module', attributes: ['id', 'title', 'orderIndex'] }];
async function canManage(smeId, courseId) { return CourseSme.findOne({ where: { userId: smeId, courseId } }); }

exports.list = asyncHandler(async (req, res) => {
  const where = { smeId: req.user.id };
  if (req.query.courseId) where.courseId = req.query.courseId;
  if (req.query.difficulty) where.difficulty = req.query.difficulty;
  if (req.query.type) where.type = req.query.type;
  res.json(await Question.findAll({ where, include, order: [['updatedAt', 'DESC']] }));
});
exports.detail = asyncHandler(async (req, res) => {
  const item = await Question.findOne({ where: { id: req.params.id, smeId: req.user.id }, include });
  if (!item) return res.status(404).json({ message: 'Question not found' }); res.json(item);
});
exports.create = asyncHandler(async (req, res) => {
  if (!(await canManage(req.user.id, req.body.courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  const item = await Question.create({ ...req.body, smeId: req.user.id }); res.status(201).json(await Question.findByPk(item.id, { include }));
});
exports.update = asyncHandler(async (req, res) => {
  const item = await Question.findOne({ where: { id: req.params.id, smeId: req.user.id } });
  if (!item) return res.status(404).json({ message: 'Question not found' });
  const courseId = req.body.courseId ?? item.courseId;
  if (!(await canManage(req.user.id, courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  await item.update(req.body); res.json(await Question.findByPk(item.id, { include }));
});
exports.generate = asyncHandler(async (req, res) => {
  const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 20);
  const prompt = `Tạo ${count} câu hỏi bằng tiếng Việt về ${req.body.topic || 'chủ đề khóa học'}, độ khó ${req.body.difficulty || 'medium'}. Bao gồm câu hỏi, 4 lựa chọn, correctAnswer là index 0-3, giải thích và tags. Không mơ hồ. Trả JSON.`;
  const questionSchema = { type: 'OBJECT', required: ['content','options','correctAnswer','explanation','difficulty','tags'], properties: { content:{type:'STRING'}, options:{type:'ARRAY',items:{type:'STRING'}}, correctAnswer:{type:'INTEGER'}, explanation:{type:'STRING'}, difficulty:{type:'STRING',enum:['easy','medium','hard']}, tags:{type:'ARRAY',items:{type:'STRING'}} } };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}:generateContent`, { method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY}, body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:{type:'ARRAY',items:questionSchema}}}) });
  const data=await response.json(); if(!response.ok)return res.status(response.status).json({message:data.error?.message||'Gemini generation failed'});
  const text=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join(''); if(!text)return res.status(502).json({message:'Gemini returned no content'}); res.json(JSON.parse(text));
});
exports.importMany = asyncHandler(async (req, res) => {
  if (!(await canManage(req.user.id, req.body.courseId))) return res.status(403).json({ message: 'Course is not assigned to this SME' });
  let rows;
  if (req.body.format === 'csv') {
    const lines=String(req.body.data||'').trim().split(/\r?\n/); const headers=lines.shift().split(',').map(x=>x.trim());
    rows=lines.filter(Boolean).map(line=>{const values=line.split(',').map(x=>x.trim());return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
    rows=rows.map(row=>({content:row.content,options:[row.optionA,row.optionB,row.optionC,row.optionD].filter(Boolean),correctAnswer:Number(row.correctAnswer),explanation:row.explanation,difficulty:row.difficulty||'medium',tags:(row.tags||'').split('|').filter(Boolean)}));
  } else { rows=typeof req.body.data==='string'?JSON.parse(req.body.data):req.body.data; }
  if(!Array.isArray(rows)||!rows.length)return res.status(400).json({message:'Import data must be a non-empty array'});
  const created = await Question.bulkCreate(
    rows.map((row) => ({
      ...row,
      courseId: req.body.courseId,
      moduleId: req.body.moduleId || null,
      smeId: req.user.id,
      type: row.type || 'single_choice',
      status: row.status || 'draft',
    })),
  );
  res.status(201).json({ imported: created.length });
});
