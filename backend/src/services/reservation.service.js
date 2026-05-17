const prisma = require("../config/prisma");
const analyticsRepository = require("../repositories/analytics.repository");
const waitlistService = require("./waitlist.service");
const {
  emitSlotUpdated,
  emitReservationCompleted,
  emitSummaryUpdated,
} = require("../socket/socket.server");

async function completeEndedReservations() {
  const now = new Date();
  const endedReservations = await prisma.reservation.findMany({
    where: {
      status: "active",
      endTime: { lt: now },
    },
    include: {
      slot: { select: { id: true, number: true, lotId: true } },
    },
  });

  if (!endedReservations.length) return 0;

  const processedSlotIds = new Set();
  const updatedSlots = [];

  await prisma.$transaction(async (tx) => {
    for (const reservation of endedReservations) {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "completed",
          completedAt: now,
        },
      });

      if (!processedSlotIds.has(reservation.slotId)) {
        processedSlotIds.add(reservation.slotId);

        const updatedSlot = await tx.parkingSlot.update({
          where: { id: reservation.slotId },
          data: { status: "available" },
        });

        updatedSlots.push({
          ...updatedSlot,
          lotId: reservation.slot.lotId,
        });
      }
    }
  });

  for (const reservation of endedReservations) {
    emitReservationCompleted({
      id: reservation.id,
      slotNumber: reservation.slot.number,
      endTime: reservation.endTime,
      status: "completed",
      updatedAt: now.toISOString(),
    });
  }

  for (const slot of updatedSlots) {
    emitSlotUpdated(slot);
    await waitlistService.promoteNextForSlot(
      {
        id: slot.id,
        number: slot.number,
        status: "available",
      },
      "reservation_completed",
    );
  }

  const summary = await analyticsRepository.getSummary();
  emitSummaryUpdated(summary);

  return endedReservations.length;
}

module.exports = {
  completeEndedReservations,
};

