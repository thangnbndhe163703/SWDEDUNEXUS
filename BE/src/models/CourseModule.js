const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('CourseModule', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  orderIndex: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1, field: 'order_index' },
  status: { type: DataTypes.ENUM('draft', 'published'), defaultValue: 'draft' },
}, { tableName: 'course_modules' });
