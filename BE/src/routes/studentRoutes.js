const router = require('express').Router();
const controller = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('student'));
router.get('/library', controller.getLibrary);
router.get('/library/courses/:courseId', controller.getCourseDetail);

module.exports = router;
