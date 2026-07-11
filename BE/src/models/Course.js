const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Course', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'category_id' },
  instructorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'instructor_id' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT('long') },
  level: { type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'), defaultValue: 'beginner' },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  thumbnailUrl: { type: DataTypes.STRING(500), field: 'thumbnail_url' },
  status: { type: DataTypes.ENUM('draft', 'review', 'published', 'archived'), defaultValue: 'draft' },
  publishedAt: { type: DataTypes.DATE, field: 'published_at' },
}, { tableName: 'courses' });
