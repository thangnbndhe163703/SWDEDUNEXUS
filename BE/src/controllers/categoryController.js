const { Category } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (_req, res) => res.json(await Category.findAll({ order: [['name', 'ASC']] })));
