const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('SubscriptionPackage', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  durationDays: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'duration_days' },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'subscription_packages' });
