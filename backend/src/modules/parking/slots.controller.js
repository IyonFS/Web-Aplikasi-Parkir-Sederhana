const slotRepository = require("../../repositories/slot.repository");
const prisma = require("../../config/db");
const { emitSlotUpdated } = require("../../socket/socket.server");
const waitlistService = require("../../services/waitlist.service");

// GET /api/slots
async function listSlots(req, res) {
  try {
    const { floor, type, status, lotId, search } = req.query;
    const slots = await slotRepository.findAll({ floor, type, status, lotId, search });
    const summary = await slotRepository.getSummaryGlobal();
    res.json({ slots, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data slot" });
  }
}

// GET /api/slots/:id
async function getSlot(req, res) {
  try {
    const slot = await slotRepository.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: "Slot tidak ditemukan" });
    res.json({ slot });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data slot" });
  }
}

// POST /api/slots [admin only]
async function createSlot(req, res) {
  try {
    const { number, floor, type, pricePerHour, lotId } = req.body;

    if (!number || !floor || !type || !pricePerHour || !lotId) {
      return res
        .status(400)
        .json({
          error: "number, floor, type, pricePerHour, dan lotId wajib diisi",
        });
    }

    if (!["standard", "ev", "disabled"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Tipe slot tidak valid (standard/ev/disabled)" });
    }

    if (pricePerHour < 0) {
      return res
        .status(400)
        .json({ error: "Harga per jam tidak boleh negatif" });
    }

    // Check if slot number already exists in this lot
    const existing = await prisma.parkingSlot.findFirst({
      where: { number: String(number), lotId },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: `Slot nomor ${number} sudah ada di area ini` });
    }

    const slot = await prisma.parkingSlot.create({
      data: {
        number: String(number),
        floor: String(floor),
        type,
        pricePerHour: Number(pricePerHour),
        status: "available",
        isActive: true,
        lotId,
      },
    });

    res.status(201).json({ slot, message: "Slot berhasil dibuat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat slot" });
  }
}

// PATCH /api/slots/:id [admin only]
async function updateSlot(req, res) {
  try {
    const { number, floor, type, pricePerHour, status, isActive } = req.body;

    if (type && !["standard", "ev", "disabled"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Tipe slot tidak valid (standard/ev/disabled)" });
    }

    if (status && !["available", "occupied", "maintenance"].includes(status)) {
      return res.status(400).json({ error: "Status slot tidak valid" });
    }

    if (pricePerHour !== undefined && pricePerHour < 0) {
      return res
        .status(400)
        .json({ error: "Harga per jam tidak boleh negatif" });
    }

    const slot = await prisma.parkingSlot.findUnique({
      where: { id: req.params.id },
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot tidak ditemukan" });
    }

    const updated = await prisma.parkingSlot.update({
      where: { id: req.params.id },
      data: {
        ...(number && { number: String(number) }),
        ...(floor && { floor: String(floor) }),
        ...(type && { type }),
        ...(pricePerHour !== undefined && {
          pricePerHour: Number(pricePerHour),
        }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    emitSlotUpdated({ ...updated, lotId: slot.lotId });

    res.json({ slot: updated, message: "Slot berhasil diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memperbarui slot" });
  }
}

// DELETE /api/slots/:id [admin only]
async function deleteSlot(req, res) {
  try {
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: req.params.id },
    });

    if (!slot) {
      return res.status(404).json({ error: "Slot tidak ditemukan" });
    }

    // Check if slot has active reservations
    const activeReservations = await prisma.reservation.count({
      where: {
        slotId: req.params.id,
        status: { in: ["active", "pending"] },
      },
    });

    if (activeReservations > 0) {
      return res
        .status(409)
        .json({
          error: "Tidak bisa menghapus slot yang memiliki reservasi aktif",
        });
    }

    await prisma.parkingSlot.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Slot berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menghapus slot" });
  }
}

// PATCH /api/slots/:id/status  [operator/admin]
async function updateSlotStatus(req, res) {
  try {
    const { status } = req.body;
    if (!["available", "occupied", "maintenance"].includes(status))
      return res.status(400).json({ error: "Status tidak valid" });

    const slot = await slotRepository.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: "Slot tidak ditemukan" });

    const updated = await slotRepository.updateStatus(req.params.id, status);

    // ── Emit WebSocket ───────────────────────────────────────────────────
    emitSlotUpdated({
      ...updated,
      lotId: slot.lotId,
    });

    if (status === "available") {
      await waitlistService.promoteNextForSlot(
        { id: slot.id, number: slot.number, status: "available" },
        "manual_slot_available",
      );
    }

    res.json({ slot: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal update status slot" });
  }
}

module.exports = {
  listSlots,
  getSlot,
  createSlot,
  updateSlot,
  deleteSlot,
  updateSlotStatus,
};


