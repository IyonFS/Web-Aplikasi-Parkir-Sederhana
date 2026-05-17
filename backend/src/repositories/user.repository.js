// src/repositories/user.repository.js
// Semua query DB untuk User ada di sini

const prisma = require('../config/prisma');

const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true,
        role: true, phone: true, avatarUrl: true,
        isActive: true, lastLoginAt: true, lastLoginDevice: true, createdAt: true,
      },
    });
  },

  async create(data) {
    return prisma.user.create({
      data: { ...data, email: data.email.toLowerCase() },
      select: {
        id: true, name: true, email: true,
        role: true, phone: true, avatarUrl: true,
        isActive: true, lastLoginAt: true, lastLoginDevice: true, createdAt: true,
      },
    });
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true,
        role: true, phone: true, avatarUrl: true,
        isActive: true, lastLoginAt: true, lastLoginDevice: true, createdAt: true, updatedAt: true,
      },
    });
  },

  async findAll({ page = 1, limit = 20, role } = {}) {
    const where = role ? { role } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true,
          role: true, phone: true, isActive: true, createdAt: true,
          _count: { select: { reservations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  },

  async saveRefreshToken(userId, tokenHash, expiresAt) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  async revokeRefreshToken(tokenHash) {
    return prisma.refreshToken.update({
      where: { tokenHash },
      data: { revoked: true },
    });
  },

  async revokeAllUserTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  },
};

module.exports = userRepository;

