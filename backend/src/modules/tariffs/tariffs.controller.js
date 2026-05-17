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

async function listTariffs(_req, res) {
  try {
    const tariffs = await prisma.parkingTariff.findMany({
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ tariffs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil data tarif parkir' });
  }
}

async function createTariff(req, res) {
  try {
    const { name, vehicleType, pricePerHour, description, isActive } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nama tarif wajib diisi' });
    if (Number(pricePerHour) <= 0) return res.status(400).json({ error: 'Tarif per jam harus lebih dari 0' });

    const tariff = await prisma.parkingTariff.create({
      data: {
        name: name.trim(),
        vehicleType,
        pricePerHour: Number(pricePerHour),
        description: description?.trim() || null,
        isActive: isActive !== false,
      },
    });

    await writeAudit(req.user.id, 'create', 'parking_tariff', tariff.id, { name: tariff.name, vehicleType: tariff.vehicleType }, req.ip);

    res.status(201).json({ tariff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menambah tarif parkir' });
  }
}

async function updateTariff(req, res) {
  try {
    const existing = await prisma.parkingTariff.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Tarif parkir tidak ditemukan' });

    const { name, vehicleType, pricePerHour, description, isActive } = req.body;
    const tariff = await prisma.parkingTariff.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(pricePerHour !== undefined && { pricePerHour: Number(pricePerHour) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await writeAudit(req.user.id, 'update', 'parking_tariff', tariff.id, { before: existing, after: tariff }, req.ip);

    res.json({ tariff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memperbarui tarif parkir' });
  }
}

async function deleteTariff(req, res) {
  try {
    const existing = await prisma.parkingTariff.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Tarif parkir tidak ditemukan' });

    const tariff = await prisma.parkingTariff.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await writeAudit(req.user.id, 'archive', 'parking_tariff', tariff.id, { name: existing.name }, req.ip);

    res.json({ message: 'Tarif parkir dinonaktifkan', tariff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menonaktifkan tarif parkir' });
  }
}

module.exports = { listTariffs, createTariff, updateTariff, deleteTariff };


