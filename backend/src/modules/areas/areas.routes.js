const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const controller = require('./areas.controller');

router.use(authenticate, authorize('admin'));

router.get('/', controller.listLots);
router.post('/', controller.createLot);
router.patch('/:id', controller.updateLot);
router.delete('/:id', controller.deleteLot);

module.exports = router;


