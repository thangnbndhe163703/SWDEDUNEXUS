const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Enrollment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  courseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'course_id' },
  progress: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, validate: { min: 0, max: 100 } },
  status: { type: DataTypes.ENUM('active', 'completed', 'cancelled'), defaultValue: 'active' },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'enrolled_at' },
  completedAt: { type: DataTypes.DATE, field: 'completed_at' },
}, { tableName: 'enrollments', indexes: [{ unique: true, fields: ['user_id', 'course_id'] }] });
