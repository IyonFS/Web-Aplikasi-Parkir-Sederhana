const router = require('express').Router();
const { getSummary, getRevenue, getPeakHours } = require('./reports.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/summary',    authenticate, getSummary);
router.get('/revenue',    authenticate, getRevenue);
router.get('/peak-hours', authenticate, getPeakHours);

module.exports = router;


