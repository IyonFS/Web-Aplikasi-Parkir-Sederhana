const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const controller = require('./vehicles.controller');

router.use(authenticate, authorize('admin'));

router.get('/', controller.listVehicles);
router.post('/', controller.createVehicle);
router.patch('/:id', controller.updateVehicle);
router.delete('/:id', controller.deleteVehicle);

module.exports = router;


