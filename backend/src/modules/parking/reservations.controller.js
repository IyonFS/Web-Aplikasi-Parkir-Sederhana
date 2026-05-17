const reservationRepository = require("../../repositories/reservation.repository");
const slotRepository = require("../../repositories/slot.repository");
const prisma = require("../../config/db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../middlewares/auth.middleware");
const {
  emitSlotUpdated,
  emitReservationCreated,
  emitReservationCancelled,
  emitReservationExtended,
  emitSummaryUpdated,
  emitToUser,
} = require("../../socket/socket.server");
const analyticsRepository = require("../../repositories/analytics.repository");
const waitlistService = require("../../services/waitlist.service");
const {
  resolveReservationPricing,
} = require("../../services/tariff-pricing.service");

// ── Helpers ────────────────────────────────────────────────────────────────
async function broadcastSummary() {
  const summary = await analyticsRepository.getSummary();
  emitSummaryUpdated({
    slots: summary.slots,
    reservations: summary.reservations,
  });
}

// GET /api/reservations
async function listReservations(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await reservationRepository.findAll({
      userId: req.user.id,
      role: req.user.role,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data reservasi" });
  }
}

// GET /api/reservations/:id
async function getReservation(req, res) {
  try {
    const reservation = await reservationRepository.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ error: "Reservasi tidak ditemukan" });
    if (req.user.role === "user" && reservation.userId !== req.user.id)
      return res.status(403).json({ error: "Tidak diizinkan" });
    res.json({ reservation });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data reservasi" });
  }
}

