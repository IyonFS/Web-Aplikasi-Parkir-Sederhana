const prisma = require('../../config/db');
const slotRepository = require('../../repositories/slot.repository');
const waitlistService = require('../../services/waitlist.service');
const analyticsRepository = require('../../repositories/analytics.repository');
const {
  emitSlotUpdated,
  emitReservationCreated,
  emitSummaryUpdated,
  emitWaitlistUpdated,
} = require('../../socket/socket.server');
const { resolveReservationPricing } = require('../../services/tariff-pricing.service');

async function broadcastSummary() {
  const summary = await analyticsRepository.getSummary();
  emitSummaryUpdated({ slots: summary.slots, reservations: summary.reservations });
}

async function listWaitlist(req, res) {
  try {
    const { slotId } = req.query;
    const entries = await waitlistService.listWaitlist({
      userId: req.user.id,
      role: req.user.role,
      slotId,
    });
    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data waitlist' });
  }
}

async function joinWaitlist(req, res) {
  try {
    const { slotId, vehiclePlate, hours = 2 } = req.body;
    if (!slotId || !vehiclePlate) {
      return res.status(400).json({ error: 'slotId dan vehiclePlate wajib diisi' });
    }
    if (hours < 1 || hours > 24) {
      return res.status(400).json({ error: 'Durasi harus 1-24 jam' });
    }

    const slot = await slotRepository.findById(slotId);
    if (!slot) return res.status(404).json({ error: 'Slot tidak ditemukan' });

    const result = await waitlistService.joinWaitlist({
      userId: req.user.id,
      slotId,
      vehiclePlate,
      hours: Number(hours),
    });

    const statusCode = result.created ? 201 : 200;
    res.status(statusCode).json({
      entry: result.entry,
      created: result.created,
      message: result.created ? 'Berhasil masuk antrian' : 'Anda sudah dalam antrian slot ini',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal masuk waitlist' });
  }
}

async function cancelWaitlist(req, res) {
  try {
    const result = await waitlistService.cancelWaitlist({
      entryId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });

    if (!result) return res.status(404).json({ error: 'Entry waitlist tidak ditemukan' });
    if (result === 'forbidden') return res.status(403).json({ error: 'Tidak diizinkan' });

    res.json({ entry: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membatalkan waitlist' });
  }
}

async function confirmWaitlist(req, res) {
  try {
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: req.params.id },
      include: { slot: true },
    });

    if (!entry) return res.status(404).json({ error: 'Entry waitlist tidak ditemukan' });
    if (req.user.role === 'user' && entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Tidak diizinkan' });
    }
    if (entry.status !== 'notified') {
      return res.status(400).json({ error: 'Entry ini belum siap dikonfirmasi' });
    }
    if (entry.confirmDeadlineAt && new Date(entry.confirmDeadlineAt) < new Date()) {
      return res.status(400).json({ error: 'Batas waktu konfirmasi sudah habis' });
    }

    if (entry.slot.status !== 'available') {
      return res.status(409).json({ error: 'Slot sudah tidak tersedia' });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + entry.hours * 3600000);

    const conflict = await prisma.reservation.count({
      where: {
        slotId: entry.slotId,
        status: { in: ['active', 'pending_payment'] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
    if (conflict > 0) {
      return res.status(409).json({ error: 'Slot sudah memiliki reservasi aktif' });
    }

    const pricing = await resolveReservationPricing({
      vehicleType: 'car',
      fallbackPricePerHour: entry.slot.pricePerHour,
    });
    const totalAmount = entry.hours * pricing.pricePerHour;

    const reservation = await prisma.$transaction(async (tx) => {
      const created = await tx.reservation.create({
        data: {
          userId: entry.userId,
          slotId: entry.slotId,
          slotNumber: entry.slot.number,
          vehiclePlate: entry.vehiclePlate,
          vehicleType: 'car',
          startTime,
          endTime,
          hours: entry.hours,
          totalAmount,
          status: 'active',
        },
      });

      await tx.parkingSlot.update({
        where: { id: entry.slotId },
        data: { status: 'occupied' },
      });

      await tx.payment.create({
        data: {
          reservationId: created.id,
          method: 'waitlist',
          amount: totalAmount,
          currency: 'IDR',
          status: 'paid',
          paidAt: new Date(),
        },
      });

      await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: { status: 'confirmed', confirmedAt: new Date() },
      });

      return {
        ...created,
        appliedPricePerHour: pricing.pricePerHour,
        pricingSource: pricing.source,
        tariffName: pricing.tariff?.name || null,
      };
    });

    emitSlotUpdated({ ...entry.slot, status: 'occupied', updatedAt: new Date().toISOString() });
    emitReservationCreated(reservation);
    emitWaitlistUpdated({ slotId: entry.slotId, type: 'confirmed', entryId: entry.id });
    await broadcastSummary();

    res.json({ reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal konfirmasi antrian' });
  }
}

module.exports = {
  listWaitlist,
  joinWaitlist,
  cancelWaitlist,
  confirmWaitlist,
};


