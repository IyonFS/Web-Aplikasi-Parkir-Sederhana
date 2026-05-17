const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const controller = require('./tariffs.controller');

router.use(authenticate);

router.get('/', controller.listTariffs);
router.use(authorize('admin'));
router.post('/', controller.createTariff);
router.patch('/:id', controller.updateTariff);
router.delete('/:id', controller.deleteTariff);

module.exports = router;


