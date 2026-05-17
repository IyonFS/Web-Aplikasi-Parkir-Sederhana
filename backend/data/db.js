const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const db = {
  users: [],
  slots: [],
  reservations: [],
};

function seedUsers() {
  const password = bcrypt.hashSync('password123', 10);
  db.users = [
    {
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@hygiopark.io',
      password,
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Nyoman Ayu',
      email: 'operator@hygiopark.io',
      password,
      role: 'operator',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Yuharam',
      email: 'user@hygiopark.io',
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    },
  ];
}

function seedSlots() {
  const floors = ['A', 'B', 'C'];
  const types = ['standard', 'standard', 'standard', 'ev', 'disabled'];
  const slots = [];

  floors.forEach((floor) => {
    for (let i = 1; i <= 8; i += 1) {
      const type = types[Math.floor(Math.random() * types.length)];
      slots.push({
        id: uuidv4(),
        number: `${floor}${String(i).padStart(2, '0')}`,
        floor,
        type,
        status: Math.random() > 0.35 ? 'available' : 'occupied',
        pricePerHour: type === 'ev' ? 8 : type === 'disabled' ? 3 : 5,
        createdAt: new Date().toISOString(),
      });
    }
  });

  db.slots = slots;
}

function seedReservations() {
  const userDriver = db.users.find((user) => user.role === 'user');
  const occupiedSlots = db.slots.filter((slot) => slot.status === 'occupied').slice(0, 3);

  occupiedSlots.forEach((slot, idx) => {
    const start = new Date(Date.now() - idx * 3600000);
    const end = new Date(start.getTime() + 2 * 3600000);
    const hours = 2;

    db.reservations.push({
      id: uuidv4(),
      userId: userDriver.id,
      slotId: slot.id,
      slotNumber: slot.number,
      vehiclePlate: `B ${1234 + idx * 111} XYZ`,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      hours,
      totalAmount: hours * slot.pricePerHour,
      status: 'active',
      createdAt: new Date(Date.now() - idx * 3600000 - 600000).toISOString(),
    });
  });
}

function initDb() {
  seedUsers();
  seedSlots();
  seedReservations();
  console.log('In-memory database seeded');
  console.log(
    `Users: ${db.users.length} | Slots: ${db.slots.length} | Reservations: ${db.reservations.length}`,
  );
}

module.exports = { db, initDb };


