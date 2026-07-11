const jwt = require('jsonwebtoken');

module.exports = (user) => jwt.sign(
  { id: user.id, roleId: user.roleId },
  process.env.JWT_SECRET || 'development-secret-change-me',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
