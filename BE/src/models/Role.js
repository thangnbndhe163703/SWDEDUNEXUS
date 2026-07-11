const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Role', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255) },
}, { tableName: 'roles' });
