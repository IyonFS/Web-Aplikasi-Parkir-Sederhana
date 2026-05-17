// src/socket/socket.server.js
// Inisialisasi Socket.io + autentikasi JWT + manajemen room

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middlewares/auth.middleware");

let io = null;

// ── Inisialisasi Socket.io ─────────────────────────────────────────────────
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Reconnection settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Middleware: Verifikasi JWT ─────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Token tidak ada — akses ditolak"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // { id, email, role, name }
      next();
    } catch (err) {
      next(new Error("Token tidak valid atau sudah kadaluarsa"));
    }
  });

  // ── Event Handlers ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(
      `🔌 WS connected: ${socket.user.name} (${socket.user.role}) [${socket.id}]`,
    );

    // Gabung room global untuk semua user yang login
    socket.join("global");

    // Gabung room berdasarkan role
    socket.join(`role:${socket.user.role}`);

    // Client minta join room lot tertentu
    socket.on("join:lot", ({ lotId }) => {
      if (!lotId) return;
      socket.join(`lot:${lotId}`);
      console.log(`   → ${socket.user.name} joined lot:${lotId}`);
    });

    // Client keluar dari room lot
    socket.on("leave:lot", ({ lotId }) => {
      if (!lotId) return;
      socket.leave(`lot:${lotId}`);
    });

    // Disconnect
    socket.on("disconnect", (reason) => {
      console.log(`🔌 WS disconnected: ${socket.user.name} [${reason}]`);
    });

    // Error handler per socket
    socket.on("error", (err) => {
      console.error(`WS error [${socket.user.name}]:`, err.message);
    });
  });

  console.log("✅ WebSocket server siap");
  return io;
}

// ── Getter untuk io instance ───────────────────────────────────────────────
function getIO() {
  if (!io)
    throw new Error(
      "Socket.io belum diinisialisasi. Panggil initSocket() dulu.",
    );
  return io;
}

// ── Emitter helpers ────────────────────────────────────────────────────────

// Broadcast perubahan status slot ke semua user
function emitSlotUpdated(slot) {
  if (!io) return;
  const payload = {
    id: slot.id,
    number: slot.number,
    floor: slot.floor,
    status: slot.status,
    type: slot.type,
    pricePerHour: slot.pricePerHour,
    lotId: slot.lotId,
    updatedAt: new Date().toISOString(),
  };
  // Kirim ke room lot spesifik + room global
  io.to(`lot:${slot.lotId}`).emit("slot:updated", payload);
  io.to("global").emit("slot:updated", payload);
  console.log(`📡 slot:updated → ${slot.number} (${slot.status})`);
}

// Broadcast reservasi baru dikonfirmasi
function emitReservationCreated(reservation) {
  if (!io) return;
  const payload = {
    id: reservation.id,
    slotId: reservation.slotId,
    slotNumber: reservation.slotNumber,
    userId: reservation.userId,
    vehiclePlate: reservation.vehiclePlate,
    hours: reservation.hours,
    totalAmount: reservation.totalAmount,
    status: reservation.status,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    createdAt: reservation.createdAt,
  };
  io.to("global").emit("reservation:created", payload);
  // Notif personal ke user yang booking
  io.to(`role:user`).emit("reservation:confirmed", payload);
  console.log(
    `📡 reservation:created → ${reservation.slotNumber} by ${reservation.vehiclePlate}`,
  );
}

// Broadcast reservasi dibatalkan
function emitReservationCancelled(reservation) {
  if (!io) return;
  const payload = {
    id: reservation.id,
    slotId: reservation.slotId,
    slotNumber: reservation.slotNumber,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  io.to("global").emit("reservation:cancelled", payload);
  console.log(`📡 reservation:cancelled → ${reservation.slotNumber}`);
}

function emitReservationCompleted(reservation) {
  if (!io) return;
  const payload = {
    id: reservation.id,
    slotNumber: reservation.slotNumber,
    status: "completed",
    endTime: reservation.endTime,
    updatedAt: reservation.updatedAt || new Date().toISOString(),
  };
  io.to("global").emit("reservation:completed", payload);
  console.log(`📡 reservation:completed → ${reservation.slotNumber}`);
}

// Broadcast summary/statistik ter-update
function emitSummaryUpdated(summary) {
  if (!io) return;
  io.to("global").emit("summary:updated", summary);
}

// Kirim notifikasi ke user tertentu (by userId)
function emitToUser(userId, event, data) {
  if (!io) return;
  // Cari socket by userId
  for (const [, socket] of io.sockets.sockets) {
    if (socket.user?.id === userId) {
      socket.emit(event, data);
    }
  }
}

// Hitung jumlah user yang sedang online
function getOnlineCount() {
  if (!io) return 0;
  return io.sockets.sockets.size;
}

module.exports = {
  emitReservationExtended,
  emitReservationCompleted,
  emitWaitlistUpdated,
  emitRecurringRun,
  initSocket,
  getIO,
  emitSlotUpdated,
  emitReservationCreated,
  emitReservationCancelled,
  emitSummaryUpdated,
  emitToUser,
  getOnlineCount,
};

// Broadcast extend reservation
function emitReservationExtended(reservation) {
  if (!io) return;
  io.to("global").emit("reservation:extended", {
    id: reservation.id,
    slotNumber: reservation.slotNumber,
    endTime: reservation.endTime,
    hours: reservation.hours,
    totalAmount: reservation.totalAmount,
    updatedAt: new Date().toISOString(),
  });
  console.log(`📡 reservation:extended → ${reservation.slotNumber}`);
}

function emitWaitlistUpdated(payload) {
  if (!io) return;
  io.to("global").emit("waitlist:updated", payload);
}

function emitRecurringRun(payload) {
  if (!io) return;
  io.to("global").emit("recurring:run", payload);
}

