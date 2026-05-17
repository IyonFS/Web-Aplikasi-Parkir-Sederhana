const prisma = require("../config/prisma");
const { emitToUser, emitRecurringRun } = require("../socket/socket.server");
const waitlistService = require("./waitlist.service");
const reservationService = require("./reservation.service");
const { resolveReservationPricing } = require("./tariff-pricing.service");

let recurringInterval = null;
let waitlistExpiryInterval = null;
let reservationCompletionInterval = null;

function computeNextRunAt({
  recurrence,
  weekdays = [],
  startHour,
  startMinute = 0,
  from = new Date(),
}) {
  const base = new Date(from);
  base.setSeconds(0, 0);

  const next = new Date(base);
  next.setHours(startHour, startMinute, 0, 0);

  if (recurrence === "daily") {
    if (next <= base) next.setDate(next.getDate() + 1);
    return next;
  }

  const allowed = weekdays.length ? weekdays : [1];
  for (let i = 0; i < 14; i += 1) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + i);
    candidate.setHours(startHour, startMinute, 0, 0);
    if (!allowed.includes(candidate.getDay())) continue;
    if (candidate > base) return candidate;
  }

  next.setDate(next.getDate() + 7);
  return next;
}

async function processOneRecurringBooking(rb) {
  const slot = await prisma.parkingSlot.findUnique({
    where: { id: rb.slotId },
  });
  if (!slot || !slot.isActive) {
    const nextRunAt = computeNextRunAt({
      recurrence: rb.recurrence,
      weekdays: rb.weekdays,
      startHour: rb.startHour,
      startMinute: rb.startMinute,
      from: new Date(),
    });

    await prisma.recurringBooking.update({
      where: { id: rb.id },
      data: { nextRunAt, lastRunAt: new Date() },
    });
    return;
  }

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + rb.durationHours * 3600000);

  let createdReservationId = null;
  let status = "skipped_conflict";

  const conflict = await prisma.reservation.count({
    where: {
      slotId: rb.slotId,
      status: { in: ["active", "pending_payment"] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  if (slot.status === "available" && conflict === 0) {
    const pricing = await resolveReservationPricing({
      vehicleType: "car",
      fallbackPricePerHour: slot.pricePerHour,
    });
    const totalAmount = rb.durationHours * pricing.pricePerHour;

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          userId: rb.userId,
          slotId: rb.slotId,
          slotNumber: slot.number,
          vehiclePlate: rb.vehiclePlate,
          vehicleType: "car",
          startTime,
          endTime,
          hours: rb.durationHours,
          totalAmount,
          status: "active",
        },
      });

      await tx.parkingSlot.update({
        where: { id: slot.id },
        data: { status: "occupied" },
      });

      await tx.payment.create({
        data: {
          reservationId: reservation.id,
          method: "recurring",
          amount: totalAmount,
          currency: "IDR",
          status: "paid",
          paidAt: new Date(),
        },
      });

      return reservation;
    });

    createdReservationId = result.id;
    status = "reserved";

    emitToUser(rb.userId, "notification", {
      type: "recurring_success",
      title: "Recurring Booking Berhasil",
      message: `Slot ${slot.number} otomatis dipesan untuk jadwal rutin Anda.`,
      reservationId: result.id,
      recurringBookingId: rb.id,
      ts: new Date().toISOString(),
    });
  } else if (rb.autoJoinWaitlist) {
    await waitlistService.joinWaitlist({
      userId: rb.userId,
      slotId: rb.slotId,
      vehiclePlate: rb.vehiclePlate,
      hours: rb.durationHours,
    });
    status = "queued";

    emitToUser(rb.userId, "notification", {
      type: "recurring_queued",
      title: "Recurring Masuk Waitlist",
      message: `Jadwal rutin untuk slot ${slot.number} masuk antrian karena slot belum tersedia.`,
      recurringBookingId: rb.id,
      slotId: slot.id,
      ts: new Date().toISOString(),
    });
  }

  const nextRunAt = computeNextRunAt({
    recurrence: rb.recurrence,
    weekdays: rb.weekdays,
    startHour: rb.startHour,
    startMinute: rb.startMinute,
    from: new Date(),
  });

  await prisma.recurringBooking.update({
    where: { id: rb.id },
    data: { nextRunAt, lastRunAt: new Date() },
  });

  emitRecurringRun({
    recurringBookingId: rb.id,
    slotId: rb.slotId,
    status,
    reservationId: createdReservationId,
    nextRunAt,
  });
}

async function processDueRecurringBookings() {
  const due = await prisma.recurringBooking.findMany({
    where: { isActive: true, nextRunAt: { lte: new Date() } },
    orderBy: { nextRunAt: "asc" },
    take: 20,
  });

  for (const rb of due) {
    // eslint-disable-next-line no-await-in-loop
    await processOneRecurringBooking(rb);
  }
}

function startSchedulers() {
  if (!recurringInterval) {
    recurringInterval = setInterval(() => {
      processDueRecurringBookings().catch((err) => {
        console.error("Recurring scheduler error:", err.message);
      });
    }, 60 * 1000);
  }

  if (!waitlistExpiryInterval) {
    waitlistExpiryInterval = setInterval(() => {
      waitlistService.expireOverdueNotifications().catch((err) => {
        console.error("Waitlist expiry scheduler error:", err.message);
      });
    }, 30 * 1000);
  }

  if (!reservationCompletionInterval) {
    reservationCompletionInterval = setInterval(() => {
      reservationService.completeEndedReservations().catch((err) => {
        console.error("Reservation completion scheduler error:", err.message);
      });
    }, 60 * 1000);
  }

  reservationService.completeEndedReservations().catch((err) => {
    console.error("Reservation completion startup error:", err.message);
  });
}

module.exports = {
  startSchedulers,
  computeNextRunAt,
  processDueRecurringBookings,
};

