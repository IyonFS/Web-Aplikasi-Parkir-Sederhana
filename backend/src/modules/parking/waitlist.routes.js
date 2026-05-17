const router = require('express').Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  listWaitlist,
  joinWaitlist,
  cancelWaitlist,
  confirmWaitlist,
} = require('./waitlist.controller');

router.get('/', authenticate, listWaitlist);
router.post('/', authenticate, joinWaitlist);
router.patch('/:id/cancel', authenticate, cancelWaitlist);
router.patch('/:id/confirm', authenticate, confirmWaitlist);

module.exports = router;


