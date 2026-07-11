const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    if (!token) return res.status(401).json({ message: 'Authentication token is required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-secret-change-me');
    const user = await User.findByPk(payload.id, { include: { model: Role, as: 'role' } });
    if (!user || user.status !== 'active') return res.status(401).json({ message: 'Account is unavailable' });
    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role.name)) return res.status(403).json({ message: 'You do not have permission' });
  next();
};

module.exports = { protect, authorize };
