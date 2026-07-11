const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const createToken = require('../utils/createToken');
const asyncHandler = require('../utils/asyncHandler');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendAuthResponse = (res, user) => {
  const safeUser = user.toJSON();
  delete safeUser.passwordHash;
  res.json({ token: createToken(user), user: safeUser });
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.scope('withPassword').findOne({ where: { email }, include: { model: Role, as: 'role' } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect' });
  }
  if (user.status !== 'active') return res.status(403).json({ message: 'Account is not active' });

  sendAuthResponse(res, user);
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Google credential is required' });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: 'Google Login is not configured' });

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) return res.status(401).json({ message: 'Google email is not verified' });

  const studentRole = await Role.findOne({ where: { name: 'student' } });
  if (!studentRole) return res.status(500).json({ message: 'Student role is not configured' });

  let user = await User.findOne({ where: { email: payload.email }, include: { model: Role, as: 'role' } });
  if (user && user.role?.name !== 'student') return res.status(403).json({ message: 'Student account is required' });
  if (!user) {
    user = await User.create({
      roleId: studentRole.id,
      fullName: payload.name || payload.email.split('@')[0],
      email: payload.email,
      passwordHash: await bcrypt.hash(require('crypto').randomUUID(), 10),
      avatarUrl: payload.picture,
      status: 'active',
    });
    user = await User.findByPk(user.id, { include: { model: Role, as: 'role' } });
  } else {
    await user.update({
      fullName: payload.name || user.fullName,
      avatarUrl: payload.picture || user.avatarUrl,
    });
  }
  if (user.status !== 'active') return res.status(403).json({ message: 'Account is not active' });
  sendAuthResponse(res, user);
});

exports.me = asyncHandler(async (req, res) => res.json(req.user));
