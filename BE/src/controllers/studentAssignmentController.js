const { Op } = require('sequelize');
const { Assignment, AssignmentSubmission, Enrollment, Course, CourseModule } = require('../models');
const { gradeSubmission } = require('../services/assignmentGradingService');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.findAll({ where: { userId: req.user.id, status: { [Op.ne]: 'cancelled' } }, attributes: ['courseId'] });
  const courseIds = enrollments.map(item => item.courseId);
  res.json(await Assignment.findAll({ where: { courseId: courseIds, status: 'published' }, include: [
    { model: Course, as: 'course', attributes: ['id', 'title'] },
    { model: CourseModule, as: 'module', attributes: ['id', 'title'] },
    { model: AssignmentSubmission, as: 'submissions', where: { studentId: req.user.id }, required: false },
  ], order: [['dueAt', 'ASC']] }));
});

exports.submit = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByPk(req.params.assignmentId);
  if (!assignment || assignment.status !== 'published') return res.status(404).json({ message: 'Assignment not found' });
  const enrollment = await Enrollment.findOne({ where: { userId: req.user.id, courseId: assignment.courseId, status: { [Op.ne]: 'cancelled' } } });
  if (!enrollment) return res.status(403).json({ message: 'Student is not enrolled in this course' });
  if (!req.body.content?.trim()) return res.status(400).json({ message: 'Submission content is required' });
  const [submission, created] = await AssignmentSubmission.findOrCreate({ where: { assignmentId: assignment.id, studentId: req.user.id }, defaults: { content: req.body.content, attachmentUrl: req.body.attachmentUrl } });
  if (!created) await submission.update({ content: req.body.content, attachmentUrl: req.body.attachmentUrl || null, status: 'pending', score: null, feedback: null, rubricResult: null, aiError: null, submittedAt: new Date(), gradedAt: null });
  setImmediate(() => gradeSubmission(submission.id));
  res.status(202).json(submission);
});

exports.result = asyncHandler(async (req, res) => {
  const submission = await AssignmentSubmission.findOne({ where: { assignmentId: req.params.assignmentId, studentId: req.user.id }, include: [{ model: Assignment, as: 'assignment', attributes: ['id', 'title', 'maxScore', 'rubric'] }] });
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  res.json(submission);
});
