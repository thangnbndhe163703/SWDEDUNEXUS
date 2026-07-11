const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'role_id' },
  fullName: { type: DataTypes.STRING(100), allowNull: false, field: 'full_name' },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  avatarUrl: { type: DataTypes.STRING(500), field: 'avatar_url' },
  phone: { type: DataTypes.STRING(20) },
  status: { type: DataTypes.ENUM('active', 'inactive', 'blocked'), defaultValue: 'active' },
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['passwordHash'] } },
  scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
});
