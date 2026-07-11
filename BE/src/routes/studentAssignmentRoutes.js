const router = require('express').Router();
const controller = require('../controllers/studentAssignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
router.use(protect, authorize('student'));
router.get('/', controller.list);
router.post('/:assignmentId/submit', controller.submit);
router.get('/:assignmentId/result', controller.result);
module.exports = router;
