const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('FlashcardProgress', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'student_id' },
  flashcardId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'flashcard_id' },
  remembered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  reviewCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, field: 'review_count' },
  lastReviewedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'last_reviewed_at' },
}, {
  tableName: 'flashcard_progress',
  indexes: [{ unique: true, fields: ['student_id', 'flashcard_id'] }],
});
