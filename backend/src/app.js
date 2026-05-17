require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const prisma = require("./config/db");
const apiRoutes = require("./routes");

const app = express();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Terlalu banyak request. Coba lagi sebentar." },
});

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedFrontend = process.env.FRONTEND_URL;
      if (!origin) return callback(null, true);
      if (allowedFrontend && origin === allowedFrontend) {
        return callback(null, true);
      }
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(
    `${new Date().toISOString().slice(11, 19)} ${req.method} ${req.path}`,
  );
  next();
});

app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api", apiLimiter, apiRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const { getOnlineCount } = require("./socket/socket.server");
    res.json({
      status: "ok",
      db: "connected",
      ws: "active",
      online: getOnlineCount(),
      midtrans: process.env.MIDTRANS_SERVER_KEY ? "configured" : "demo_mode",
      ts: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.use((_req, res) =>
  res.status(404).json({ error: "Route tidak ditemukan" }),
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;

