const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const createToken = require('../utils/createToken');
const asyncHandler = require('../utils/asyncHandler');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.scope('withPassword').findOne({ where: { email }, include: { model: Role, as: 'role' } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }
  if (user.status !== 'active') return res.status(403).json({ message: 'Account is not active' });

  const safeUser = user.toJSON();
  delete safeUser.passwordHash;
  res.json({ token: createToken(user), user: safeUser });
});

exports.me = asyncHandler(async (req, res) => res.json(req.user));
