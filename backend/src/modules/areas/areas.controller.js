const prisma = require('../../config/db');

async function writeAudit(userId, action, entity, entityId, metadata = null, ipAddress = null) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata, ipAddress },
    });
  } catch (error) {
    console.error('Audit log gagal ditulis:', error.message);
  }
}

async function listLots(_req, res) {
  try {
    const lots = await prisma.parkingLot.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: {
        operator: { select: { id: true, name: true, email: true } },
        _count: { select: { slots: true } },
      },
    });

    res.json({ lots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data area parkir' });
  }
}

async function createLot(req, res) {
  try {
    const { name, address, operatorId, totalSlots, latitude, longitude } = req.body;

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({ error: 'Nama dan alamat area parkir wajib diisi' });
    }

    const lot = await prisma.parkingLot.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        operatorId: operatorId || null,
        totalSlots: Number(totalSlots) || 0,
        latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : null,
      },
      include: {
        operator: { select: { id: true, name: true, email: true } },
        _count: { select: { slots: true } },
      },
    });

    await writeAudit(
      req.user.id,
      'create',
      'parking_lot',
      lot.id,
      { name: lot.name, totalSlots: lot.totalSlots },
      req.ip
    );

    res.status(201).json({ lot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menambah area parkir' });
  }
}

async function updateLot(req, res) {
  try {
    const existing = await prisma.parkingLot.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Area parkir tidak ditemukan' });

    const { name, address, operatorId, totalSlots, latitude, longitude, isActive } = req.body;

    const lot = await prisma.parkingLot.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(address !== undefined && { address: address.trim() }),
        ...(operatorId !== undefined && { operatorId: operatorId || null }),
        ...(totalSlots !== undefined && { totalSlots: Number(totalSlots) || 0 }),
        ...(latitude !== undefined && { latitude: latitude === '' ? null : Number(latitude) }),
        ...(longitude !== undefined && { longitude: longitude === '' ? null : Number(longitude) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        operator: { select: { id: true, name: true, email: true } },
        _count: { select: { slots: true } },
      },
    });

    await writeAudit(
      req.user.id,
      'update',
      'parking_lot',
      lot.id,
      { before: existing, after: { name: lot.name, address: lot.address, totalSlots: lot.totalSlots, isActive: lot.isActive } },
      req.ip
    );

    res.json({ lot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memperbarui area parkir' });
  }
}

async function deleteLot(req, res) {
  try {
    const existing = await prisma.parkingLot.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { slots: true } } },
    });

    if (!existing) return res.status(404).json({ error: 'Area parkir tidak ditemukan' });

    const lot = await prisma.parkingLot.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await writeAudit(
      req.user.id,
      'archive',
      'parking_lot',
      lot.id,
      { name: existing.name, slots: existing._count?.slots || 0 },
      req.ip
    );

    res.json({ message: 'Area parkir dinonaktifkan', lot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menonaktifkan area parkir' });
  }
}

module.exports = { listLots, createLot, updateLot, deleteLot };


