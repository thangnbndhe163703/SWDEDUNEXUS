const router = require('express').Router();
const controller = require('../controllers/flashcardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/library', authorize('student'), controller.listForStudent);
router.get('/', authorize('sme'), controller.listForSme);
router.post('/generate', authorize('sme'), controller.generate);
router.post('/bulk', authorize('sme'), controller.createMany);
router.post('/', authorize('sme'), controller.create);
router.put('/:id', authorize('sme'), controller.update);
router.delete('/:id', authorize('sme'), controller.remove);

module.exports = router;
