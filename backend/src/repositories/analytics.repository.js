// src/repositories/analytics.repository.js

const prisma = require("../config/prisma");

const analyticsRepository = {
  async getSummary() {
    // Run all queries in parallel
    const [
      slotGroups,
      totalUsers,
      activeReservations,
      totalReservations,
      cancelledReservations,
      revenueResult,
      recentActivity,
      floorStats,
    ] = await Promise.all([
      // Slot counts grouped by status
      prisma.parkingSlot.groupBy({
        by: ["status"],
        where: { isActive: true },
        _count: { status: true },
      }),

      // Total non-admin/non-operator users
      prisma.user.count({ where: { role: "user" } }),

      // Active bookings
      prisma.reservation.count({ where: { status: "active" } }),

      // Total bookings ever
      prisma.reservation.count(),

      // Cancelled
      prisma.reservation.count({ where: { status: "cancelled" } }),

      // Revenue: sum of payments paid
      prisma.payment.aggregate({
        where: {
          status: "paid",
          reservation: { status: { in: ["active", "completed"] } },
        },
        _sum: { amount: true },
      }),

      // Recent 8 reservations
      prisma.reservation.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          slot: { select: { number: true, floor: true } },
        },
      }),

      // Slot counts per floor
      prisma.parkingSlot.groupBy({
        by: ["floor", "status"],
        where: { isActive: true },
        _count: { status: true },
        orderBy: { floor: "asc" },
      }),
    ]);

    // Shape slot summary
    const slotSummary = { total: 0, available: 0, occupied: 0, maintenance: 0 };
    for (const g of slotGroups) {
      slotSummary[g.status] = g._count.status;
      slotSummary.total += g._count.status;
    }
    slotSummary.occupancyRate =
      slotSummary.total > 0
        ? Math.round((slotSummary.occupied / slotSummary.total) * 100)
        : 0;

    // Shape per-floor stats
    const byFloor = {};
    for (const row of floorStats) {
      if (!byFloor[row.floor]) byFloor[row.floor] = { total: 0, occupied: 0 };
      byFloor[row.floor].total += row._count.status;
      if (row.status === "occupied")
        byFloor[row.floor].occupied += row._count.status;
    }

    return {
      slots: slotSummary,
      reservations: {
        active: activeReservations,
        total: totalReservations,
        cancelled: cancelledReservations,
      },
      revenue: { total: revenueResult._sum.amount || 0 },
      users: { total: totalUsers },
      byFloor,
      recentActivity,
    };
  },

  async getRevenueByDay(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: { status: "paid", paidAt: { gte: since } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    });

    // Group by date string
    const map = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    for (const p of payments) {
      const key = new Date(p.paidAt).toISOString().slice(0, 10);
      if (map[key] !== undefined) map[key] += p.amount;
    }

    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  },

  async getRevenueByRange(start, end) {
    const startAt = new Date(start);
    startAt.setHours(0, 0, 0, 0);
    const endAt = new Date(end);
    endAt.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: { status: "paid", paidAt: { gte: startAt, lte: endAt } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    });

    const dayCount = Math.round((endAt - startAt) / 86400000) + 1;
    const map = {};
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(startAt);
      d.setDate(startAt.getDate() + i);
      map[d.toISOString().slice(0, 10)] = 0;
    }

    for (const p of payments) {
      const key = new Date(p.paidAt).toISOString().slice(0, 10);
      if (map[key] !== undefined) map[key] += p.amount;
    }

    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  },

  async getOccupancyByHour(period = {}) {
    const { start, end } = period;
    const timeFilter = {
      ...(start && { gte: start }),
      ...(end && { lte: end }),
    };

    const where = {
      status: { in: ["active", "completed"] },
      ...(Object.keys(timeFilter).length
        ? { startTime: timeFilter }
        : { startTime: { gte: new Date(Date.now() - 7 * 86400000) } }),
    };

    const reservations = await prisma.reservation.findMany({
      where,
      select: { startTime: true },
    });

    const hourMap = Array(24).fill(0);
    for (const r of reservations) {
      const hour = new Date(r.startTime).getHours();
      hourMap[hour]++;
    }
    return hourMap.map((count, hour) => ({ hour, count }));
  },
};

module.exports = analyticsRepository;

