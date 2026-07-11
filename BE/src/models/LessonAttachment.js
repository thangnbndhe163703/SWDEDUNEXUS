const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('LessonAttachment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  lessonId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'lesson_id' },
  name: { type: DataTypes.STRING(255), allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  mimeType: { type: DataTypes.STRING(100), field: 'mime_type' },
  sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, field: 'size_bytes' },
}, { tableName: 'lesson_attachments' });
