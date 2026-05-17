// controllers/users.controller.js
const bcrypt = require("bcryptjs");
const userRepository = require("../../repositories/user.repository");
const prisma = require("../../config/db");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+62|62|08)[0-9]{8,13}$/;

function normalizePhone(phone) {
  if (phone === undefined) return undefined;

  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("08")) return `+62${cleaned.slice(1)}`;

  return cleaned;
}

// ── GET /api/users/me/profile ──────────────────────────────────────────────
async function getProfile(req, res) {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    // Hitung statistik booking user
    const stats = await prisma.reservation.groupBy({
      by: ["status"],
      where: { userId: req.user.id },
      _count: true,
      _sum: { totalAmount: true },
    });

    const totalBookings = stats.reduce((s, g) => s + g._count, 0);
    const totalSpent = stats.reduce((s, g) => s + (g._sum.totalAmount || 0), 0);
    const activeBookings =
      stats.find((g) => g.status === "active")?._count || 0;

    // Plat nomor yang pernah dipakai
    const plates = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      select: { vehiclePlate: true },
      distinct: ["vehiclePlate"],
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      user,
      stats: { totalBookings, totalSpent, activeBookings },
      savedPlates: plates.map((p) => p.vehiclePlate),
      security: {
        lastLoginAt: user.lastLoginAt,
        lastLoginDevice: user.lastLoginDevice,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil profil" });
  }
}

// ── PATCH /api/users/me/profile ────────────────────────────────────────────
async function updateProfile(req, res) {
  try {
    const { name, email, phone, avatarUrl } = req.body;
    if (name && name.trim().length < 2)
      return res.status(400).json({ error: "Nama minimal 2 karakter" });
    if (email && !EMAIL_REGEX.test(email.trim().toLowerCase()))
      return res.status(400).json({ error: "Email tidak valid" });

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone))
      return res.status(400).json({ error: "Nomor HP tidak valid" });

    if (
      avatarUrl &&
      (!avatarUrl.startsWith("data:image/") || avatarUrl.length > 1_500_000)
    ) {
      return res
        .status(400)
        .json({ error: "Foto profil tidak valid atau terlalu besar" });
    }

    if (email) {
      const existing = await userRepository.findByEmail(email.trim().toLowerCase());
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({ error: "Email sudah digunakan akun lain" });
      }
    }

    const updated = await userRepository.update(req.user.id, {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone !== undefined && { phone: normalizedPhone }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
    });

    res.json({ user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal update profil" });
  }
}

// ── PATCH /api/users/me/password ───────────────────────────────────────────
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ error: "Password lama dan baru wajib diisi" });
    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ error: "Password baru minimal 6 karakter" });
    if (currentPassword === newPassword)
      return res
        .status(400)
        .json({ error: "Password baru harus berbeda dari password lama" });

    // Ambil password hash dari DB
    const userWithPass = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!userWithPass)
      return res.status(404).json({ error: "User tidak ditemukan" });
    const valid = await bcrypt.compare(currentPassword, userWithPass.password);
    if (!valid)
      return res.status(400).json({ error: "Password lama tidak sesuai" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengubah password" });
  }
}

// ── GET /api/users (admin) ─────────────────────────────────────────────────
async function listUsers(req, res) {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    // Search by name/email
    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { reservations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data user" });
  }
}

// ── GET /api/users/:id (admin) ─────────────────────────────────────────────
async function getUser(req, res) {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    // Booking history user
    const recentReservations = await prisma.reservation.findMany({
      where: { userId: req.params.id },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { slot: { select: { number: true, floor: true } } },
    });

    const stats = await prisma.reservation.groupBy({
      by: ["status"],
      where: { userId: req.params.id },
      _count: true,
      _sum: { totalAmount: true },
    });

    res.json({ user, recentReservations, stats });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data user" });
  }
}

// ── POST /api/users (admin) ────────────────────────────────────────────────
async function createUser(req, res) {
  try {
    const { name, email, role, phone, password } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ error: "Nama user minimal 2 karakter" });
    if (!email || !email.includes("@"))
      return res.status(400).json({ error: "Email tidak valid" });
    if (!password || password.length < 6)
      return res.status(400).json({ error: "Password minimal 6 karakter" });
    if (!["user", "operator", "admin"].includes(role))
      return res.status(400).json({ error: "Role tidak valid" });

    const existing = await userRepository.findByEmail(email);
    if (existing)
      return res.status(400).json({ error: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      name: name.trim(),
      email: email.toLowerCase(),
      role,
      phone: phone || null,
      password: hashed,
      isActive: true,
    });

    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal membuat user baru" });
  }
}

// ── PATCH /api/users/:id (admin) ───────────────────────────────────────────
async function updateUser(req, res) {
  try {
    const { name, phone } = req.body;
    const updated = await userRepository.update(req.params.id, {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal update user" });
  }
}

// ── PATCH /api/users/:id/toggle-active (admin) ────────────────────────────
async function toggleActive(req, res) {
  try {
    if (req.params.id === req.user.id)
      return res
        .status(400)
        .json({ error: "Tidak bisa menonaktifkan akun sendiri" });

    const user = await userRepository.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    const updated = await userRepository.update(req.params.id, {
      isActive: !user.isActive,
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal update status user" });
  }
}

// ── PATCH /api/users/:id/role (admin) ─────────────────────────────────────
async function updateRole(req, res) {
  try {
    const { role } = req.body;
    if (!["user", "operator", "admin"].includes(role))
      return res.status(400).json({ error: "Role tidak valid" });
    if (req.params.id === req.user.id)
      return res
        .status(400)
        .json({ error: "Tidak bisa mengubah role sendiri" });

    const updated = await userRepository.update(req.params.id, { role });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal update role user" });
  }
}

// ── DELETE /api/users/:id (admin) ─────────────────────────────────────────
async function deleteUser(req, res) {
  try {
    if (req.params.id === req.user.id)
      return res
        .status(400)
        .json({ error: "Tidak bisa menghapus akun sendiri" });
    await userRepository.delete(req.params.id);
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus user" });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleActive,
  updateRole,
  deleteUser,
  getProfile,
  updateProfile,
  changePassword,
};


