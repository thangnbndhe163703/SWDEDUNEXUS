const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('UserSubscription', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
  packageId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'package_id' },
  startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'started_at' },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
  status: { type: DataTypes.ENUM('active', 'expired', 'cancelled'), defaultValue: 'active' },
}, { tableName: 'user_subscriptions', indexes: [{ unique: true, fields: ['user_id', 'package_id'] }] });
