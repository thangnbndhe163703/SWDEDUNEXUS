const router = require('express').Router();
const controller = require('../controllers/smeController');
const { protect, authorize } = require('../middleware/authMiddleware');
router.use(protect, authorize('sme'));
router.get('/courses', controller.getCourses);
router.get('/courses/:courseId/structure', controller.getCourseStructure);
module.exports = router;
