const prisma = require("../config/db");

async function getActiveTariff(vehicleType) {
  if (!vehicleType) return null;

  return prisma.parkingTariff.findFirst({
    where: {
      vehicleType,
      isActive: true,
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
  });
}

async function resolveReservationPricing({ vehicleType, fallbackPricePerHour = 0 }) {
  const activeTariff = await getActiveTariff(vehicleType);
  const pricePerHour = Number(
    activeTariff?.pricePerHour ?? fallbackPricePerHour ?? 0,
  );

  return {
    tariff: activeTariff,
    pricePerHour,
    source: activeTariff ? "tariff" : "slot",
  };
}

module.exports = {
  getActiveTariff,
  resolveReservationPricing,
};
