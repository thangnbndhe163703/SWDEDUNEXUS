const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
}, { tableName: 'categories' });
