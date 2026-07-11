const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Lesson', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  contentType: { type: DataTypes.ENUM('video', 'document', 'quiz', 'flashcard', 'essay'), defaultValue: 'video', field: 'content_type' },
  contentUrl: { type: DataTypes.STRING(500), field: 'content_url' },
  content: { type: DataTypes.TEXT('long') },
  durationMinutes: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, field: 'duration_minutes' },
  orderIndex: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1, field: 'order_index' },
  isPreview: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_preview' },
}, { tableName: 'lessons' });
