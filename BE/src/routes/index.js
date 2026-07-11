const router = require('express').Router();
const { Category } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/student', require('./studentRoutes'));
router.get('/categories', asyncHandler(async (_req, res) => res.json(await Category.findAll({ order: [['name', 'ASC']] }))));

module.exports = router;
