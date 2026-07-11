const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Question', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  moduleId: { type: DataTypes.INTEGER.UNSIGNED, field: 'module_id' },
  smeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'sme_id' },
  type: { type: DataTypes.ENUM('single_choice', 'multiple_choice', 'true_false', 'short_answer'), defaultValue: 'single_choice' },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  correctAnswer: { type: DataTypes.JSON, allowNull: false, field: 'correct_answer' },
  explanation: { type: DataTypes.TEXT('long') },
  difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
  tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' },
}, { tableName: 'questions' });
