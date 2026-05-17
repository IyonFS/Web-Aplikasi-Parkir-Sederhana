// prisma/seed.js
// Run: node prisma/seed.js  OR  npm run db:seed

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Clean existing data (order matters for FK) ───────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.parkingTariff.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.recurringBooking.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.parkingSlot.deleteMany();
  await prisma.parkingLot.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ── 2. Users ────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@hygiopark.io',
      password,
      role: 'admin',
      phone: '+62-811-0000-001',
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'Nyoman Ayu',
      email: 'operator@hygiopark.io',
      password,
      role: 'operator',
      phone: '+62-811-0000-002',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Yuharam',
      email: 'user@hygiopark.io',
      password,
      role: 'user',
      phone: '+62-811-0000-003',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Siti Rahayu',
      email: 'siti@hygiopark.io',
      password,
      role: 'user',
      phone: '+62-811-0000-004',
    },
  });

  console.log(`  ✓ Created ${4} users`);

  // ── 3. Parking Lot ──────────────────────────────────────────────────────
  const lot = await prisma.parkingLot.create({
    data: {
      operatorId: operator.id,
      name: 'Hygiopark Gedung Utama',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
      latitude: -6.2088,
      longitude: 106.8456,
      totalSlots: 24,
      isActive: true,
    },
  });

  const lot2 = await prisma.parkingLot.create({
    data: {
      operatorId: admin.id,
      name: 'Hygiopark Mall Selatan',
      address: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
      latitude: -6.2297,
      longitude: 106.8295,
      totalSlots: 16,
      isActive: true,
    },
  });

  console.log(`  ✓ Created ${2} parking lots`);

  // ── 4. Parking Slots ────────────────────────────────────────────────────
  const floors = ['A', 'B', 'C'];
  const slotConfigs = [
    { type: 'standard', price: 5000 },
    { type: 'standard', price: 5000 },
    { type: 'standard', price: 5000 },
    { type: 'standard', price: 5000 },
    { type: 'standard', price: 5000 },
    { type: 'standard', price: 5000 },
    { type: 'ev',       price: 8000 },
    { type: 'disabled', price: 3000 },
  ];

  const slots = [];
  for (const floor of floors) {
    for (let i = 0; i < slotConfigs.length; i++) {
      const cfg = slotConfigs[i];
      const slot = await prisma.parkingSlot.create({
        data: {
          lotId: lot.id,
          number: `${floor}${String(i + 1).padStart(2, '0')}`,
          floor,
          type: cfg.type,
          status: Math.random() > 0.4 ? 'available' : 'occupied',
          pricePerHour: cfg.price,
        },
      });
      slots.push(slot);
    }
  }

  // Slots for lot 2
  const slots2 = [];
  for (const floor of ['P1', 'P2']) {
    for (let i = 1; i <= 8; i++) {
      const slot = await prisma.parkingSlot.create({
        data: {
          lotId: lot2.id,
          number: `${floor}-${String(i).padStart(2, '0')}`,
          floor,
          type: i === 8 ? 'ev' : 'standard',
          status: Math.random() > 0.5 ? 'available' : 'occupied',
          pricePerHour: i === 8 ? 10000 : 6000,
        },
      });
      slots2.push(slot);
    }
  }

  console.log(`  ✓ Created ${slots.length + slots2.length} parking slots`);

  // ── 5. Reservations ─────────────────────────────────────────────────────
  const occupiedSlots = slots.filter((s) => s.status === 'occupied').slice(0, 4);
  let reservationCount = 0;

  for (let i = 0; i < occupiedSlots.length; i++) {
    const slot = occupiedSlots[i];
    const userRef = i % 2 === 0 ? user : user2;
    const hoursAgo = i * 1.5;
    const start = new Date(Date.now() - hoursAgo * 3600000);
    const hours = 2 + i;
    const end = new Date(start.getTime() + hours * 3600000);
    const amount = hours * slot.pricePerHour;

    const res = await prisma.reservation.create({
      data: {
        userId: userRef.id,
        slotId: slot.id,
        slotNumber: slot.number,
        vehiclePlate: `B ${1234 + i * 111} XYZ`,
        startTime: start,
        endTime: end,
        hours,
        totalAmount: amount,
        status: 'active',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        reservationId: res.id,
        method: 'demo',
        amount,
        currency: 'IDR',
        status: 'paid',
        paidAt: start,
      },
    });

    reservationCount++;
  }

  // Add some completed/cancelled reservations for history
  const availableSlots = slots.filter((s) => s.status === 'available').slice(0, 3);
  for (let i = 0; i < availableSlots.length; i++) {
    const slot = availableSlots[i];
    const daysAgo = i + 1;
    const start = new Date(Date.now() - daysAgo * 86400000);
    const hours = 3;
    const end = new Date(start.getTime() + hours * 3600000);
    const amount = hours * slot.pricePerHour;
    const statusArr = ['completed', 'completed', 'cancelled'];

    const res = await prisma.reservation.create({
      data: {
        userId: user.id,
        slotId: slot.id,
        slotNumber: slot.number,
        vehiclePlate: 'B 9876 ABC',
        startTime: start,
        endTime: end,
        hours,
        totalAmount: amount,
        status: statusArr[i],
        completedAt: statusArr[i] === 'completed' ? end : null,
        cancelledAt: statusArr[i] === 'cancelled' ? new Date(start.getTime() + 1800000) : null,
      },
    });

    if (statusArr[i] !== 'cancelled') {
      await prisma.payment.create({
        data: {
          reservationId: res.id,
          method: 'demo',
          amount,
          currency: 'IDR',
          status: 'paid',
          paidAt: start,
        },
      });
    }

    reservationCount++;
  }

  console.log(`  ✓ Created ${reservationCount} reservations with payments`);

  const queueTargetSlot = occupiedSlots[0];
  if (queueTargetSlot) {
    await prisma.waitlistEntry.createMany({
      data: [
        {
          userId: user.id,
          slotId: queueTargetSlot.id,
          vehiclePlate: 'B 7711 QWE',
          hours: 2,
          status: 'waiting',
        },
        {
          userId: user2.id,
          slotId: queueTargetSlot.id,
          vehiclePlate: 'B 8822 RTY',
          hours: 3,
          status: 'notified',
          notifiedAt: new Date(),
          confirmDeadlineAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      ],
    });
    console.log('  ✓ Created waitlist demo entries');
  }

  const recurringSlot = slots.find((s) => s.status === 'available') || slots[0];
  if (recurringSlot) {
    await prisma.recurringBooking.createMany({
      data: [
        {
          userId: user.id,
          slotId: recurringSlot.id,
          vehiclePlate: 'B 5555 AAA',
          durationHours: 2,
          recurrence: 'daily',
          weekdays: [],
          startHour: 8,
          startMinute: 0,
          autoJoinWaitlist: true,
          isActive: true,
          nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
        },
        {
          userId: user2.id,
          slotId: recurringSlot.id,
          vehiclePlate: 'B 6666 BBB',
          durationHours: 3,
          recurrence: 'weekly',
          weekdays: [1, 2, 3, 4, 5],
          startHour: 9,
          startMinute: 30,
          autoJoinWaitlist: true,
          isActive: true,
          nextRunAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      ],
    });
    console.log('  ✓ Created recurring booking demo entries');
  }

  // ── 6. Audit Logs ───────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id,    action: 'CREATE', entity: 'ParkingLot', entityId: lot.id,  metadata: { name: lot.name } },
      { userId: operator.id, action: 'UPDATE', entity: 'ParkingSlot', entityId: slots[0].id, metadata: { status: 'occupied' } },
      { userId: user.id,     action: 'CREATE', entity: 'Reservation', entityId: null, metadata: { vehicle: 'B 1234 XYZ' } },
    ],
  });

  console.log('  ✓ Created audit logs');

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('📋 Demo credentials:');
  console.log('   Admin    → admin@hygiopark.io    / password123');
  console.log('   Petugas  ? operator@hygiopark.io / password123');
  console.log('   Owner    ? user@hygiopark.io     / password123');
  console.log('   Owner 2  ? siti@hygiopark.io     / password123\\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



