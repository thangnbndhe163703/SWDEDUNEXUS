const router = require('express').Router();
const controller = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));
router.route('/').get(controller.getAll).post(controller.create);
router.route('/:id').put(controller.update).delete(controller.remove);

module.exports = router;
