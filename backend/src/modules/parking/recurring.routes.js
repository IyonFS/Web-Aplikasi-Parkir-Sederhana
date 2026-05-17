const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  listRecurring,
  createRecurring,
  toggleRecurring,
  deleteRecurring,
  runRecurringNow,
} = require('./recurring.controller');

router.get('/', authenticate, listRecurring);
router.post('/', authenticate, createRecurring);
router.patch('/:id/toggle', authenticate, toggleRecurring);
router.delete('/:id', authenticate, deleteRecurring);
router.post('/run-now', authenticate, authorize('admin', 'operator'), runRecurringNow);

module.exports = router;


