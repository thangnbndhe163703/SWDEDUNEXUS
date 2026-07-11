const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('CourseSme', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
}, { tableName: 'course_smes', indexes: [{ unique: true, fields: ['course_id', 'user_id'] }] });
