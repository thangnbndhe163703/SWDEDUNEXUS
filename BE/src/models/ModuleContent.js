const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('ModuleContent', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  moduleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'module_id' },
  type: { type: DataTypes.ENUM('lesson', 'flashcard', 'assignment', 'question', 'quiz'), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  contentUrl: { type: DataTypes.STRING(500), field: 'content_url' },
  orderIndex: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1, field: 'order_index' },
  status: { type: DataTypes.ENUM('draft', 'published'), defaultValue: 'draft' },
}, { tableName: 'module_contents' });
