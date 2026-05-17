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

async function listVehicles(_req, res) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    res.json({ vehicles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data kendaraan' });
  }
}

async function createVehicle(req, res) {
  try {
    const { ownerId, plateNumber, vehicleType, brand, color, isActive } = req.body;
    if (!plateNumber?.trim()) return res.status(400).json({ error: 'Nomor plat wajib diisi' });

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: ownerId || null,
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType,
        brand: brand?.trim() || null,
        color: color?.trim() || null,
        isActive: isActive !== false,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await writeAudit(req.user.id, 'create', 'vehicle', vehicle.id, { plateNumber: vehicle.plateNumber, vehicleType: vehicle.vehicleType }, req.ip);

    res.status(201).json({ vehicle });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nomor plat sudah terdaftar' });
    }
    res.status(500).json({ error: 'Gagal menambah kendaraan' });
  }
}

async function updateVehicle(req, res) {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });

    const { ownerId, plateNumber, vehicleType, brand, color, isActive } = req.body;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        ...(ownerId !== undefined && { ownerId: ownerId || null }),
        ...(plateNumber !== undefined && { plateNumber: plateNumber.trim().toUpperCase() }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(brand !== undefined && { brand: brand?.trim() || null }),
        ...(color !== undefined && { color: color?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await writeAudit(req.user.id, 'update', 'vehicle', vehicle.id, { before: existing, after: vehicle }, req.ip);

    res.json({ vehicle });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nomor plat sudah terdaftar' });
    }
    res.status(500).json({ error: 'Gagal memperbarui kendaraan' });
  }
}

async function deleteVehicle(req, res) {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await writeAudit(req.user.id, 'archive', 'vehicle', vehicle.id, { plateNumber: existing.plateNumber }, req.ip);

    res.json({ message: 'Kendaraan dinonaktifkan', vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menonaktifkan kendaraan' });
  }
}

module.exports = { listVehicles, createVehicle, updateVehicle, deleteVehicle };


