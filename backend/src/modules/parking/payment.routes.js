const router     = require('express').Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getInvoice,
  demoConfirm,
  cancelPendingPayment,
  getGatewayConfig,
} = require('./payment.controller');

// Webhook Midtrans — TANPA auth (dipanggil server Midtrans)
// Raw body diperlukan untuk verifikasi signature
router.post('/webhook', handleWebhook);

// Semua route di bawah perlu auth
router.post('/create',                     authenticate, createPayment);
router.get('/config',                      authenticate, getGatewayConfig);
router.get('/:reservationId/status',       authenticate, getPaymentStatus);
router.get('/:reservationId/invoice',      authenticate, getInvoice);
router.post('/:reservationId/cancel',      authenticate, cancelPendingPayment);
router.post('/demo-confirm',               authenticate, demoConfirm);

module.exports = router;


