const router = require('express').Router();
const controller = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', protect, authorize('admin', 'sme'), controller.create);
router.put('/:id', protect, authorize('admin', 'sme'), controller.update);
router.delete('/:id', protect, authorize('admin'), controller.remove);

module.exports = router;
