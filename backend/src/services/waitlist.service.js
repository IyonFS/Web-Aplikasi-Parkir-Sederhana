const prisma = require('../config/prisma');
const { emitToUser, emitWaitlistUpdated } = require('../socket/socket.server');

const CONFIRM_WINDOW_MINUTES = 5;

function withDeadline(now = new Date()) {
  return new Date(now.getTime() + CONFIRM_WINDOW_MINUTES * 60 * 1000);
}

async function listWaitlist({ userId, role, slotId }) {
  const where = {};
  if (role === 'user') where.userId = userId;
  if (slotId) where.slotId = slotId;

  const entries = await prisma.waitlistEntry.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }],
    include: {
      slot: { select: { id: true, number: true, floor: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return entries.map((entry) => {
    const ahead = entries.filter(
      (x) =>
        x.slotId === entry.slotId &&
        x.status === 'waiting' &&
        x.createdAt < entry.createdAt
    ).length;

    return { ...entry, queuePosition: entry.status === 'waiting' ? ahead + 1 : null };
  });
}

async function joinWaitlist({ userId, slotId, vehiclePlate, hours = 2 }) {
  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      userId,
      slotId,
      status: { in: ['waiting', 'notified'] },
    },
  });

  if (existing) {
    return { entry: existing, created: false };
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      userId,
      slotId,
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      hours: Number(hours),
      status: 'waiting',
    },
    include: {
      slot: { select: { id: true, number: true, floor: true, status: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  emitWaitlistUpdated({ slotId, type: 'joined', entryId: entry.id });
  return { entry, created: true };
}

async function cancelWaitlist({ entryId, userId, role }) {
  const entry = await prisma.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry) return null;
  if (role === 'user' && entry.userId !== userId) return 'forbidden';
  if (!['waiting', 'notified'].includes(entry.status)) return entry;

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: { status: 'cancelled' },
  });

  emitWaitlistUpdated({ slotId: updated.slotId, type: 'cancelled', entryId: updated.id });
  return updated;
}

async function promoteNextForSlot(slot, trigger = 'slot_available') {
  const next = await prisma.waitlistEntry.findFirst({
    where: { slotId: slot.id, status: 'waiting' },
    orderBy: { createdAt: 'asc' },
  });

  if (!next) return null;

  const now = new Date();
  const updated = await prisma.waitlistEntry.update({
    where: { id: next.id },
    data: {
      status: 'notified',
      notifiedAt: now,
      confirmDeadlineAt: withDeadline(now),
    },
  });

  emitToUser(next.userId, 'notification', {
    type: 'queue_slot_ready',
    title: 'Slot Tersedia dari Antrian',
    message: `Slot ${slot.number} sudah tersedia. Konfirmasi dalam ${CONFIRM_WINDOW_MINUTES} menit.`,
    waitlistEntryId: next.id,
    slotId: slot.id,
    ts: now.toISOString(),
  });

  emitWaitlistUpdated({ slotId: slot.id, type: trigger, entryId: next.id, status: 'notified' });
  return updated;
}

async function expireOverdueNotifications() {
  const now = new Date();

  const overdue = await prisma.waitlistEntry.findMany({
    where: {
      status: 'notified',
      confirmDeadlineAt: { lt: now },
    },
    include: {
      slot: { select: { id: true, number: true, status: true } },
    },
    take: 50,
  });

  if (!overdue.length) return 0;

  for (const entry of overdue) {
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: 'expired' },
    });

    emitToUser(entry.userId, 'notification', {
      type: 'queue_expired',
      title: 'Waktu Konfirmasi Habis',
      message: `Jendela konfirmasi slot ${entry.slot.number} sudah berakhir.`,
      waitlistEntryId: entry.id,
      ts: now.toISOString(),
    });

    if (entry.slot.status === 'available') {
      await promoteNextForSlot(entry.slot, 'expired_promote_next');
    }
  }

  return overdue.length;
}

module.exports = {
  CONFIRM_WINDOW_MINUTES,
  listWaitlist,
  joinWaitlist,
  cancelWaitlist,
  promoteNextForSlot,
  expireOverdueNotifications,
};

