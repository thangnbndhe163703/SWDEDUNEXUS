const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (_req, res) => {
  const users = await User.findAll({ include: { model: Role, as: 'role' }, order: [['id', 'ASC']] });
  res.json(users);
});

exports.create = asyncHandler(async (req, res) => {
  const { fullName, email, password, roleId, phone, status } = req.body;
  if (!fullName || !email || !password || !roleId) return res.status(400).json({ message: 'fullName, email, password and roleId are required' });
  const user = await User.create({ fullName, email, roleId, phone, status, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(await User.findByPk(user.id, { include: { model: Role, as: 'role' } }));
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const values = { ...req.body };
  delete values.passwordHash;
  if (values.password) {
    values.passwordHash = await bcrypt.hash(values.password, 10);
    delete values.password;
  }
  await user.update(values);
  res.json(await User.findByPk(user.id, { include: { model: Role, as: 'role' } }));
});

exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.destroy();
  res.status(204).send();
});
