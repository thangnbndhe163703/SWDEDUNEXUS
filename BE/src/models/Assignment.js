const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Assignment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  moduleId: { type: DataTypes.INTEGER.UNSIGNED, field: 'module_id' },
  smeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'sme_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  instructions: { type: DataTypes.TEXT('long'), allowNull: false },
  rubric: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  maxScore: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 100, field: 'max_score' },
  dueAt: { type: DataTypes.DATE, field: 'due_at' },
  status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' },
}, { tableName: 'assignments' });
