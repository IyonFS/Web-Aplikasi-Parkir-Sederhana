// controllers/payment.controller.js
// Mengelola alur pembayaran Midtrans end-to-end

const prisma             = require('../../config/db');
const midtransService    = require('../../services/midtrans.service');
const reservationRepo    = require('../../repositories/reservation.repository');
const slotRepository     = require('../../repositories/slot.repository');
const {
  emitSlotUpdated,
  emitReservationCreated,
  emitSummaryUpdated,
  emitToUser,
} = require('../../socket/socket.server');
const analyticsRepo = require('../../repositories/analytics.repository');
const { resolveReservationPricing } = require('../../services/tariff-pricing.service');

async function broadcastSummary() {
  const summary = await analyticsRepo.getSummary();
  emitSummaryUpdated({ slots: summary.slots, reservations: summary.reservations });
}

// ── POST /api/payments/create ──────────────────────────────────────────────
// 1. Buat reservasi (status pending_payment)
// 2. Generate Snap token Midtrans
// 3. Return token ke frontend untuk Snap popup
async function createPayment(req, res) {
  try {
    const { slotId, vehiclePlate, hours, vehicleType = 'car' } = req.body;
    const allowedVehicleTypes = ['motorcycle', 'car', 'van', 'bus', 'other'];

    if (!slotId || !vehiclePlate || !hours)
      return res.status(400).json({ error: 'slotId, vehiclePlate, dan hours wajib diisi' });
    if (hours < 1 || hours > 24)
      return res.status(400).json({ error: 'Durasi harus 1-24 jam' });
    if (!allowedVehicleTypes.includes(vehicleType))
      return res.status(400).json({ error: 'Jenis kendaraan tidak valid' });

    const slot = await slotRepository.findById(slotId);
    if (!slot)          return res.status(404).json({ error: 'Slot tidak ditemukan' });
    if (!slot.isActive) return res.status(400).json({ error: 'Slot tidak aktif' });
    if (slot.status !== 'available')
      return res.status(409).json({ error: 'Slot tidak tersedia' });

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 3600000);
    const pricing = await resolveReservationPricing({
      vehicleType,
      fallbackPricePerHour: slot.pricePerHour,
    });
    const totalAmount = Number(hours) * pricing.pricePerHour;

    // Cek konflik
    const conflict = await reservationRepo.hasConflict(slotId, startTime, endTime);
    if (conflict)
      return res.status(409).json({ error: 'Slot sudah memiliki reservasi aktif' });

    // Ambil info user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Buat reservasi dengan status pending_payment + lock slot
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          userId:       req.user.id,
          slotId,
          slotNumber:   slot.number,
          vehiclePlate: vehiclePlate.toUpperCase().trim(),
          vehicleType,
          startTime,
          endTime,
          hours:        Number(hours),
          totalAmount,
          status:       'pending_payment',
        },
        include: { slot: { select: { number: true, floor: true, type: true, lotId: true } } },
      });

      // Lock slot sementara (occupied) agar tidak dipesan orang lain
      const updatedSlot = await tx.parkingSlot.update({
        where: { id: slotId },
        data:  { status: 'occupied' },
      });

      // Buat payment record dengan status pending
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          method:   'pending',
          amount:   totalAmount,
          currency: 'IDR',
          status:   'pending',
          expiredAt: new Date(Date.now() + 3600000), // expire 1 jam
        },
      });

      return {
        reservation: {
          ...reservation,
          appliedPricePerHour: pricing.pricePerHour,
          pricingSource: pricing.source,
          tariffName: pricing.tariff?.name || null,
        },
        updatedSlot,
        payment,
      };
    });

    // Generate Snap token Midtrans
    let snapToken     = null;
    let snapRedirectUrl = null;
    let midtransOrderId = null;
    let gateway = midtransService.getGatewayStatus();

    try {
      const snapResult = await midtransService.createSnapToken({
        reservation: result.reservation,
        user,
        slot,
      });
      snapToken       = snapResult.snapToken;
      snapRedirectUrl = snapResult.snapRedirectUrl;
      midtransOrderId = snapResult.orderId;

      // Simpan Snap token ke payment record
      await prisma.payment.update({
        where: { reservationId: result.reservation.id },
        data: {
          snapToken,
          snapRedirectUrl,
          midtransOrderId,
        },
      });
      gateway = { ...gateway, code: 'snap_ready', reason: null };
    } catch (midtransErr) {
      const normalizedError = midtransService.normalizeMidtransError(midtransErr);
      gateway = {
        ...gateway,
        code: normalizedError.code,
        reason: normalizedError.message,
        raw: normalizedError.raw,
      };
      console.error('Midtrans error:', normalizedError.raw);
      // Jika Midtrans gagal (sandbox key salah dll), fallback ke demo mode
      console.log('Midtrans tidak tersedia, menggunakan demo mode');
    }

    // Emit slot occupied ke semua user
    emitSlotUpdated({ ...result.updatedSlot, lotId: slot.lotId });

    // Kirim notif ke user
    emitToUser(req.user.id, 'notification', {
      type:    'payment_pending',
      title:   'Selesaikan Pembayaran',
      message: `Booking Slot ${slot.number} menunggu pembayaran. Selesaikan dalam 60 menit.`,
      reservationId: result.reservation.id,
      ts: new Date().toISOString(),
    });

    // Auto-expire: batalkan booking jika 65 menit tidak bayar
    setTimeout(async () => {
      try {
        const payment = await prisma.payment.findUnique({
          where: { reservationId: result.reservation.id },
        });
        if (payment?.status === 'pending') {
          await expireUnpaidReservation(result.reservation.id, slot.lotId);
        }
      } catch (e) { console.error('Auto-expire error:', e.message); }
    }, 65 * 60 * 1000);

    res.status(201).json({
      reservation:    result.reservation,
      payment: {
        snapToken,
        snapRedirectUrl,
        midtransOrderId,
        amount:  totalAmount,
        status:  'pending',
        demoMode: !snapToken, // true jika Midtrans tidak terkonfigurasi
        gateway,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat pembayaran' });
  }
}

// ── POST /api/payments/webhook ─────────────────────────────────────────────
// Menerima notifikasi dari Midtrans server (tidak perlu auth)
async function handleWebhook(req, res) {
  try {
    const notification = req.body;

    console.log('📨 Midtrans webhook:', notification.order_id, notification.transaction_status);

    // Verifikasi signature
    const isValid = midtransService.verifyWebhookSignature({
      orderId:       notification.order_id,
      statusCode:    notification.status_code,
      grossAmount:   notification.gross_amount,
      signatureKey:  notification.signature_key,
    });

    if (!isValid) {
      console.warn('⚠ Webhook signature invalid!');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Cari payment by midtrans order id
    const payment = await prisma.payment.findUnique({
      where: { midtransOrderId: notification.order_id },
      include: {
        reservation: {
          include: {
            slot: { include: { lot: { select: { id: true } } } },
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!payment) {
      console.warn('⚠ Payment not found for order:', notification.order_id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const newStatus = midtransService.mapMidtransStatus(
      notification.transaction_status,
      notification.fraud_status
    );

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:                   newStatus,
        method:                   notification.payment_type || 'unknown',
        midtransPaymentType:      notification.payment_type,
        midtransTransactionId:    notification.transaction_id,
        midtransStatus:           notification.transaction_status,
        vaNumber:                 notification.va_numbers?.[0]?.va_number || null,
        vaBank:                   notification.va_numbers?.[0]?.bank || null,
        paidAt:                   newStatus === 'paid' ? new Date() : undefined,
        receiptUrl:               notification.pdf_url || null,
      },
    });

    // Handle berdasarkan status
    if (newStatus === 'paid') {
      await handlePaymentSuccess(payment, notification);
    } else if (['failed', 'expired'].includes(newStatus)) {
      await expireUnpaidReservation(payment.reservationId, payment.reservation.slot?.lot?.id);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ── Handle payment sukses ──────────────────────────────────────────────────
async function handlePaymentSuccess(payment, notification) {
  const { reservation } = payment;

  // Update reservasi jadi active
  await prisma.reservation.update({
    where: { id: reservation.id },
    data:  { status: 'active' },
  });

  // Emit ke semua user
  emitReservationCreated(reservation);

  // Notif personal ke user
  emitToUser(reservation.userId, 'notification', {
    type:    'payment_success',
    title:   '✓ Pembayaran Berhasil!',
    message: `Slot ${reservation.slotNumber} aktif hingga ${new Date(reservation.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    reservationId: reservation.id,
    ts: new Date().toISOString(),
  });

  // Jadwalkan alert 15 menit sebelum habis
  const msUntil15 = new Date(reservation.endTime).getTime() - Date.now() - 15 * 60 * 1000;
  if (msUntil15 > 0) {
    setTimeout(() => {
      emitToUser(reservation.userId, 'notification', {
        type:    'booking_expiring',
        title:   '⏰ Booking Hampir Habis!',
        message: `Slot ${reservation.slotNumber} habis dalam 15 menit.`,
        reservationId: reservation.id,
        ts: new Date().toISOString(),
      });
    }, msUntil15);
  }

  await broadcastSummary();
  console.log(`✅ Payment success: ${reservation.slotNumber} (${reservation.vehiclePlate})`);
}

// ── Expire unpaid reservation ──────────────────────────────────────────────
async function expireUnpaidReservation(reservationId, lotId) {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.status !== 'pending_payment') return;

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data:  { status: 'expired' },
      });
      await tx.parkingSlot.update({
        where: { id: reservation.slotId },
        data:  { status: 'available' },
      });
    });

    // Beritahu user
    emitToUser(reservation.userId, 'notification', {
      type:    'payment_expired',
      title:   'Booking Dibatalkan',
      message: `Pembayaran Slot ${reservation.slotNumber} kedaluwarsa. Silakan booking ulang.`,
      reservationId,
      ts: new Date().toISOString(),
    });

    // Broadcast slot available kembali
    const slot = await slotRepository.findById(reservation.slotId);
    if (slot) emitSlotUpdated({ ...slot, lotId: lotId || slot.lotId });
    await broadcastSummary();

    console.log(`⏰ Reservation expired: ${reservationId}`);
  } catch (err) {
    console.error('Expire reservation error:', err.message);
  }
}

// ── GET /api/payments/:reservationId/status ───────────────────────────────
// Frontend poll status setelah Snap ditutup
async function getPaymentStatus(req, res) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { reservationId: req.params.reservationId },
      include: { reservation: { select: { userId: true, status: true, slotNumber: true } } },
    });

    if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });

    if (req.user.role === 'user' && payment.reservation.userId !== req.user.id)
      return res.status(403).json({ error: 'Tidak diizinkan' });

    // Jika masih pending dan ada midtrans order, cek status ke Midtrans
    if (payment.status === 'pending' && payment.midtransOrderId) {
      try {
        const mtStatus = await midtransService.getTransactionStatus(payment.midtransOrderId);
        if (mtStatus) {
          const newStatus = midtransService.mapMidtransStatus(
            mtStatus.transaction_status,
            mtStatus.fraud_status
          );
          if (newStatus !== 'pending') {
            // Update locally jika webhook belum datang
            await prisma.payment.update({
              where: { id: payment.id },
              data:  { status: newStatus, paidAt: newStatus === 'paid' ? new Date() : undefined },
            });
            if (newStatus === 'paid') {
              await prisma.reservation.update({ where: { id: req.params.reservationId }, data: { status: 'active' } });
            }
            return res.json({ ...payment, status: newStatus });
          }
        }
      } catch (e) { /* ignore, return cached status */ }
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil status payment' });
  }
}

// ── GET /api/payments/:reservationId/invoice ──────────────────────────────
// Generate invoice HTML/JSON
async function getInvoice(req, res) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { reservationId: req.params.reservationId },
      include: {
        reservation: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            slot: { include: { lot: { select: { name: true, address: true } } } },
          },
        },
      },
    });

    if (!payment) return res.status(404).json({ error: 'Invoice tidak ditemukan' });

    if (req.user.role === 'user' && payment.reservation.userId !== req.user.id)
      return res.status(403).json({ error: 'Tidak diizinkan' });

    const { reservation } = payment;
    const invoiceNumber = `INV-${payment.midtransOrderId || reservation.id.slice(0, 8).toUpperCase()}`;

    // Return invoice data (bisa di-render jadi PDF di frontend)
    res.json({
      invoiceNumber,
      issuedAt:   payment.paidAt || payment.createdAt,
      dueAt:      payment.expiredAt,
      status:     payment.status,
      // Customer
      customer: {
        name:  reservation.user.name,
        email: reservation.user.email,
        phone: reservation.user.phone,
      },
      // Items
      items: [
        {
          description: `Parkir Slot ${reservation.slotNumber} — ${reservation.hours} jam`,
          quantity:    reservation.hours,
          unitPrice:   Math.round(reservation.totalAmount / reservation.hours),
          total:       reservation.totalAmount,
        },
      ],
      // Totals
      subtotal:    reservation.totalAmount,
      tax:         0,
      total:       reservation.totalAmount,
      currency:    payment.currency,
      // Payment info
      paymentMethod:    payment.method,
      paymentType:      payment.midtransPaymentType,
      transactionId:    payment.midtransTransactionId,
      vaNumber:         payment.vaNumber,
      vaBank:           payment.vaBank,
      // Location
      location: {
        lotName:  reservation.slot?.lot?.name || 'Hygiopark',
        address:  reservation.slot?.lot?.address || '',
        floor:    reservation.slot?.floor,
        slotType: reservation.slot?.type,
      },
      // Booking info
      booking: {
        vehiclePlate: reservation.vehiclePlate,
        vehicleType: reservation.vehicleType,
        startTime:    reservation.startTime,
        endTime:      reservation.endTime,
        hours:        reservation.hours,
        slotNumber:   reservation.slotNumber,
      },
      // Branding
      company: {
        name:    'Hygiopark',
        tagline: 'Smart Parking Management',
        email:   'support@hygiopark.io',
        website: 'https://hygiopark.io',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil invoice' });
  }
}

// ── POST /api/payments/demo-confirm ───────────────────────────────────────
// Demo mode: konfirmasi payment tanpa Midtrans (untuk testing)
async function demoConfirm(req, res) {
  try {
    const { reservationId, method = 'bank_transfer', provider = null } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { reservationId },
      include: { reservation: { include: { slot: { include: { lot: { select: { id: true } } } } } } },
    });

    if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
    if (payment.status === 'paid') return res.status(400).json({ error: 'Sudah dibayar' });

    const demoMeta = buildDemoPaymentMeta(method, provider);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data:  {
          status: 'paid',
          method: demoMeta.method,
          midtransPaymentType: demoMeta.paymentType,
          midtransTransactionId: demoMeta.transactionId,
          midtransStatus: 'settlement',
          vaNumber: demoMeta.vaNumber,
          vaBank: demoMeta.vaBank,
          paidAt: new Date(),
        },
      });
      await tx.reservation.update({
        where: { id: reservationId },
        data:  { status: 'active' },
      });
    });

    await handlePaymentSuccess(payment, {});
    const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
    res.json({ payment: updated, message: 'Demo payment confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal konfirmasi demo payment' });
  }
}

async function cancelPendingPayment(req, res) {
  try {
    const { reservationId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { reservationId },
      include: {
        reservation: {
          include: {
            slot: { include: { lot: { select: { id: true } } } },
          },
        },
      },
    });

    if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });
    if (req.user.role === 'user' && payment.reservation.userId !== req.user.id)
      return res.status(403).json({ error: 'Tidak diizinkan' });
    if (payment.status !== 'pending' || payment.reservation.status !== 'pending_payment')
      return res.status(400).json({ error: 'Payment ini tidak bisa dibatalkan lagi' });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'cancelled',
          method: 'cancelled',
          midtransStatus: 'cancelled_by_user',
          expiredAt: new Date(),
        },
      });

      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });

      await tx.parkingSlot.update({
        where: { id: payment.reservation.slotId },
        data: { status: 'available' },
      });
    });

    const slot = await slotRepository.findById(payment.reservation.slotId);
    if (slot) emitSlotUpdated({ ...slot, lotId: payment.reservation.slot?.lot?.id || slot.lotId });

    emitToUser(payment.reservation.userId, 'notification', {
      type: 'payment_cancelled',
      title: 'Pembayaran Dibatalkan',
      message: `Booking Slot ${payment.reservation.slotNumber} dibatalkan sebelum pembayaran selesai.`,
      reservationId,
      ts: new Date().toISOString(),
    });

    await broadcastSummary();

    res.json({ success: true, message: 'Payment pending berhasil dibatalkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membatalkan payment pending' });
  }
}

function buildDemoPaymentMeta(method, provider) {
  const normalizedMethod = String(method || 'bank_transfer').toLowerCase();
  const normalizedProvider = provider ? String(provider).toLowerCase() : null;
  const transactionId = `DEMO-${Date.now()}`;

  if (normalizedMethod === 'bank_transfer') {
    const bank = normalizedProvider || 'bca';
    return {
      method: `demo_${bank}_va`,
      paymentType: 'bank_transfer',
      transactionId,
      vaNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      vaBank: bank,
    };
  }

  if (normalizedMethod === 'ewallet') {
    const wallet = normalizedProvider || 'gopay';
    return {
      method: `demo_${wallet}`,
      paymentType: wallet,
      transactionId,
      vaNumber: null,
      vaBank: null,
    };
  }

  if (normalizedMethod === 'credit_card') {
    return {
      method: 'demo_credit_card',
      paymentType: 'credit_card',
      transactionId,
      vaNumber: null,
      vaBank: null,
    };
  }

  return {
    method: 'demo_qris',
    paymentType: 'qris',
    transactionId,
    vaNumber: null,
    vaBank: null,
  };
}

async function getGatewayConfig(_req, res) {
  try {
    res.json(midtransService.getGatewayStatus());
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil status gateway' });
  }
}

module.exports = {
  createPayment,
  handleWebhook,
  getPaymentStatus,
  getInvoice,
  demoConfirm,
  cancelPendingPayment,
  getGatewayConfig,
};