// POST /api/reservations
async function createReservation(req, res) {
  try {
    const { slotId, vehiclePlate, hours, vehicleType = "car" } = req.body;
    const allowedVehicleTypes = ["motorcycle", "car", "van", "bus", "other"];
    if (!slotId || !vehiclePlate || !hours)
      return res
        .status(400)
        .json({ error: "slotId, vehiclePlate, dan hours wajib diisi" });
    if (hours < 1 || hours > 24)
      return res.status(400).json({ error: "Durasi harus antara 1-24 jam" });
    if (!allowedVehicleTypes.includes(vehicleType))
      return res.status(400).json({ error: "Jenis kendaraan tidak valid" });

    const slot = await slotRepository.findById(slotId);
    if (!slot) return res.status(404).json({ error: "Slot tidak ditemukan" });
    if (!slot.isActive)
      return res.status(400).json({ error: "Slot tidak aktif" });
    if (slot.status !== "available")
      return res.status(409).json({ error: "Slot tidak tersedia saat ini" });

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 3600000);

    const conflict = await reservationRepository.hasConflict(
      slotId,
      startTime,
      endTime,
    );
    if (conflict)
      return res
        .status(409)
        .json({ error: "Slot sudah memiliki reservasi aktif" });

    const pricing = await resolveReservationPricing({
      vehicleType,
      fallbackPricePerHour: slot.pricePerHour,
    });
    const totalAmount = Number(hours) * pricing.pricePerHour;

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          userId: req.user.id,
          slotId,
          slotNumber: slot.number,
          vehiclePlate: vehiclePlate.toUpperCase().trim(),
          vehicleType,
          startTime,
          endTime,
          hours: Number(hours),
          totalAmount,
          status: "active",
        },
        include: {
          slot: {
            select: { number: true, floor: true, type: true, lotId: true },
          },
        },
      });

      const updatedSlot = await tx.parkingSlot.update({
        where: { id: slotId },
        data: { status: "occupied" },
      });

      await tx.payment.create({
        data: {
          reservationId: reservation.id,
          method: "demo",
          amount: totalAmount,
          currency: "IDR",
          status: "paid",
          paidAt: new Date(),
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
      };
    });

    emitSlotUpdated({ ...result.updatedSlot, lotId: slot.lotId });
    emitReservationCreated(result.reservation);

    // Notif personal ke user yang booking
    emitToUser(req.user.id, "notification", {
      type: "booking_confirmed",
      title: "Booking Dikonfirmasi!",
      message: `Slot ${slot.number} berhasil dipesan hingga ${endTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      reservationId: result.reservation.id,
      ts: new Date().toISOString(),
    });

    // Jadwalkan notif "15 menit sebelum habis"
    const msUntil15Before = endTime.getTime() - Date.now() - 15 * 60 * 1000;
    if (msUntil15Before > 0) {
      setTimeout(() => {
        emitToUser(req.user.id, "notification", {
          type: "booking_expiring",
          title: "Booking Hampir Habis!",
          message: `Slot ${slot.number} habis dalam 15 menit. Perpanjang sekarang?`,
          reservationId: result.reservation.id,
          ts: new Date().toISOString(),
        });
      }, msUntil15Before);
    }

    await broadcastSummary();
    res.status(201).json({ reservation: result.reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat reservasi" });
  }
}

// PATCH /api/reservations/:id/cancel
async function cancelReservation(req, res) {
  try {
    const reservation = await reservationRepository.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ error: "Reservasi tidak ditemukan" });
    if (req.user.role === "user" && reservation.userId !== req.user.id)
      return res.status(403).json({ error: "Tidak diizinkan" });
    if (reservation.status !== "active")
      return res.status(400).json({ error: "Reservasi tidak aktif" });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: req.params.id },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
      const updatedSlot = await tx.parkingSlot.update({
        where: { id: reservation.slotId },
        data: { status: "available" },
        include: { lot: { select: { id: true } } },
      });
      return { updated, updatedSlot };
    });

    emitSlotUpdated({
      ...result.updatedSlot,
      lotId: result.updatedSlot.lot?.id || result.updatedSlot.lotId,
    });
    emitReservationCancelled(result.updated);
    await waitlistService.promoteNextForSlot(
      {
        id: reservation.slotId,
        number: reservation.slotNumber,
        status: "available",
      },
      "reservation_cancelled",
    );
    await broadcastSummary();
    res.json({ reservation: result.updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membatalkan reservasi" });
  }
}

// PATCH /api/reservations/:id/extend  ← BARU
async function extendReservation(req, res) {
  try {
    const { extraHours } = req.body;
    if (!extraHours || extraHours < 1 || extraHours > 12)
      return res.status(400).json({ error: "extraHours harus antara 1-12" });

    const reservation = await reservationRepository.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ error: "Reservasi tidak ditemukan" });
    if (req.user.role === "user" && reservation.userId !== req.user.id)
      return res.status(403).json({ error: "Tidak diizinkan" });
    if (reservation.status !== "active")
      return res
        .status(400)
        .json({ error: "Hanya reservasi aktif yang bisa diperpanjang" });

    const slot = await slotRepository.findById(reservation.slotId);
    const newEndTime = new Date(
      new Date(reservation.endTime).getTime() + extraHours * 3600000,
    );
    const pricing = await resolveReservationPricing({
      vehicleType: reservation.vehicleType,
      fallbackPricePerHour: slot.pricePerHour,
    });
    const extraAmount = Number(extraHours) * pricing.pricePerHour;
    const newTotalAmount = reservation.totalAmount + extraAmount;
    const newHours = reservation.hours + Number(extraHours);

    // Cek konflik dengan reservasi lain (exclude reservasi ini sendiri)
    const conflict = await reservationRepository.hasConflict(
      reservation.slotId,
      new Date(reservation.endTime),
      newEndTime,
      reservation.id,
    );
    if (conflict)
      return res
        .status(409)
        .json({ error: "Slot sudah dipesan orang lain setelah waktu ini" });

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: req.params.id },
        data: {
          endTime: newEndTime,
          hours: newHours,
          totalAmount: newTotalAmount,
        },
      });

      // Update payment amount
      await tx.payment.updateMany({
        where: { reservationId: req.params.id },
        data: { amount: newTotalAmount },
      });

      return res;
    });

    // Emit notif extend ke user
    emitToUser(req.user.id, "notification", {
      type: "booking_extended",
      title: "Booking Diperpanjang!",
      message: `Slot ${reservation.slotNumber} diperpanjang ${extraHours} jam hingga ${newEndTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      reservationId: reservation.id,
      ts: new Date().toISOString(),
    });

    // Broadcast ke semua (untuk operator/admin)
    emitReservationExtended({ ...updated, slotNumber: reservation.slotNumber });
    await broadcastSummary();

    res.json({
      reservation: {
        ...updated,
        appliedPricePerHour: pricing.pricePerHour,
        pricingSource: pricing.source,
        tariffName: pricing.tariff?.name || null,
      },
      extraAmount,
      newEndTime,
      appliedPricePerHour: pricing.pricePerHour,
      pricingSource: pricing.source,
      tariffName: pricing.tariff?.name || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperpanjang reservasi" });
  }
}

// GET /api/reservations/:id/qr-token  ← BARU
async function getQRToken(req, res) {
  try {
    const reservation = await reservationRepository.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ error: "Reservasi tidak ditemukan" });
    if (req.user.role === "user" && reservation.userId !== req.user.id)
      return res.status(403).json({ error: "Tidak diizinkan" });

    // Generate JWT khusus untuk QR — expire 24 jam setelah endTime
    const qrPayload = {
      reservationId: reservation.id,
      slotNumber: reservation.slotNumber,
      vehiclePlate: reservation.vehiclePlate,
      userId: reservation.userId,
      endTime: reservation.endTime,
      purpose: "qr_ticket",
    };

    const qrToken = jwt.sign(qrPayload, JWT_SECRET, {
      expiresIn: Math.max(
        Math.floor(
          (new Date(reservation.endTime).getTime() - Date.now() + 86400000) /
            1000,
        ),
        3600,
      ),
    });

    res.json({ qrToken, reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat QR token" });
  }
}

// DELETE /api/reservations/:id
async function deleteFinishedReservation(req, res) {
  try {
    const reservation = await reservationRepository.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ error: "Reservasi tidak ditemukan" });

    const allowedFinishedStatuses = ["completed", "cancelled", "expired"];
    if (!allowedFinishedStatuses.includes(reservation.status)) {
      return res
        .status(400)
        .json({ error: "Hanya transaksi selesai yang bisa dihapus dari daftar" });
    }

    if (req.user.role === "user" && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: "Tidak diizinkan" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { reservationId: reservation.id },
      });

      await tx.reservation.delete({
        where: { id: reservation.id },
      });
    });

    await broadcastSummary();
    res.json({ message: `Transaksi ${reservation.slotNumber} berhasil dihapus dari daftar` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus transaksi selesai" });
  }
}

// DELETE /api/reservations/completed [operator only]
async function deleteCompletedReservations(req, res) {
  try {
    const removableStatuses = ["completed", "cancelled", "expired"];
    const result = await prisma.$transaction(async (tx) => {
      const toDelete = await tx.reservation.findMany({
        where: {
          status: { in: removableStatuses },
        },
        select: { id: true, slotId: true },
      });

      if (toDelete.length === 0) {
        return {
          deletedCount: 0,
          message: "Tidak ada riwayat transaksi selesai yang perlu dihapus",
        };
      }

      await tx.payment.deleteMany({
        where: { reservationId: { in: toDelete.map((r) => r.id) } },
      });

      await tx.reservation.deleteMany({
        where: { id: { in: toDelete.map((r) => r.id) } },
      });

      return {
        deletedCount: toDelete.length,
        message: `${toDelete.length} riwayat transaksi selesai telah dihapus dari daftar`,
      };
    });

    // Broadcast summary update
    await broadcastSummary();

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membersihkan riwayat transaksi" });
  }
}

module.exports = {
  listReservations,
  getReservation,
  createReservation,
  cancelReservation,
  extendReservation,
  getQRToken,
  deleteFinishedReservation,
  deleteCompletedReservations,
};


