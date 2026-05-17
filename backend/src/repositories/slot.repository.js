// src/repositories/slot.repository.js

const prisma = require('../config/prisma');

const slotRepository = {
  async findAll({ lotId, floor, type, status, search } = {}) {
    const where = { isActive: true };
    if (lotId)  where.lotId  = lotId;
    if (floor)  where.floor  = floor.toUpperCase();
    if (type)   where.type   = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { floor: { contains: search, mode: "insensitive" } },
        { lot: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    return prisma.parkingSlot.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      include: {
        lot: { select: { id: true, name: true, address: true } },
        reservations: {
          where: { status: 'active' },
          take: 1,
          select: {
            id: true, vehiclePlate: true,
            startTime: true, endTime: true,
            user: { select: { name: true } },
          },
        },
      },
    });
  },

  async findById(id) {
    return prisma.parkingSlot.findUnique({
      where: { id },
      include: {
        lot: { select: { name: true, address: true } },
      },
    });
  },

  async create(data) {
    return prisma.parkingSlot.create({ data });
  },

  async updateStatus(id, status) {
    return prisma.parkingSlot.update({
      where: { id },
      data: { status },
    });
  },

  async getSummaryByLot(lotId) {
    const [total, available, occupied, maintenance] = await Promise.all([
      prisma.parkingSlot.count({ where: { lotId, isActive: true } }),
      prisma.parkingSlot.count({ where: { lotId, isActive: true, status: 'available' } }),
      prisma.parkingSlot.count({ where: { lotId, isActive: true, status: 'occupied' } }),
      prisma.parkingSlot.count({ where: { lotId, isActive: true, status: 'maintenance' } }),
    ]);
    return { total, available, occupied, maintenance };
  },

  async getSummaryGlobal() {
    const groups = await prisma.parkingSlot.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: { status: true },
    });

    const result = { total: 0, available: 0, occupied: 0, maintenance: 0 };
    for (const g of groups) {
      result[g.status] = g._count.status;
      result.total += g._count.status;
    }

    const floors = await prisma.parkingSlot.findMany({
      where: { isActive: true },
      distinct: ['floor'],
      select: { floor: true },
      orderBy: { floor: 'asc' },
    });

    return { ...result, floors: floors.map((f) => f.floor) };
  },
};

module.exports = slotRepository;

