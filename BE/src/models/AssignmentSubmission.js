const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('AssignmentSubmission', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  assignmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'assignment_id' },
  studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'student_id' },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  attachmentUrl: { type: DataTypes.STRING(500), field: 'attachment_url' },
  status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
  score: { type: DataTypes.DECIMAL(5, 2) },
  feedback: { type: DataTypes.TEXT('long') },
  rubricResult: { type: DataTypes.JSON, field: 'rubric_result' },
  aiError: { type: DataTypes.TEXT, field: 'ai_error' },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'submitted_at' },
  gradedAt: { type: DataTypes.DATE, field: 'graded_at' },
}, { tableName: 'assignment_submissions', indexes: [{ unique: true, fields: ['assignment_id', 'student_id'] }] });
