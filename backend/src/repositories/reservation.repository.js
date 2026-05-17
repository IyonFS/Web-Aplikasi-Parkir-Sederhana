// src/repositories/reservation.repository.js

const prisma = require('../config/prisma');

const reservationRepository = {
  async findAll({ userId, role, page = 1, limit = 20 } = {}) {
    const where = role === 'user' ? { userId } : {};

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          slot: { select: { number: true, floor: true, type: true, lot: { select: { name: true } } } },
          payment: true,
        },
      }),
      prisma.reservation.count({ where }),
    ]);

    return { reservations, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id) {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        slot: { include: { lot: true } },
        payment: true,
      },
    });
  },

  async create(data) {
    return prisma.reservation.create({
      data,
      include: {
        slot: { select: { number: true, floor: true, type: true } },
      },
    });
  },

  async updateStatus(id, status, extra = {}) {
    return prisma.reservation.update({
      where: { id },
      data: { status, ...extra },
    });
  },

  // Conflict check: slot already has active reservation overlapping the time range
  async hasConflict(slotId, startTime, endTime, excludeId = null) {
    const where = {
      slotId,
      status: { in: ['active', 'pending_payment'] },
      AND: [
        { startTime: { lt: endTime } },
        { endTime:   { gt: startTime } },
      ],
    };
    if (excludeId) where.id = { not: excludeId };
    const count = await prisma.reservation.count({ where });
    return count > 0;
  },

  async getRecentActivity(limit = 8) {
    return prisma.reservation.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        slot: { select: { number: true, floor: true } },
      },
    });
  },

  // Mark expired reservations (endTime < now, still active)
  async expireOldReservations() {
    const result = await prisma.reservation.updateMany({
      where: {
        status: 'active',
        endTime: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
    return result.count;
  },
};

module.exports = reservationRepository;

