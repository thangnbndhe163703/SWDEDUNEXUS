const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Flashcard', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  moduleId: { type: DataTypes.INTEGER.UNSIGNED, field: 'module_id' },
  smeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'sme_id' },
  front: { type: DataTypes.TEXT, allowNull: false },
  back: { type: DataTypes.TEXT('long'), allowNull: false },
  hint: { type: DataTypes.TEXT },
  difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
  tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' },
}, { tableName: 'flashcards' });
