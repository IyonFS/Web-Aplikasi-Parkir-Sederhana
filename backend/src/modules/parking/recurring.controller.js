const prisma = require('../../config/db');
const slotRepository = require('../../repositories/slot.repository');
const recurringService = require('../../services/recurring.service');

function normalizeWeekdays(weekdays) {
  if (!Array.isArray(weekdays)) return [];
  return weekdays
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

async function listRecurring(req, res) {
  try {
    const where = req.user.role === 'user' ? { userId: req.user.id } : {};
    const schedules = await prisma.recurringBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        slot: { select: { id: true, number: true, floor: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil recurring booking' });
  }
}

async function createRecurring(req, res) {
  try {
    const {
      slotId,
      vehiclePlate,
      durationHours = 2,
      recurrence = 'daily',
      weekdays = [],
      startHour = 8,
      startMinute = 0,
      autoJoinWaitlist = true,
    } = req.body;

    if (!slotId || !vehiclePlate) {
      return res.status(400).json({ error: 'slotId dan vehiclePlate wajib diisi' });
    }
    if (durationHours < 1 || durationHours > 24) {
      return res.status(400).json({ error: 'durationHours harus 1-24 jam' });
    }
    if (!['daily', 'weekly'].includes(recurrence)) {
      return res.status(400).json({ error: 'recurrence harus daily atau weekly' });
    }
    if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59) {
      return res.status(400).json({ error: 'startHour/startMinute tidak valid' });
    }

    const slot = await slotRepository.findById(slotId);
    if (!slot) return res.status(404).json({ error: 'Slot tidak ditemukan' });

    const normalizedWeekdays = normalizeWeekdays(weekdays);
    if (recurrence === 'weekly' && normalizedWeekdays.length === 0) {
      return res.status(400).json({ error: 'Weekly recurrence butuh minimal 1 weekdays (0-6)' });
    }

    const nextRunAt = recurringService.computeNextRunAt({
      recurrence,
      weekdays: normalizedWeekdays,
      startHour: Number(startHour),
      startMinute: Number(startMinute),
      from: new Date(),
    });

    const schedule = await prisma.recurringBooking.create({
      data: {
        userId: req.user.id,
        slotId,
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        durationHours: Number(durationHours),
        recurrence,
        weekdays: normalizedWeekdays,
        startHour: Number(startHour),
        startMinute: Number(startMinute),
        autoJoinWaitlist: Boolean(autoJoinWaitlist),
        nextRunAt,
      },
      include: {
        slot: { select: { id: true, number: true, floor: true, status: true } },
      },
    });

    res.status(201).json({ schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat recurring booking' });
  }
}

async function toggleRecurring(req, res) {
  try {
    const existing = await prisma.recurringBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Recurring booking tidak ditemukan' });
    if (req.user.role === 'user' && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Tidak diizinkan' });
    }

    const schedule = await prisma.recurringBooking.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    res.json({ schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengubah status recurring booking' });
  }
}

async function deleteRecurring(req, res) {
  try {
    const existing = await prisma.recurringBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Recurring booking tidak ditemukan' });
    if (req.user.role === 'user' && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Tidak diizinkan' });
    }

    await prisma.recurringBooking.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus recurring booking' });
  }
}

async function runRecurringNow(_req, res) {
  try {
    await recurringService.processDueRecurringBookings();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menjalankan recurring scheduler' });
  }
}

module.exports = {
  listRecurring,
  createRecurring,
  toggleRecurring,
  deleteRecurring,
  runRecurringNow,
};


