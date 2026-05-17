// src/services/midtrans.service.js
// Wrapper untuk Midtrans SDK — Snap + Core API

const midtransClient = require('midtrans-client');
const crypto = require('crypto');

// ── Client Instances ───────────────────────────────────────────────────────
let _snap = null;
let _core = null;

function getGatewayStatus() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';

  if (!serverKey || !clientKey) {
    return {
      configured: false,
      mode: process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'production' : 'sandbox',
      code: 'missing_keys',
      reason: 'Midtrans key belum lengkap di environment',
    };
  }

  return {
    configured: true,
    mode: process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'production' : 'sandbox',
    code: 'ready',
    reason: null,
  };
}

function normalizeMidtransError(err) {
  const message = err?.ApiResponse?.error_messages?.join(' ') || err?.message || 'Midtrans error';

  if (/401|unauthorized|access denied/i.test(message)) {
    return {
      code: 'unauthorized',
      message: 'Midtrans menolak akses. Periksa Server Key dan Client Key sandbox/production Anda.',
      raw: message,
    };
  }

  if (/EACCES|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|connection failure|network/i.test(message)) {
    return {
      code: 'network_error',
      message: 'Backend tidak bisa terhubung ke Midtrans. Periksa koneksi internet, firewall, atau proxy server.',
      raw: message,
    };
  }

  return {
    code: 'midtrans_error',
    message,
    raw: message,
  };
}

function getSnap() {
  const status = getGatewayStatus();
  if (!status.configured) throw new Error(status.reason);
  if (!_snap) {
    _snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey:    process.env.MIDTRANS_SERVER_KEY,
      clientKey:    process.env.MIDTRANS_CLIENT_KEY,
    });
  }
  return _snap;
}

function getCore() {
  const status = getGatewayStatus();
  if (!status.configured) throw new Error(status.reason);
  if (!_core) {
    _core = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey:    process.env.MIDTRANS_SERVER_KEY,
      clientKey:    process.env.MIDTRANS_CLIENT_KEY,
    });
  }
  return _core;
}

// ── Create Snap Token ──────────────────────────────────────────────────────
// Dipanggil saat user akan bayar — returns snapToken untuk popup
async function createSnapToken({ reservation, user, slot }) {
  const orderId = `PARK-${reservation.id.slice(0, 8).toUpperCase()}-${Date.now()}`;

  const parameter = {
    transaction_details: {
      order_id:     orderId,
      gross_amount: Math.round(reservation.totalAmount), // Midtrans perlu integer
    },
    item_details: [
      {
        id:       slot?.number || reservation.slotNumber,
        price:    Math.round(slot?.pricePerHour || (reservation.totalAmount / reservation.hours)),
        quantity: reservation.hours,
        name:     `Parkir Slot ${reservation.slotNumber} (${reservation.hours} jam)`,
        category: 'parking',
      },
    ],
    customer_details: {
      first_name: user.name.split(' ')[0],
      last_name:  user.name.split(' ').slice(1).join(' ') || '',
      email:      user.email,
      phone:      user.phone || '',
    },
    callbacks: {
      finish:  `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/reservations?payment=success`,
      error:   `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/reservations?payment=error`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app/reservations?payment=pending`,
    },
    expiry: {
      unit:     'minutes',
      duration: 60, // Token expired setelah 60 menit
    },
    // Enable semua payment method
    enabled_payments: [
      'credit_card', 'mandiri_clickpay', 'cimb_clicks',
      'bca_klikbca', 'bca_klikpay', 'bri_epay', 'echannel',
      'permata_va', 'bca_va', 'bni_va', 'bri_va', 'other_va',
      'gopay', 'indomaret', 'alfamart', 'danamon_online',
      'akulaku', 'shopeepay',
    ],
  };

  const snapResponse = await getSnap().createTransaction(parameter);
  return { snapToken: snapResponse.token, snapRedirectUrl: snapResponse.redirect_url, orderId };
}

// ── Verify Webhook Signature ───────────────────────────────────────────────
function verifyWebhookSignature({ orderId, statusCode, grossAmount, signatureKey }) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');
  return hash === signatureKey;
}

// ── Get Transaction Status (manual check) ────────────────────────────────
async function getTransactionStatus(orderId) {
  try {
    return await getCore().transaction.status(orderId);
  } catch (err) {
    console.error('Midtrans status check failed:', err.message);
    return null;
  }
}

// ── Map Midtrans status ke status internal ────────────────────────────────
function mapMidtransStatus(transactionStatus, fraudStatus) {
  // https://docs.midtrans.com/docs/get-status
  if (transactionStatus === 'capture') {
    return fraudStatus === 'challenge' ? 'pending' : 'paid';
  }
  if (transactionStatus === 'settlement') return 'paid';
  if (['cancel', 'deny', 'failure'].includes(transactionStatus)) return 'failed';
  if (transactionStatus === 'expire') return 'expired';
  if (transactionStatus === 'pending') return 'pending';
  if (transactionStatus === 'refund') return 'refunded';
  return 'pending';
}

module.exports = {
  getSnap,
  getCore,
  getGatewayStatus,
  normalizeMidtransError,
  createSnapToken,
  verifyWebhookSignature,
  getTransactionStatus,
  mapMidtransStatus,
};

